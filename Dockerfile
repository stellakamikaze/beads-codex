# Dockerfile for beads-codex
# Multi-stage build for smaller image

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend bundle
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache git

# Install beads CLI globally
RUN npm install -g @beads/bd

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built app from builder stage
COPY --from=builder /app/app ./app
COPY --from=builder /app/server ./server
COPY --from=builder /app/bin ./bin

# Create data directory for beads database and users
RUN mkdir -p /data/.beads

# Environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV BEADS_DB=/data/.beads/beads.db
ENV USERS_FILE=/data/users.json
ENV AUTH_ENABLED=true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/healthz || exit 1

# Run server
CMD ["node", "server/index.js", "--host", "0.0.0.0", "--port", "3000"]
