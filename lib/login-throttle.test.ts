import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("./prisma", () => ({
  prisma: { loginAttempt: { findUnique: vi.fn(), upsert: vi.fn() } },
}))

import { prisma } from "./prisma"
import { isLockedOut, recordFailure, recordSuccess } from "./login-throttle"

const WHERE = { where: { identifier_scope: { identifier: "jane@example.com", scope: "customer" } } }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("isLockedOut", () => {
  it("returns false when there's no attempt record", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue(null)
    expect(await isLockedOut("jane@example.com", "customer")).toBe(false)
    expect(prisma.loginAttempt.findUnique).toHaveBeenCalledWith(WHERE)
  })

  it("returns false when lockedUntil is in the past", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({
      lockedUntil: new Date(Date.now() - 1000),
    } as any)
    expect(await isLockedOut("jane@example.com", "customer")).toBe(false)
  })

  it("returns true when lockedUntil is in the future", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({
      lockedUntil: new Date(Date.now() + 60_000),
    } as any)
    expect(await isLockedOut("jane@example.com", "customer")).toBe(true)
  })

  it("returns false when lockedUntil is null", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({ lockedUntil: null } as any)
    expect(await isLockedOut("jane@example.com", "customer")).toBe(false)
  })
})

describe("recordFailure", () => {
  it("does not set a lockout within the free-attempt threshold", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({ failedCount: 2 } as any)
    await recordFailure("jane@example.com", "customer")
    expect(prisma.loginAttempt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { failedCount: 3, lockedUntil: null },
      })
    )
  })

  it("sets a lockout once the failure count crosses the threshold", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({ failedCount: 4 } as any)
    const before = Date.now()
    await recordFailure("jane@example.com", "customer")
    const call = vi.mocked(prisma.loginAttempt.upsert).mock.calls[0][0] as any
    expect(call.update.failedCount).toBe(5)
    expect(call.update.lockedUntil.getTime()).toBeGreaterThan(before)
  })

  it("increases the lockout duration for repeated failures", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({ failedCount: 4 } as any)
    await recordFailure("jane@example.com", "customer")
    const firstLock = (vi.mocked(prisma.loginAttempt.upsert).mock.calls[0][0] as any).update.lockedUntil

    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue({ failedCount: 5 } as any)
    await recordFailure("jane@example.com", "customer")
    const secondLock = (vi.mocked(prisma.loginAttempt.upsert).mock.calls[1][0] as any).update.lockedUntil

    expect(secondLock.getTime() - Date.now()).toBeGreaterThan(firstLock.getTime() - Date.now())
  })

  it("creates a new record when none exists yet", async () => {
    vi.mocked(prisma.loginAttempt.findUnique).mockResolvedValue(null)
    await recordFailure("jane@example.com", "customer")
    expect(prisma.loginAttempt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { identifier: "jane@example.com", scope: "customer", failedCount: 1, lockedUntil: null },
      })
    )
  })
})

describe("recordSuccess", () => {
  it("resets the failure count and lockout", async () => {
    await recordSuccess("jane@example.com", "customer")
    expect(prisma.loginAttempt.upsert).toHaveBeenCalledWith({
      where: { identifier_scope: { identifier: "jane@example.com", scope: "customer" } },
      create: { identifier: "jane@example.com", scope: "customer", failedCount: 0, lockedUntil: null },
      update: { failedCount: 0, lockedUntil: null },
    })
  })
})
