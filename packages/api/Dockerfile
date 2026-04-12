FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY packages/api/package.json ./packages/api/package.json
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY packages/api ./packages/api

WORKDIR /app/packages/api
RUN pnpm build

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

# Install drizzle-kit for runtime migrations
RUN npm install -g drizzle-kit postgres dotenv

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/api/server.js"]
