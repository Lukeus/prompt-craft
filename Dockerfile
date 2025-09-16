# Multi-stage Dockerfile for Prompt Craft
# Supports both CLI and web deployment modes

ARG NODE_VERSION=20
ARG ALPINE_VERSION=3.19

# ================================
# Base Image with Dependencies
# ================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    dumb-init \
    python3 \
    make \
    g++ \
    curl \
    tzdata

# Set timezone capability
ENV TZ=UTC

# Create app directory with proper permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
RUN chown nodejs:nodejs /app

# ================================
# Dependencies Stage
# ================================
FROM base AS deps

COPY package*.json ./
COPY packages/*/package.json ./packages/*/

# Install dependencies with exact versions for reproducible builds
RUN npm ci --only=production && \
    npm cache clean --force

# Install development dependencies for building
FROM base AS build-deps
COPY package*.json ./
RUN npm ci && npm cache clean --force

# ================================
# Build Stage
# ================================
FROM build-deps AS builder

# Copy source code
COPY . .

# Build TypeScript files
RUN npm run build

# Build web application if needed
ARG BUILD_WEB=true
RUN if [ "$BUILD_WEB" = "true" ]; then \
        npm run mcp-web:build; \
    fi

# Remove dev dependencies and rebuild for production
RUN npm prune --production && \
    npm cache clean --force

# ================================
# Runtime Image
# ================================
FROM base AS runtime

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/dist-web ./dist-web
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Copy configuration templates
COPY --from=builder --chown=nodejs:nodejs /app/config ./config

# Create directories for runtime data
RUN mkdir -p /app/prompts /app/logs /app/data && \
    chown -R nodejs:nodejs /app/prompts /app/logs /app/data

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Expose ports
EXPOSE ${PORT}

# Default command (can be overridden)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/packages/apps/web/server/entry.mjs"]

# ================================
# CLI-only Image
# ================================
FROM runtime AS cli

ENV FEATURE_WEB=false
ENV FEATURE_MCP=true
ENV FEATURE_API=false

# CLI doesn't need web assets
RUN rm -rf /app/dist-web

# Override default command for CLI usage
CMD ["node", "dist/packages/apps/cli/index.js", "help"]

# ================================
# MCP Server Image
# ================================
FROM runtime AS mcp-server

ENV FEATURE_WEB=false
ENV FEATURE_MCP=true
ENV FEATURE_API=false

# MCP server doesn't need web assets
RUN rm -rf /app/dist-web

# MCP server runs on stdio by default
CMD ["node", "dist/packages/apps/mcp-server/index.js"]

# ================================
# Web Server Image (default)
# ================================
FROM runtime AS web-server

ENV FEATURE_WEB=true
ENV FEATURE_MCP=true
ENV FEATURE_API=true

# Default command is already set in runtime stage