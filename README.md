# Watnew - MVP

**What will your new product make?**

A simple web application that helps product managers create revenue projections without complex spreadsheet modeling.

## Features

- User registration and authentication
- Create financial models with three revenue types:
  - One-Time Purchase
  - Subscription
  - Hybrid (One-Time + Subscription)
- Interactive assumption input forms
- Revenue projections with charts and tables
- Save and manage multiple scenarios
- Export to PDF and CSV/Excel

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js with Express
- **Database**: LowDB (JSON file-based, no native dependencies - perfect for MVP)
- **Charts**: Recharts
- **Export**: jsPDF, xlsx

## Getting Started

### Prerequisites

- **Node.js v14 or higher** (v16+ strongly recommended)
- npm or yarn
- Python 3 (required for building native dependencies)

**Important:** The current setup uses `better-sqlite3` which requires:
- Node.js v10.4 or higher (v14+ recommended)
- Python 3 for native module compilation
- Build tools (Xcode Command Line Tools on macOS)

**If you're using Node.js v8 or older:**
1. **Recommended:** Upgrade Node.js using [nvm](https://github.com/nvm-sh/nvm):
   ```bash
   nvm install 16
   nvm use 16
   ```

2. **Alternative:** If you cannot upgrade Node.js, you'll need:
   - Python 3 installed and in your PATH
   - Build tools installed
   - Then try installing again: `npm run install-all`

**Troubleshooting Installation:**
- **"Can't find Python"**: Install Python 3 and ensure it's accessible via `python` or `python3` command
- **"node-gyp rebuild failed"**: Install Xcode Command Line Tools: `xcode-select --install` (macOS)
- **Native module errors**: Consider upgrading to Node.js v16+ which has better prebuilt binaries support

### Installation

1. Install all dependencies (from the root directory):
```bash
npm run install-all
```

This will install dependencies for:
- Root package (concurrently for running both servers)
- Server (Express, SQLite, authentication libraries)
- Client (React and UI libraries)

2. Set up environment variables:

**Server environment** - Create a `.env` file in the `server` directory:
```bash
cd server
cp .env.example .env
# Edit .env and set your JWT_SECRET
```

Minimum `.env` content:
```
JWT_SECRET=your-secret-key-change-in-production
PORT=5001

# Stripe Configuration (required for subscriptions)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**Note:** See `STRIPE_SETUP.md` for detailed Stripe configuration instructions.

**Client environment** (optional) - Create a `.env` file in the `client` directory if you need to change the API URL:
```bash
cd client
cp .env.example .env
```

Default API URL is `http://localhost:5001/api` (no .env needed if using defaults).

3. Start development servers (from root directory):
```bash
npm run dev
```

This will start both:
- **Backend server** on http://localhost:5001
- **Frontend React app** on http://localhost:3000

The application will automatically open in your browser at http://localhost:3000

### First Use

1. Register a new account with your email and password
2. Click "Create New Model" to start building your first financial projection
3. Enter your assumptions and click "Calculate Projections"
4. View results with interactive charts and tables
5. Save your scenario for later reference
6. Export to PDF or Excel for sharing with stakeholders

## Project Structure

```
watnew/
├── client/          # React frontend
├── server/          # Express backend
├── package.json     # Root package.json for convenience scripts
└── README.md
```

## MVP Scope

This MVP focuses on core revenue projection features. See the MVP scope document for detailed requirements and future enhancements.