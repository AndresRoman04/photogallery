# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# 1. Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
# Ensure we have the latest npm for the min-release-age feature
RUN npm install -g npm@latest
WORKDIR /app

# Copy configuration and lockfiles
COPY package.json package-lock.json* .npmrc* ./
# Install ALL dependencies (including devDeps for the build)
RUN npm install

# 2. Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# 3. Production runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Ensure npm is updated here too for any runtime commands
RUN npm install -g npm@latest

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

# CRITICAL: Install Prisma and Dotenv in the final stage so migrations work
RUN npm install prisma@7.8.0 dotenv@latest @prisma/client@7.8.0

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
