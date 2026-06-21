FROM node:22-alpine AS base
WORKDIR /app

# ── Dependencies (prod only) ──────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Build (all deps, compile TypeScript) ─────────────────────────────────────
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Non-root user — never run as root in production
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 mcpapp

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R mcpapp:nodejs /app
USER mcpapp

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3002/healthz || exit 1

# exec form — node is PID 1 and receives SIGTERM directly,
# enabling the graceful shutdown handler in src/index.ts to run.
CMD ["node", "dist/index.js"]
