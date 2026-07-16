// Shared login-attempt throttling for both credential providers (BFT-32).
// `scope` keeps the admin and customer lockout spaces independent even if
// the same email were ever used in both tables.
import { prisma } from "./prisma"

// "admin"/"customer" are the BFT-32 login lockout spaces; "register"/
// "register-global" are BFT-38's registration rate-limit windows. All share
// the LoginAttempt table, kept apart by this scope column.
export type LoginScope = "admin" | "customer" | "register" | "register-global"

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

// Fixed-window rate limiter reusing the LoginAttempt row (BFT-38): failedCount
// is the count within the current window, lockedUntil marks the window's end.
// Returns true if the attempt is allowed (and records it), false if the window
// is already at its limit. Unlike the failure-based lockout above, every call
// counts — this caps how often an action may even be attempted.
export async function registerAttempt(
  identifier: string,
  scope: LoginScope,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = new Date()
  const existing = await prisma.loginAttempt.findUnique({
    where: { identifier_scope: { identifier, scope } },
  })

  // No row yet, or the previous window has elapsed — start a fresh window.
  if (!existing || !existing.lockedUntil || existing.lockedUntil <= now) {
    await prisma.loginAttempt.upsert({
      where: { identifier_scope: { identifier, scope } },
      create: { identifier, scope, failedCount: 1, lockedUntil: new Date(now.getTime() + windowMs) },
      update: { failedCount: 1, lockedUntil: new Date(now.getTime() + windowMs) },
    })
    return true
  }

  // Within the active window — reject once the limit is reached.
  if (existing.failedCount >= limit) {
    return false
  }

  await prisma.loginAttempt.update({
    where: { identifier_scope: { identifier, scope } },
    data: { failedCount: existing.failedCount + 1 },
  })
  return true
}
