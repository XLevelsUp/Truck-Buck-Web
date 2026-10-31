# syntax=docker/dockerfile:1.7
# Build from the REPO ROOT:
#   docker build -f apps/marketing/Dockerfile \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://truckbuck.in \
#     --build-arg NEXT_PUBLIC_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=in.truckbuck.driver \
#     -t truckbuck/marketing .

ARG NODE_VERSION=26.13.0

FROM node:${NODE_VERSION}-alpine AS base
# Node >= 25 no longer bundles Corepack; install it to honour `packageManager`.
RUN npm install --global corepack@latest && corepack enable
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1
WORKDIR /repo

# 1. Prune the monorepo to marketing + its workspace dependencies.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.10 prune @truckbuck/marketing --docker

# 2. Install deps from the pruned lockfile (layer cached until deps change),
#    then build.
FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PLAY_STORE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_PLAY_STORE_URL=$NEXT_PUBLIC_PLAY_STORE_URL \
    BUILD_STANDALONE=1
RUN pnpm turbo run build --filter=@truckbuck/marketing

# 3. Minimal runtime: standalone server only, non-root.
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /repo/apps/marketing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/marketing/.next/static ./apps/marketing/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/marketing/public ./apps/marketing/public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "apps/marketing/server.js"]
