# syntax=docker/dockerfile:1.7
# Edge container = load balancer for the API replicas + static host for the web SPA.
# Build from the repository root:  docker build -f infra/nginx/Dockerfile -t homecare-edge .

FROM node:24-alpine AS web
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@homecare/web..."
RUN pnpm --filter @homecare/web exec vite build

FROM nginx:1.28-alpine
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=web /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s CMD wget -qO- http://127.0.0.1/lb-health || exit 1
