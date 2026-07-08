// Shared login-attempt throttling for both credential providers (BFT-32).
// `scope` keeps the admin and customer lockout spaces independent even if
// the same email were ever used in both tables.
import { prisma } from "./prisma"

export type LoginScope = "admin" | "customer"

// No lockout through this many failures — a single honest typo shouldn't
// cost the user anything. After that, delay doubles per additional
// failure, capped so a legitimate user is never locked out for too long.
const FREE_ATTEMPTS = 4
const INITIAL_LOCKOUT_MS = 30_000
const MAX_LOCKOUT_MS = 30 * 60_000

function lockoutDurationMs(failedCount: number): number {
  const overage = failedCount - FREE_ATTEMPTS
  const duration = INITIAL_LOCKOUT_MS * 2 ** (overage - 1)
  return Math.min(duration, MAX_LOCKOUT_MS)
}

export async function isLockedOut(identifier: string, scope: LoginScope): Promise<boolean> {
  const attempt = await prisma.loginAttempt.findUnique({
    where: { identifier_scope: { identifier, scope } },
  })
  return Boolean(attempt?.lockedUntil && attempt.lockedUntil > new Date())
}

export async function recordFailure(identifier: string, scope: LoginScope): Promise<void> {
  const existing = await prisma.loginAttempt.findUnique({
    where: { identifier_scope: { identifier, scope } },
  })
  const failedCount = (existing?.failedCount ?? 0) + 1
  const lockedUntil =
    failedCount > FREE_ATTEMPTS ? new Date(Date.now() + lockoutDurationMs(failedCount)) : null

  await prisma.loginAttempt.upsert({
    where: { identifier_scope: { identifier, scope } },
    create: { identifier, scope, failedCount, lockedUntil },
    update: { failedCount, lockedUntil },
  })
}

export async function recordSuccess(identifier: string, scope: LoginScope): Promise<void> {
  await prisma.loginAttempt.upsert({
    where: { identifier_scope: { identifier, scope } },
    create: { identifier, scope, failedCount: 0, lockedUntil: null },
    update: { failedCount: 0, lockedUntil: null },
  })
}
