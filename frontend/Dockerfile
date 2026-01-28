# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app and curl for health checks
RUN npm install -g serve && apk add --no-cache curl

# Copy built app from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --legacy-peer-deps --production

EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=45s \
  CMD curl -f http://localhost:3000 || exit 1

# Use serve to run the application
CMD ["serve", "-s", "build", "-l", "3000"]
