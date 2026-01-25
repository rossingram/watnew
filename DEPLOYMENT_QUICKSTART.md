# Quick Deployment Guide - Railway (Easiest Option)

Railway is the easiest way to deploy your full-stack app. It handles both frontend and backend automatically.

## Why Railway?

- ✅ Deploys both frontend and backend
- ✅ Automatic SSL certificates
- ✅ Environment variable management
- ✅ Automatic deployments from GitHub
- ✅ Free tier available ($5 credit/month)
- ✅ Simple setup

## Step 1: Prepare Your Code

### Update CORS in `server/index.js`

The CORS configuration has already been updated to support production domains.

### Update API URL for Production

The frontend already uses `process.env.REACT_APP_API_URL`, so we just need to set it during build.

## Step 2: Deploy to Railway

### 2.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

### 2.2 Deploy Backend

1. Click "New" → "GitHub Repo"
2. Select your `watnew` repository
3. Railway will detect it's a Node.js app
4. Set the **Root Directory** to `server`
5. Add environment variables:
   ```
   PORT=8080
   JWT_SECRET=your-super-secret-jwt-key
   STRIPE_SECRET_KEY=sk_live_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_secret
   STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   NODE_ENV=production
   ```
6. Railway will automatically deploy
7. Copy the generated URL (e.g., `watnew-api.up.railway.app`)

### 2.3 Deploy Frontend

1. In the same project, click "New" → "GitHub Repo" again
2. Select the same repository
3. Set **Root Directory** to `client`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://watnew-api.up.railway.app/api
   ```
5. Railway will build and deploy
6. Copy the frontend URL

### 2.4 Configure Custom Domain

1. Go to your backend service → Settings → Domains
2. Add custom domain: `api.watnew.me`
3. Follow DNS instructions (add CNAME record)
4. Repeat for frontend: `watnew.me` and `www.watnew.me`

## Step 3: Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.watnew.me/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret and update in Railway environment variables

## Step 4: Database Persistence

**Important**: Railway's file system is ephemeral. Your `database.json` will be lost on each deployment.

### Quick Fix: Use Railway Volume

1. Go to your backend service → Volumes
2. Create a new volume
3. Mount it to `/app/data`
4. Update `server/index.js` to use `/app/data/database.json`

Or better: Migrate to a real database (PostgreSQL, MongoDB, etc.)

## Alternative: Render.com

Render is similar to Railway and also very easy:

1. Sign up at [render.com](https://render.com)
2. Create a new "Web Service" for backend
3. Create a new "Static Site" for frontend
4. Connect GitHub repo
5. Set environment variables
6. Deploy!

## Cost Comparison

- **Railway**: $5/month free credit, then pay-as-you-go (~$5-20/month)
- **Render**: Free tier available, then ~$7/month per service
- **GCP Cloud Run**: Pay-per-use, typically $10-50/month
- **Netlify (frontend) + Railway (backend)**: Free tier available

## Recommended Setup

For `watnew.me`:

1. **Backend**: Railway or Render (easy deployment)
2. **Frontend**: Netlify or Vercel (free, fast CDN)
3. **Database**: Consider migrating to Railway PostgreSQL or Render PostgreSQL

This gives you:
- Easy deployment
- Automatic SSL
- Good performance
- Reasonable costs
