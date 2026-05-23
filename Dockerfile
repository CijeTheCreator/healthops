# ─── Stage 1: Build UI ────────────────────────────────────────────────────────
FROM node:22-alpine AS ui-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/ui

# Install deps
COPY ui/package.json ui/pnpm-lock.yaml ./
# Allow sharp (Next.js image optimization) to run its build script
RUN pnpm install

# Build Next.js
COPY ui/ ./
RUN pnpm build


# ─── Stage 2: Build Backend ────────────────────────────────────────────────────
FROM node:22-alpine AS backend-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/backend

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install

COPY backend/ ./


# ─── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

# supervisor runs both processes inside one container
RUN apk add --no-cache supervisor

RUN corepack enable && corepack prepare pnpm@latest --activate

# ── UI ──
WORKDIR /app/ui
COPY --from=ui-builder /app/ui/.next/standalone ./
COPY --from=ui-builder /app/ui/.next/static ./.next/static
COPY --from=ui-builder /app/ui/public ./public

# ── Backend ──
WORKDIR /app/backend
COPY --from=backend-builder /app/backend ./

# ── Supervisor config ──
COPY supervisord.conf /etc/supervisor/conf.d/healthops.conf

EXPOSE 3000 3005

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/healthops.conf"]
