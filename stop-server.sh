#!/bin/bash
# Script to stop all node processes related to this project

echo "Stopping all node processes..."

# Kill processes on ports 5000, 5001, 3000
for port in 5000 5001 3000; do
  pid=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$pid" ]; then
    echo "Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
  fi
done

# Kill nodemon processes
pkill -f nodemon 2>/dev/null || true

# Kill node processes in this directory
pkill -f "node.*watnew" 2>/dev/null || true

echo "Done! You can now run 'npm run dev' again."