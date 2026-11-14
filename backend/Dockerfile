# syntax=docker/dockerfile:1.7
# Build from the repository root:  docker build -f backend/Dockerfile -t homecare-api .
# One image, two process roles:  node dist/main.js (api)  |  node dist/worker.js (worker)

FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /repo

# ---------- build: install, generate Prisma client, compile ----------
FROM base AS build
# Toolchain in case argon2 has no prebuilt binary for this platform
RUN apk add --no-cache python3 make g++
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY backend ./backend
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@homecare/backend..."
RUN pnpm --filter @homecare/shared build \
 && pnpm --filter @homecare/backend exec prisma generate \
 && pnpm --filter @homecare/backend build \
 && pnpm --filter @homecare/backend deploy --prod --legacy /out

# ---------- migrator: has the Prisma CLI; runs `migrate deploy` (and dev seed) as a one-off job ----------
FROM build AS migrator
WORKDIR /repo/backend
CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

# ---------- runtime: small, non-root, production deps only ----------
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /out/node_modules ./node_modules
COPY --from=build --chown=app:app /out/package.json ./package.json
COPY --from=build --chown=app:app /repo/backend/dist ./dist
USER app
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health/live || exit 1
CMD ["node", "dist/main.js"]
