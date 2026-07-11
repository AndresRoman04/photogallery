import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialization is deferred to first use: `next build` imports every route's
// module graph while collecting page data, and the root layout reaches this
// file via SiteNav → lib/auth — so a module-scope env check or Pool here
// breaks the Docker build, where DATABASE_URL exists only at runtime (BFT-30).
function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set")
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const client = createClient()
    // In production each process keeps its single instance too — caching on
    // globalThis is what prevents dev HMR from leaking pools, and is harmless
    // (one instance per process) everywhere else.
    globalForPrisma.prisma = client
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient()
    const value = client[prop as keyof PrismaClient]
    return typeof value === "function" ? value.bind(client) : value
  },
})
