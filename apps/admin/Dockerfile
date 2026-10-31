# syntax=docker/dockerfile:1.7
# Build from the REPO ROOT:
#   docker build -f apps/admin/Dockerfile \
#     --build-arg VITE_API_BASE_URL=https://api.truckbuck.in/v1 \
#     --build-arg VITE_APP_ENV=production \
#     -t truckbuck/admin .
#
# VITE_* values are baked into the bundle at build time: build one image per
# environment (or add runtime config injection — see README "Known gaps").

ARG NODE_VERSION=26.13.0
ARG NGINX_VERSION=1.30-alpine

FROM node:${NODE_VERSION}-alpine AS base
# Node >= 25 no longer bundles Corepack; install it to honour `packageManager`.
RUN npm install --global corepack@latest && corepack enable
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    HUSKY=0 \
    TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.10 prune @truckbuck/admin --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
ARG VITE_API_BASE_URL
ARG VITE_APP_ENV=production
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_ENV=$VITE_APP_ENV
RUN pnpm turbo run build --filter=@truckbuck/admin

# Static files only, served by nginx with SPA fallback.
FROM nginx:${NGINX_VERSION} AS runner
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/admin/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
