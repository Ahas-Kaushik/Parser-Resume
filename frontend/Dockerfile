# ========================================
# AI-Powered Job Portal - Frontend Dockerfile
# FIX: Multi-stage build - build React app, serve with nginx (production-grade)
# ========================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# FIX: Set NODE_ENV to production for build optimisations
ENV NODE_ENV=production

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and build
COPY . .

# Build the Vite/React app into static files
RUN npm run build

# --- Stage 2: Serve with nginx ---
FROM nginx:1.25-alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config to handle React Router (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard HTTP)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]