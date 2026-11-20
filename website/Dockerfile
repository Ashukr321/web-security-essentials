# syntax=docker/dockerfile:1
# Build context is the REPO ROOT (the markdown lives outside website/):
#   docker build -f website/Dockerfile -t web-security-essentials ..
# or just: docker compose up --build   (from website/)

ARG NODE_VERSION=20-alpine

# ---- deps: install node_modules from the lockfile ----
FROM node:${NODE_VERSION} AS deps
WORKDIR /repo/website
RUN apk add --no-cache libc6-compat
COPY website/package.json website/package-lock.json website/.npmrc ./
# HUSKY=0: git hooks are pointless in the image (and there's no .git)
RUN HUSKY=0 npm ci

# ---- builder: compile the site; all pages are prerendered from the markdown ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /repo
COPY . .
COPY --from=deps /repo/website/node_modules ./website/node_modules
WORKDIR /repo/website
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal image, non-root ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/website/public ./public
COPY --from=builder --chown=nextjs:nodejs /repo/website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/website/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
CMD ["node", "server.js"]
