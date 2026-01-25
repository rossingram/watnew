# Troubleshooting Guide

## Port Already in Use Error

If you see `Error: listen EADDRINUSE: address already in use :::5000`, it means port 5000 is already being used by another process.

### Solution 1: Kill the Process Using Port 5000

**On macOS/Linux:**
```bash
# Find the process ID
lsof -ti:5000

# Kill it (replace PID with the number from above)
kill -9 <PID>

# Or in one command:
lsof -ti:5000 | xargs kill -9
```

**If you get "operation not permitted":**
- The process might be owned by another user
- Try with sudo: `sudo lsof -ti:5000 | xargs kill -9`
- Or use Activity Monitor (macOS) / System Monitor (Linux) to find and kill the process

### Solution 2: Change the Port

1. Edit `server/.env`:
   ```
   PORT=5001
   ```

2. Update `client/.env` (if it exists) to point to the new port:
   ```
   REACT_APP_API_URL=http://localhost:5001/api
   ```

3. Restart the servers

### Solution 3: Find What's Using the Port

**On macOS:**
```bash
# See what's using port 5000
lsof -i:5000

# Or use netstat
netstat -anv | grep 5000
```

**Common causes:**
- Another instance of your server still running
- Another application using port 5000 (like AirPlay Receiver on macOS)
- A previous server instance that didn't shut down properly

## Other Common Issues

### Database File Locked

If you see database errors, make sure:
- Only one instance of the server is running
- The `server/database.json` file isn't corrupted
- You have write permissions in the server directory

### Module Not Found Errors

If you see "Cannot find module" errors:
1. Make sure you ran `npm run install-all` from the root directory
2. Try deleting `node_modules` and reinstalling:
   ```bash
   rm -rf node_modules server/node_modules client/node_modules
   npm run install-all
   ```

### React App Won't Start

If the React app fails to start:
1. Make sure port 3000 is available
2. Check that all client dependencies installed correctly
3. Try clearing the cache:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```