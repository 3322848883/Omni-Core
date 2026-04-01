# ============================================
# FGVPN Client Web - Dockerfile
# Multi-stage build for production optimization
# ============================================

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using npm ci for reproducible builds
RUN npm ci --only=production && npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./
COPY postcss.config.js ./
COPY .eslintrc.cjs ./
COPY .prettierrc ./
COPY index.html ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public

# Copy environment file (can be overridden at build time)
ARG ENV_FILE=.env.production
COPY ${ENV_FILE} .env.production.local

# Build the application
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM nginx:1.25-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Create non-root user for nginx
RUN addgroup -g 1001 -S nginx-group && \
    adduser -S nginx-user -u 1001 -G nginx-group

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage
COPY --from=builder --chown=nginx-user:nginx-group /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx-user:nginx-group /usr/share/nginx/html && \
    chown -R nginx-user:nginx-group /var/cache/nginx && \
    chown -R nginx-user:nginx-group /var/log/nginx && \
    chown -R nginx-user:nginx-group /etc/nginx/conf.d

# Create required nginx directories
RUN touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-group /var/run/nginx.pid

# Switch to non-root user
USER nginx-user

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Stage 4: Development (optional)
# ============================================
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY vitest.config.ts ./
COPY postcss.config.js ./
COPY .eslintrc.cjs ./
COPY .prettierrc ./
COPY index.html ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY public ./public

# Expose port for development server
EXPOSE 5174

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
