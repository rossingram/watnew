# Watnew - MVP

**Know what your product will make.**

A web app that helps product managers build financial models and revenue projections for stakeholders—without spreadsheets.

## Features

- User registration and authentication
- Create financial models with three revenue types: One-Time Purchase, Subscription, Hybrid (One-Time + Subscription)
- Interactive assumption input forms
- Revenue projections with charts and tables
- Save and manage multiple scenarios
- Export to PDF and CSV/Excel
- **Exports include assumptions** – PDF and Excel exports list all model assumptions (prices, growth, churn, costs, etc.) so documents are self-contained and auditable.
- **Duplicate scenario** – Duplicate any scenario from the dashboard or from the scenario view to create a copy you can tweak (works for single and Best/Base/Worst scenarios).
- **Compare scenarios** – Select 2–3 saved scenarios to view a side-by-side revenue chart and summary table, with export to PDF or Excel.
- **Costs and unit economics** – Optional cost per unit and/or cost per subscriber; results and exports show cost, gross profit, and gross margin % alongside revenue.
- **Best / Base / Worst scenarios** – Create a single model with three assumption sets (Base, Best, Worst), see all three on one chart and summary table, and export all three. You can edit assumptions for each case and recalculate to refresh the comparison.
- **Subscription and billing** – Stripe-powered subscriptions; pricing page, billing/portal, and subscription-gated access to the dashboard.
- **Fintech-style UI** – Updated design across the app: Plus Jakarta Sans typography, card styling, KPI-style metrics, and consistent colors and spacing.
- **Style guide** – Reference page at `/style-guide` showcasing the design system (cards, buttons, forms, tables, empty states).

### Landing and marketing

- Fintech-style landing page with wavy hero background and contrast overlay for readability
- Single "Built for Product Managers" section with eight benefit cards: Fast & Simple, Compare Scenarios, Visual Insights, Export & Share, Pricing Strategy, Revenue Forecasting, Stakeholder Presentations, Transparent Assumptions
- Trust strip (Export to Excel & PDF, 7-day money-back guarantee, Cancel anytime)
- Two-column Simple Pricing card and section separation for clarity
- Terms of Service and Privacy Policy linked from footer (contact: help@watnew.me, watnew.me)
- Wavy SVG favicon aligned with hero direction

## Recent changes

- Revenue projection chart: fixed Y-axis labels being cut off (larger left margin); added spacing under the chart title.
- Create page: increased spacing under the "Create Revenue Projection" heading.
- Stripe: subscription status now correctly reads `current_period_end` (snake_case) from the Stripe API, eliminating "Invalid timestamp from Stripe" console errors.

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
3. Enter your assumptions (optionally add cost per unit or cost per subscriber to see gross profit and margin) and click "Calculate Projections"
4. View results with interactive charts and tables
5. Save your scenario for later reference
6. Export to PDF or Excel for sharing with stakeholders
7. Use **Compare** from the dashboard to compare two or three scenarios, or **Duplicate** to copy a scenario. When creating a model, choose **Best / Base / Worst** to build a three-case comparison and edit it later from the scenario view.
8. To view the design system: open http://localhost:3000/style-guide (no login required).

## Project Structure

```
watnew/
├── client/          # React frontend (includes comparison and Best/Base/Worst views)
│   └── public/     # Favicon, hero background image (favicon.svg, hero-bg.png in build)
├── server/          # Express backend
├── package.json     # Root package.json for convenience scripts
└── README.md
```

Hero background image is also referenced from `client/src/components/hero-bg.png` (used by Landing page CSS). Favicon and production hero asset live in `client/public/`.

## Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/login`, `/register` | Auth |
| `/pricing` | Subscription pricing |
| `/dashboard` | My scenarios (requires subscription) |
| `/create` | Create revenue projection |
| `/scenario/:id` | View/edit scenario and results |
| `/compare` | Compare multiple scenarios |
| `/billing` | Subscription status and management |
| `/style-guide` | Design system reference (public) |
| `/terms`, `/privacy` | Legal |

## MVP Scope

This app started as an MVP focused on core revenue projections and now includes scenario comparison, costs, and Best/Base/Worst modeling. See the MVP scope document for detailed requirements and future enhancements.