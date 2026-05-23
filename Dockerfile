# ─── Stage 1: Build UI ────────────────────────────────────────────────────────
FROM node:22-alpine AS ui-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/ui

COPY ui/package.json ui/pnpm-lock.yaml ./
RUN npm install

COPY ui/ ./
RUN npm run build


# ─── Stage 2: Build Backend ────────────────────────────────────────────────────
FROM node:22-alpine AS backend-builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/backend

COPY backend/package.json backend/pnpm-lock.yaml ./
RUN npm install

COPY backend/ ./


# ─── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN apk add --no-cache supervisor python3 py3-pip

RUN python3 -m venv /opt/wizard-venv \
 && /opt/wizard-venv/bin/pip install --no-cache-dir rich questionary

RUN corepack enable && corepack prepare pnpm@latest --activate

# ── UI ──
WORKDIR /app/ui
COPY --from=ui-builder /app/ui/.next/standalone ./
COPY --from=ui-builder /app/ui/.next/static ./.next/static
COPY --from=ui-builder /app/ui/public ./public

# ── Backend ──
WORKDIR /app/backend
COPY --from=backend-builder /app/backend ./

# ── Wizard ──
COPY setup_wizard.py /app/setup_wizard.py
COPY entrypoint.py /app/entrypoint.py

# ── Supervisor config ──
COPY supervisord.conf /etc/supervisor/conf.d/healthops.conf

EXPOSE 3000 3005

# Use absolute path to venv python — avoids PATH resolution issues at container start
ENTRYPOINT ["/opt/wizard-venv/bin/python3", "/app/entrypoint.py"]
