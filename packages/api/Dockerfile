FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
COPY packages/api/package.json ./packages/api/package.json
RUN yarn install --frozen-lockfile --ignore-scripts

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY package.json yarn.lock ./
COPY packages/api ./packages/api

# Next.js prerenders pages that query the DB (shop list/detail), so the
# build needs DATABASE_URL. Railway's private host (postgres.railway.internal)
# only resolves at runtime, so accept the public URL as a build arg and
# point DATABASE_URL at it for this stage only. Runtime gets its own
# DATABASE_URL from the Railway service env (private, internal).
ARG DATABASE_PUBLIC_URL
ENV DATABASE_URL=${DATABASE_PUBLIC_URL}
ARG AUTH_SECRET
ENV AUTH_SECRET=${AUTH_SECRET}

WORKDIR /app/packages/api
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/api/public ./packages/api/public

# Standalone output preserves monorepo path structure
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/.next/static ./packages/api/.next/static

# Copy drizzle migration files for runtime migrations
COPY --from=builder /app/packages/api/src/db/drizzle ./packages/api/src/db/drizzle
COPY --from=builder /app/packages/api/drizzle.config.ts ./packages/api/drizzle.config.ts

# geoip-lite ships .dat data files loaded via __dirname; Next's file-tracing
# doesn't see them, so copy the package into the standalone tree explicitly.
COPY --from=builder /app/node_modules/geoip-lite ./packages/api/node_modules/geoip-lite

# Runtime migrations need drizzle-kit, which compiles drizzle.config.ts
# via esbuild. esbuild has a platform-specific binary pulled in as an
# optional dep (@esbuild/linux-x64), plus drizzle-orm as a peer. Cherry-
# picking them is fragile — ship the full hoisted node_modules instead.
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/api/server.js"]
