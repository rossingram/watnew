# Quick Setup Guide

## ✅ Issue Fixed!

The database has been switched from `better-sqlite3` (which requires native compilation) to `lowdb` (pure JavaScript, no native dependencies). This means:

- ✅ No Python required
- ✅ No build tools needed
- ✅ Works with any Node.js version
- ✅ Simpler setup for MVP

## Installation Steps

1. **Install dependencies** (works with Node.js v8+):
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**:
   ```bash
   cd server
   cp .env.example .env
   # Edit .env and set JWT_SECRET (or leave default for development)
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001

## Note on Node.js Version

While the database now works with any Node.js version, **upgrading to Node.js v14+ is still recommended** for:
- Better security
- Modern JavaScript features
- Compatibility with other packages

To upgrade (optional):
```bash
nvm install 16
nvm use 16
```