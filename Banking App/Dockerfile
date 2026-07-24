# ============================================================
# APEX BANKING — Production Dockerfile
# ============================================================
# Multi-stage build: smaller final image, no dev deps.
# ============================================================

# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app

COPY root/Backend/package.json root/Backend/package-lock.json* ./
RUN npm ci --only=production

# ── Stage 2: Production image ──
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules first (maximises layer caching)
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY root/Backend/ .

# Set secure permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

ENV NODE_ENV=production

CMD ["node", "server.js"]