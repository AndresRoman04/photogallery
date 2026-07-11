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

# 3. Production runner stage — serves the standalone build and nothing else.
# CRITICAL: never run pnpm inside /app here. The standalone node_modules is a
# trace whose .next/node_modules/@prisma/client-<hash> symlink points into the
# builder's pnpm virtual store; a fresh install rebuilds the store under
# different hashes and leaves that symlink dangling (500s on every request).
# Prisma CLI work (db push / seed) lives in the compose `migrate` service,
# which reuses the builder stage instead.
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
