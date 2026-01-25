# Deployment Guide for Watnew

This guide covers deploying Watnew to production using Google Cloud Platform (GCP) with your custom domain `watnew.me`.

## Architecture Overview

- **Frontend (React)**: Deploy to static hosting (GCP Cloud Storage + CDN, or Netlify/Vercel)
- **Backend (Node.js/Express)**: Deploy to GCP Cloud Run
- **Database**: Currently using `lowdb` (JSON file). For production, consider migrating to Cloud Firestore or Cloud SQL for better reliability.

## Prerequisites

1. Google Cloud Platform account with billing enabled
2. `gcloud` CLI installed ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. Domain `watnew.me` configured (DNS access)
4. Stripe account with production API keys

## Step 1: Prepare for Deployment

### 1.1 Update Environment Variables

Create production environment files (don't commit these):

**`server/.env.production`**:
```env
PORT=8080
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
NODE_ENV=production
```

### 1.2 Update API URLs

Update `client/src/context/AuthContext.js` to use production API URL:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://api.watnew.me/api';
```

Update `client/package.json` to build with the production API URL:

```json
"scripts": {
  "build": "REACT_APP_API_URL=https://api.watnew.me/api react-scripts build"
}
```

### 1.3 Update CORS Settings

Update `server/index.js` to allow your production domain:

```javascript
app.use(cors({
  origin: ['https://watnew.me', 'https://www.watnew.me'],
  credentials: true
}));
```

## Step 2: Deploy Backend to Cloud Run

### 2.1 Create Dockerfile for Backend

Create `server/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
```

### 2.2 Create .dockerignore

Create `server/.dockerignore`:
```
node_modules
.env
.env.local
.env.*.local
database.json
*.log
.DS_Store
```

### 2.3 Build and Deploy to Cloud Run

```bash
# Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# Build the container image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/watnew-api

# Deploy to Cloud Run
gcloud run deploy watnew-api \
  --image gcr.io/YOUR_PROJECT_ID/watnew-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="PORT=8080,JWT_SECRET=your-secret,STRIPE_SECRET_KEY=sk_live_...,STRIPE_WEBHOOK_SECRET=whsec_...,STRIPE_PUBLISHABLE_KEY=pk_live_..." \
  --set-secrets="JWT_SECRET=jwt-secret:latest,STRIPE_SECRET_KEY=stripe-secret:latest" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# Map custom domain
gcloud run domain-mappings create \
  --service watnew-api \
  --domain api.watnew.me \
  --region us-central1
```

**Better: Use Secret Manager for sensitive data**

```bash
# Create secrets
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "sk_live_..." | gcloud secrets create stripe-secret-key --data-file=-
echo -n "whsec_..." | gcloud secrets create stripe-webhook-secret --data-file=-

# Deploy with secrets
gcloud run deploy watnew-api \
  --image gcr.io/YOUR_PROJECT_ID/watnew-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --update-secrets JWT_SECRET=jwt-secret:latest,STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest \
  --set-env-vars="PORT=8080,NODE_ENV=production,STRIPE_PUBLISHABLE_KEY=pk_live_..." \
  --memory 512Mi
```

## Step 3: Deploy Frontend

### Option A: GCP Cloud Storage + Cloud CDN (Recommended for GCP)

```bash
# Build React app
cd client
npm run build

# Create Cloud Storage bucket
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://watnew.me

# Upload files
gsutil -m cp -r build/* gs://watnew.me/

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://watnew.me

# Set up Cloud CDN
gcloud compute backend-buckets create watnew-bucket \
  --gcs-bucket-name=watnew.me

# Create URL map
gcloud compute url-maps create watnew-map \
  --default-backend-bucket=watnew-bucket

# Create HTTPS proxy
gcloud compute target-https-proxies create watnew-https-proxy \
  --url-map=watnew-map \
  --ssl-certificates=watnew-ssl-cert

# Create forwarding rule
gcloud compute forwarding-rules create watnew-https-rule \
  --global \
  --target-https-proxy=watnew-https-proxy \
  --ports=443
```

### Option B: Netlify (Easier, Recommended)

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build the app: `cd client && npm run build`
3. Deploy: `netlify deploy --prod --dir=build`
4. Configure custom domain in Netlify dashboard
5. Update DNS to point to Netlify

### Option C: Vercel (Also Easy)

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `cd client && vercel --prod`
3. Configure custom domain in Vercel dashboard

## Step 4: Configure DNS

Point your domain to the services:

```
# For API subdomain
api.watnew.me  CNAME  ->  Cloud Run URL (e.g., watnew-api-xxxxx.run.app)

# For main domain (if using Netlify/Vercel)
watnew.me      A      ->  Netlify/Vercel IP
www.watnew.me  CNAME  ->  watnew.me
```

## Step 5: Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://api.watnew.me/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret and update your Cloud Run environment variable

## Step 6: Database Considerations

**Current Setup (lowdb)**: The JSON file will be lost on each Cloud Run deployment. 

**Recommended Solutions**:

1. **Cloud Firestore** (NoSQL, easy migration)
2. **Cloud SQL** (PostgreSQL/MySQL, more robust)
3. **Persistent Volume** (Cloud Run supports this, but Firestore is better)

### Quick Migration to Firestore

Install Firestore:
```bash
npm install @google-cloud/firestore
```

Update `server/index.js` to use Firestore instead of lowdb. This requires code changes but provides better reliability.

## Step 7: SSL Certificates

GCP Cloud Run automatically provides SSL certificates. For Cloud Storage + CDN, you'll need to:
1. Create a Google-managed SSL certificate
2. Configure it in the load balancer

## Step 8: Monitoring & Logging

```bash
# View logs
gcloud run services logs read watnew-api --limit 50

# Set up monitoring
# Enable Cloud Monitoring in GCP Console
```

## Alternative Deployment Options

### Railway (Easiest Full-Stack Option)
- Supports both frontend and backend
- Automatic SSL
- Simple deployment from GitHub
- Free tier available

### Render
- Similar to Railway
- Good for full-stack apps
- Free tier available

### DigitalOcean App Platform
- Simple deployment
- Good pricing
- Supports both frontend and backend

## Post-Deployment Checklist

- [ ] Test user registration
- [ ] Test login
- [ ] Test subscription flow
- [ ] Verify Stripe webhooks are working
- [ ] Test model creation
- [ ] Test export functionality
- [ ] Verify CORS is working
- [ ] Check SSL certificates
- [ ] Set up monitoring/alerts
- [ ] Configure backup strategy for database

## Troubleshooting

### CORS Errors
- Verify CORS origin includes your production domain
- Check that API URL is correct in frontend

### Database Not Persisting
- Consider migrating to Firestore or Cloud SQL
- Or use Cloud Run persistent volumes

### Webhook Not Working
- Verify webhook URL is accessible
- Check webhook secret matches
- View Cloud Run logs for errors

## Cost Estimation (GCP)

- **Cloud Run**: ~$0.40 per million requests (free tier: 2 million/month)
- **Cloud Storage**: ~$0.020 per GB/month
- **Cloud CDN**: ~$0.08 per GB egress
- **Estimated monthly cost**: $10-50 depending on traffic

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions)
2. Implement database migration to Firestore
3. Set up monitoring and alerts
4. Configure backup strategy
5. Set up staging environment
