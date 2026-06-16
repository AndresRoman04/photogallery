# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
WORKDIR /app

# Copy configuration and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
# Install ALL dependencies (including devDeps for the build)
RUN pnpm install --frozen-lockfile

# 2. Build stage
FROM base AS builder
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate

# Build the Next.js app
RUN pnpm run build

# 3. Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Copy Prisma files needed for runtime migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/.npmrc* ./

# CRITICAL: Install Prisma and Dotenv in the final stage so migrations work
RUN pnpm add prisma@7.8.0 dotenv@latest @prisma/client@7.8.0

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
