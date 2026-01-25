FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directory for database file (if using lowdb)
RUN mkdir -p /app/data

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
