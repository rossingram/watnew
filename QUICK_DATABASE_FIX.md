# Quick Database Persistence Fix - Railway Volume

This is the **fastest** way to make your database persist across deployments without migrating to PostgreSQL.

## Step 1: Create Railway Volume

1. Go to your **backend service** in Railway (watnew-production)
2. Click **Settings** → **Volumes**
3. Click **"Create Volume"**
4. Name it: `database-storage`
5. Mount path: `/app/data`
6. Click **"Create"**

## Step 2: Update Environment Variable

1. Still in your backend service settings
2. Go to **Variables**
3. Add/update:
   ```
   DATABASE_PATH=/app/data/database.json
   ```

## Step 3: Update server/index.js

The code already supports `DATABASE_PATH` environment variable! It's already set up in the current code:

```javascript
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.json');
```

So you just need to:
1. Commit and push the current code (if not already done)
2. Railway will redeploy
3. The database will now persist in the volume!

## Step 4: Verify

1. Create a test user
2. Redeploy the backend (or wait for auto-deploy)
3. Check if the user still exists after deployment

## That's It!

Your `database.json` file will now be stored in the Railway volume at `/app/data/database.json`, which persists across deployments.

**Note**: This is a temporary solution. For production, consider migrating to PostgreSQL (see `DATABASE_MIGRATION.md`), but this volume solution will work fine for now.
