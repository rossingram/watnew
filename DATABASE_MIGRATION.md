# Database Migration Guide - Railway PostgreSQL

Currently, Watnew uses `lowdb` (JSON file) which doesn't persist across Railway deployments. This guide shows how to migrate to Railway PostgreSQL.

## Step 1: Create PostgreSQL Database in Railway

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will automatically create a PostgreSQL database
3. Copy the connection details (you'll see them in the service):
   - `DATABASE_URL` (this is what we'll use)
   - Or individual: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

## Step 2: Install PostgreSQL Client

```bash
cd server
npm install pg
```

## Step 3: Create Database Schema

Create `server/db/schema.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  revenue_model VARCHAR(50) NOT NULL,
  assumptions JSONB NOT NULL,
  results JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

## Step 4: Create Database Connection Module

Create `server/db/index.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Initialize schema
async function initializeSchema() {
  const fs = require('fs');
  const path = require('path');
  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  
  try {
    await pool.query(schemaSQL);
    console.log('✅ Database schema initialized');
  } catch (error) {
    if (error.code !== '42P07') { // Table already exists
      console.error('Error initializing schema:', error);
    }
  }
}

initializeSchema();

module.exports = pool;
```

## Step 5: Update server/index.js

Replace lowdb with PostgreSQL:

```javascript
// Remove lowdb imports
// const low = require('lowdb');
// const FileSync = require('lowdb/adapters/FileSync');

// Add PostgreSQL
const pool = require('./db');

// Remove database initialization
// const adapter = new FileSync(path.join(__dirname, 'database.json'));
// const db = low(adapter);
// db.defaults({ users: [], scenarios: [], subscriptions: [] }).write();
```

## Step 6: Update User Routes

Replace lowdb user operations with PostgreSQL:

**Registration:**
```javascript
app.post('/api/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, hashedPassword]
    );

    const user = {
      id: result.rows[0].id,
      email: result.rows[0].email
    };

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    res.json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});
```

**Login:**
```javascript
app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});
```

## Step 7: Update Scenario Routes

Similar pattern - replace lowdb queries with PostgreSQL:

```javascript
// Get scenarios
app.get('/api/scenarios', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scenarios WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Error fetching scenarios' });
  }
});

// Create scenario
app.post('/api/scenarios', authenticateToken, async (req, res) => {
  try {
    const { name, revenue_model, assumptions, results } = req.body;
    const result = await pool.query(
      'INSERT INTO scenarios (user_id, name, revenue_model, assumptions, results) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, name, revenue_model, JSON.stringify(assumptions), JSON.stringify(results)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Error creating scenario' });
  }
});
```

## Step 8: Update Subscription Routes

Similar pattern for subscriptions - use PostgreSQL instead of lowdb.

## Step 9: Add Environment Variable

In Railway, add to your backend service:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

Railway automatically provides this when you create a PostgreSQL service.

## Step 10: Deploy

1. Commit all changes
2. Push to GitHub
3. Railway will automatically redeploy
4. Check logs to ensure database connection is successful

## Migration from Existing Data

If you have existing users in lowdb, you can create a migration script to move data to PostgreSQL (optional).

## Benefits

- ✅ Data persists across deployments
- ✅ Better performance
- ✅ Scalable
- ✅ ACID compliance
- ✅ Built-in backups (Railway handles this)

## Quick Alternative: Railway Volume (Temporary Fix)

If you want a quick fix without migrating to PostgreSQL, you can use a Railway volume:

1. In Railway, go to your backend service
2. Settings → Volumes → Create Volume
3. Mount it to `/app/data`
4. Update `DATABASE_PATH` env var to `/app/data/database.json`

This will persist the JSON file, but PostgreSQL is still recommended for production.
