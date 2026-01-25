const express = require('express');
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');
const stripe = require('stripe');
require('dotenv').config();

const app = express();
const net = require('net');
const DEFAULT_PORT = 5001; // Changed to 5001 to avoid macOS AirPlay conflict
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const stripeClient = STRIPE_SECRET_KEY ? stripe(STRIPE_SECRET_KEY) : null;

if (!stripeClient && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  Stripe not configured - subscription features will not work');
  console.warn('   Set STRIPE_SECRET_KEY in server/.env to enable payments');
}

// Function to check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Find available port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (port < startPort + 10) {
    const available = await isPortAvailable(port);
    if (available) {
      return port;
    }
    port++;
  }
  throw new Error(`No available port found in range ${startPort}-${startPort + 9}`);
}

const PORT = process.env.PORT ? parseInt(process.env.PORT) : null;

// CORS configuration - allow production domains
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://watnew.me', 'https://www.watnew.me']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Initialize database (needed for webhook)
// Use persistent volume path in production, local path in development
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

// Set default database structure
db.defaults({
  users: [],
  scenarios: [],
  subscriptions: []
}).write();

console.log('Database initialized');

// Helper functions for database operations
function getNextId(collection) {
  const items = db.get(collection).value();
  if (items.length === 0) return 1;
  return Math.max(...items.map(item => item.id || 0)) + 1;
}

// Stripe webhook endpoint (must be before express.json())
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripeClient || !STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Webhooks not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        if (session.mode === 'subscription') {
          const subscription = await stripeClient.subscriptions.retrieve(session.subscription);
          const userId = parseInt(session.client_reference_id);
          
          // Create or update subscription in database
          const existing = db.get('subscriptions')
            .find({ user_id: userId })
            .value();

          // Safely convert Stripe timestamp
          let currentPeriodEnd;
          try {
            currentPeriodEnd = subscription.currentPeriodEnd 
              ? new Date(subscription.currentPeriodEnd * 1000).toISOString()
              : new Date().toISOString();
          } catch (e) {
            console.error('Error converting currentPeriodEnd in webhook:', e);
            currentPeriodEnd = new Date().toISOString();
          }

          const subscriptionData = {
            user_id: userId,
            stripeSubscriptionId: subscription.id,
            customerId: subscription.customer,
            status: subscription.status,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
            updated_at: new Date().toISOString()
          };

          if (existing) {
            db.get('subscriptions')
              .find({ user_id: userId })
              .assign(subscriptionData)
              .write();
          } else {
            db.get('subscriptions')
              .push({
                id: getNextId('subscriptions'),
                ...subscriptionData,
                created_at: new Date().toISOString()
              })
              .write();
          }
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const subRecord = db.get('subscriptions')
          .find({ stripeSubscriptionId: subscription.id })
          .value();

        if (subRecord) {
          // Safely convert Stripe timestamp
          let currentPeriodEnd;
          try {
            currentPeriodEnd = subscription.currentPeriodEnd 
              ? new Date(subscription.currentPeriodEnd * 1000).toISOString()
              : new Date().toISOString();
          } catch (e) {
            console.error('Error converting currentPeriodEnd in webhook update:', e);
            currentPeriodEnd = new Date().toISOString();
          }

          db.get('subscriptions')
            .find({ stripeSubscriptionId: subscription.id })
            .assign({
              status: subscription.status,
              currentPeriodEnd: currentPeriodEnd,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
              updated_at: new Date().toISOString()
            })
            .write();
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// All other routes use JSON (after webhook route)
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check subscription status
const requireSubscription = async (req, res, next) => {
  try {
    const subscription = db.get('subscriptions')
      .find({ user_id: req.user.userId })
      .value();

    // Allow 'active' or 'trialing' status
    if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
      return res.status(403).json({ 
        error: 'Active subscription required',
        requiresSubscription: true 
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking subscription' });
  }
};

// Auth Routes
app.post('/api/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Registration validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = db.get('users').find({ email }).value();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: getNextId('users'),
      email,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    db.get('users').push(newUser).write();

    const token = jwt.sign({ userId: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newUser.id, email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = db.get('users').find({ email }).value();

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Scenarios Routes - require subscription
app.get('/api/scenarios', authenticateToken, requireSubscription, (req, res) => {
  try {
    const scenarios = db.get('scenarios')
      .filter({ user_id: req.user.userId })
      .orderBy(['updated_at'], ['desc'])
      .value();

    res.json(scenarios.map(scenario => ({
      id: scenario.id,
      name: scenario.name,
      revenue_model: scenario.revenue_model,
      assumptions: scenario.assumptions,
      results: scenario.results,
      created_at: scenario.created_at,
      updated_at: scenario.updated_at
    })));
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/scenarios/:id', authenticateToken, requireSubscription, (req, res) => {
  try {
    const scenario = db.get('scenarios')
      .find({ id: parseInt(req.params.id), user_id: req.user.userId })
      .value();

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    res.json({
      id: scenario.id,
      name: scenario.name,
      revenue_model: scenario.revenue_model,
      assumptions: scenario.assumptions,
      results: scenario.results,
      created_at: scenario.created_at,
      updated_at: scenario.updated_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/scenarios', authenticateToken, requireSubscription, [
  body('name').notEmpty().trim(),
  body('revenue_model').isIn(['one-time', 'subscription', 'hybrid']),
  body('assumptions').isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, revenue_model, assumptions, results } = req.body;

  try {
    const newScenario = {
      id: getNextId('scenarios'),
      user_id: req.user.userId,
      name,
      revenue_model,
      assumptions,
      results: results || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.get('scenarios').push(newScenario).write();

    res.status(201).json({
      id: newScenario.id,
      name,
      revenue_model,
      assumptions,
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Error saving scenario' });
  }
});

app.put('/api/scenarios/:id', authenticateToken, requireSubscription, [
  body('name').optional().notEmpty().trim(),
  body('assumptions').optional().isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, assumptions, results } = req.body;
  const scenarioId = parseInt(req.params.id);

  try {
    const scenario = db.get('scenarios')
      .find({ id: scenarioId, user_id: req.user.userId })
      .value();

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (assumptions) updates.assumptions = assumptions;
    if (results !== undefined) updates.results = results;
    updates.updated_at = new Date().toISOString();

    db.get('scenarios')
      .find({ id: scenarioId, user_id: req.user.userId })
      .assign(updates)
      .write();

    res.json({ message: 'Scenario updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating scenario' });
  }
});

app.delete('/api/scenarios/:id', authenticateToken, requireSubscription, (req, res) => {
  try {
    const scenarioId = parseInt(req.params.id);
    const scenario = db.get('scenarios')
      .find({ id: scenarioId, user_id: req.user.userId })
      .value();

    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    db.get('scenarios')
      .remove({ id: scenarioId, user_id: req.user.userId })
      .write();

    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Calculate projections endpoint - requires subscription
app.post('/api/calculate', authenticateToken, requireSubscription, [
  body('revenue_model').isIn(['one-time', 'subscription', 'hybrid']),
  body('assumptions').isObject()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { revenue_model, assumptions } = req.body;
  const results = calculateProjections(revenue_model, assumptions);
  res.json(results);
});

// Stripe subscription routes
app.get('/api/subscription/status', authenticateToken, async (req, res) => {
  try {
    const subscription = db.get('subscriptions')
      .find({ user_id: req.user.userId })
      .value();

    if (!subscription) {
      return res.json({ 
        hasSubscription: false,
        status: null 
      });
    }

    // If we have Stripe configured, always fetch the latest subscription data
    if (stripeClient && subscription.stripeSubscriptionId) {
      try {
        const stripeSub = await stripeClient.subscriptions.retrieve(subscription.stripeSubscriptionId);
        
        // Safely convert Stripe timestamp to ISO string
        let currentPeriodEnd;
        try {
          const timestamp = typeof stripeSub.currentPeriodEnd === 'number' 
            ? stripeSub.currentPeriodEnd 
            : parseInt(stripeSub.currentPeriodEnd);
          
          if (isNaN(timestamp)) {
            console.error('Invalid timestamp from Stripe:', stripeSub.currentPeriodEnd);
            currentPeriodEnd = subscription.currentPeriodEnd || new Date().toISOString();
          } else {
            currentPeriodEnd = new Date(timestamp * 1000).toISOString();
          }
        } catch (e) {
          console.error('Error converting currentPeriodEnd in status check:', e);
          currentPeriodEnd = subscription.currentPeriodEnd || new Date().toISOString();
        }

        // Always update local database with latest Stripe data
        db.get('subscriptions')
          .find({ user_id: req.user.userId })
          .assign({
            status: stripeSub.status,
            currentPeriodEnd: currentPeriodEnd,
            cancelAtPeriodEnd: stripeSub.cancelAtPeriodEnd || false,
            updated_at: new Date().toISOString()
          })
          .write();
        
        // Always return the latest data from Stripe
        return res.json({
          hasSubscription: true,
          status: stripeSub.status,
          currentPeriodEnd: currentPeriodEnd,
          cancelAtPeriodEnd: stripeSub.cancelAtPeriodEnd || false
        });
      } catch (stripeError) {
        console.error('Error fetching subscription from Stripe:', stripeError);
        // Fall through to return local data
      }
    }

    // Return local data if Stripe fetch failed or not configured
    res.json({
      hasSubscription: true,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Error fetching subscription status' });
  }
});

app.post('/api/subscription/create-checkout', authenticateToken, async (req, res) => {
  if (!stripeClient) {
    console.error('Stripe checkout attempted but Stripe is not configured');
    return res.status(500).json({ 
      error: 'Stripe not configured. Please set STRIPE_SECRET_KEY in server/.env' 
    });
  }

  try {
    const user = db.get('users').find({ id: req.user.userId }).value();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const origin = req.headers.origin || req.headers.referer || 'http://localhost:3000';
    const baseUrl = origin.replace(/\/$/, ''); // Remove trailing slash
    
    console.log('Creating Stripe checkout session for user:', user.email);
    
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Watnew Pro',
            description: 'Unlimited financial model creation - $99/month'
          },
          recurring: {
            interval: 'month'
          },
          unit_amount: 9900 // $99.00 in cents
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      customer_email: user.email,
      client_reference_id: req.user.userId.toString(),
      metadata: {
        userId: req.user.userId.toString()
      }
    });

    console.log('Checkout session created:', session.id);
    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: error.message || 'Error creating checkout session',
      details: error.type || 'Unknown error'
    });
  }
});

app.post('/api/subscription/create-portal', authenticateToken, async (req, res) => {
  if (!stripeClient) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const subscription = db.get('subscriptions')
      .find({ user_id: req.user.userId })
      .value();

    if (!subscription || !subscription.customerId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const session = await stripeClient.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: `${req.headers.origin || 'http://localhost:3000'}/billing`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    res.status(500).json({ error: 'Error creating portal session' });
  }
});

// Sync subscription from Stripe (useful if webhook didn't fire)
app.post('/api/subscription/sync', authenticateToken, async (req, res) => {
  if (!stripeClient) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const user = db.get('users').find({ id: req.user.userId }).value();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Syncing subscription for user:', user.email);
    
    // Search for customer by email
    const customers = await stripeClient.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: 'No Stripe customer found for this account' });
    }

    const customer = customers.data[0];
    console.log('Found customer:', customer.id);
    
    // Get all subscriptions for this customer
    const subscriptions = await stripeClient.subscriptions.list({
      customer: customer.id,
      limit: 10
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No subscriptions found for this customer' });
    }

    console.log('Found subscriptions:', subscriptions.data.map(s => ({ id: s.id, status: s.status })));

    // Use the most recent active subscription
    const activeSub = subscriptions.data.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    ) || subscriptions.data[0];

    console.log('Using subscription:', activeSub.id, 'Status:', activeSub.status);
    console.log('currentPeriodEnd value:', activeSub.currentPeriodEnd, 'Type:', typeof activeSub.currentPeriodEnd);

    // Save to database
    const existing = db.get('subscriptions')
      .find({ user_id: req.user.userId })
      .value();

    // Safely convert Stripe timestamp to ISO string
    let currentPeriodEnd;
    if (activeSub.currentPeriodEnd) {
      try {
        // Stripe returns Unix timestamp in seconds
        const timestamp = typeof activeSub.currentPeriodEnd === 'number' 
          ? activeSub.currentPeriodEnd 
          : parseInt(activeSub.currentPeriodEnd);
        
        if (isNaN(timestamp)) {
          console.error('Invalid timestamp:', activeSub.currentPeriodEnd);
          currentPeriodEnd = new Date().toISOString();
        } else {
          currentPeriodEnd = new Date(timestamp * 1000).toISOString();
        }
      } catch (e) {
        console.error('Error converting currentPeriodEnd:', e, 'Value:', activeSub.currentPeriodEnd);
        currentPeriodEnd = new Date().toISOString();
      }
    } else {
      console.warn('No currentPeriodEnd found, using current date');
      currentPeriodEnd = new Date().toISOString();
    }

    const subscriptionData = {
      user_id: req.user.userId,
      stripeSubscriptionId: activeSub.id,
      customerId: customer.id,
      status: activeSub.status,
      currentPeriodEnd: currentPeriodEnd,
      cancelAtPeriodEnd: activeSub.cancelAtPeriodEnd || false,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      db.get('subscriptions')
        .find({ user_id: req.user.userId })
        .assign(subscriptionData)
        .write();
      console.log('Updated existing subscription record');
    } else {
      db.get('subscriptions')
        .push({
          id: getNextId('subscriptions'),
          ...subscriptionData,
          created_at: new Date().toISOString()
        })
        .write();
      console.log('Created new subscription record');
    }

    res.json({
      success: true,
      subscription: {
        hasSubscription: true,
        status: activeSub.status,
        currentPeriodEnd: subscriptionData.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('Error syncing subscription:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Error syncing subscription',
      type: error.type || 'Unknown error'
    });
  }
});

function calculateProjections(revenueModel, assumptions) {
  const periods = assumptions.timeFrame || 12;
  const projections = [];
  let totalRevenue = 0;

  if (revenueModel === 'one-time') {
    let units = assumptions.initialUnits || 0;
    const price = assumptions.unitPrice || 0;
    const growthRate = (assumptions.growthRate || 0) / 100;

    for (let i = 0; i < periods; i++) {
      const revenue = units * price;
      totalRevenue += revenue;
      projections.push({
        period: i + 1,
        revenue: Math.round(revenue * 100) / 100,
        units: Math.round(units)
      });
      units = units * (1 + growthRate);
    }
  } else if (revenueModel === 'subscription') {
    let subscribers = assumptions.initialSubscribers || 0;
    const price = assumptions.subscriptionPrice || 0;
    const growthRate = (assumptions.growthRate || 0) / 100;
    const churnRate = (assumptions.churnRate || 0) / 100;

    for (let i = 0; i < periods; i++) {
      // Apply churn first, then growth
      subscribers = subscribers * (1 - churnRate);
      subscribers = subscribers * (1 + growthRate);
      const revenue = subscribers * price;
      totalRevenue += revenue;
      projections.push({
        period: i + 1,
        revenue: Math.round(revenue * 100) / 100,
        subscribers: Math.round(subscribers),
        mrr: Math.round(revenue * 100) / 100
      });
    }
  } else if (revenueModel === 'hybrid') {
    let units = assumptions.initialUnits || 0;
    let subscribers = assumptions.initialSubscribers || 0;
    const unitPrice = assumptions.unitPrice || 0;
    const subscriptionPrice = assumptions.subscriptionPrice || 0;
    const growthRate = (assumptions.growthRate || 0) / 100;
    const churnRate = (assumptions.churnRate || 0) / 100;

    for (let i = 0; i < periods; i++) {
      const oneTimeRevenue = units * unitPrice;
      subscribers = subscribers * (1 - churnRate);
      subscribers = subscribers * (1 + growthRate);
      const subscriptionRevenue = subscribers * subscriptionPrice;
      const totalPeriodRevenue = oneTimeRevenue + subscriptionRevenue;
      totalRevenue += totalPeriodRevenue;

      projections.push({
        period: i + 1,
        revenue: Math.round(totalPeriodRevenue * 100) / 100,
        oneTimeRevenue: Math.round(oneTimeRevenue * 100) / 100,
        subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
        units: Math.round(units),
        subscribers: Math.round(subscribers)
      });
      units = units * (1 + growthRate);
    }
  }

  return {
    projections,
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageMonthlyRevenue: Math.round((totalRevenue / periods) * 100) / 100,
      periods
    }
  };
}

// Start server with port detection
async function startServer() {
  let serverPort = PORT;
  
  if (!serverPort) {
    try {
      serverPort = await findAvailablePort(DEFAULT_PORT);
      if (serverPort !== DEFAULT_PORT) {
        console.log(`⚠️  Port ${DEFAULT_PORT} is in use, using port ${serverPort} instead`);
        console.log(`   Update client/.env with: REACT_APP_API_URL=http://localhost:${serverPort}/api`);
      }
    } catch (error) {
      console.error('❌ Error finding available port:', error.message);
      process.exit(1);
    }
  } else {
    // Check if specified port is available
    const available = await isPortAvailable(serverPort);
    if (!available) {
      console.error(`\n❌ Port ${serverPort} is already in use!\n`);
      console.error('To fix this, you can:');
      console.error(`1. Kill the process using port ${serverPort}:`);
      console.error(`   lsof -ti:${serverPort} | xargs kill -9`);
      console.error(`2. Or change the PORT in server/.env file\n`);
      process.exit(0); // Exit gracefully to prevent restart loop
    }
  }

  const server = app.listen(serverPort, () => {
    console.log(`✅ Server running on port ${serverPort}`);
    console.log(`   API available at http://localhost:${serverPort}/api`);
  }).on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

startServer();