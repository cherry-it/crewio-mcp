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

# Non-root user — never run as root in production
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 mcpapp

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN chown -R mcpapp:nodejs /app
USER mcpapp

EXPOSE 3002

CMD ["node", "dist/index.js"]
