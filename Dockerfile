# Production Dockerfile for QA Agent Browser Automation
FROM node:20-slim

# Install system dependencies including Chrome/Chromium for headless agent browser running
RUN apt-get update && apt-get install -y \
    chromium \
    sqlite3 \
    curl \
    git \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome path for Puppeteer / Vercel agent browser
ENV CHROME_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install dependecies including lockfiles
RUN npm ci --omit=dev || npm install --production

# Install tsx and esbuild as local build support helpers
RUN npm install -D tsx esbuild typescript @types/node @types/express

# Copy the rest of the application
COPY . .

# Run build compiling client bundle and bundling commonjs server entry
RUN npm run build

EXPOSE 3000

# Start server node using the compiled bundle
CMD ["npm", "start"]
