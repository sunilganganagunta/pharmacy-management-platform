# ========================================================
# MediCore Frontend Multi-Stage Dockerfile (React + Vite + Nginx)
# ========================================================

# --- Stage 1: Build Application with Node.js ---
FROM node:22-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci --silent || npm install --silent

# Copy source code and build production assets
COPY . .
RUN npm run build

# --- Stage 2: Minimal Production Nginx Web Server ---
FROM nginx:1.27-alpine AS runner

# Remove default nginx welcome assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom production Nginx reverse proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Install curl for container health checks
RUN apk add --no-cache curl

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

