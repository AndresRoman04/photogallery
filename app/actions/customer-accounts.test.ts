import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: { customerAccount: { create: vi.fn() } },
}))
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}))
vi.mock("@/lib/login-throttle", () => ({
  registerAttempt: vi.fn().mockResolvedValue(true),
}))

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { registerAttempt } from "@/lib/login-throttle"
import { registerCustomerAction } from "./customer-accounts"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(registerAttempt).mockResolvedValue(true)
})

describe("registerCustomerAction", () => {
  it("rejects an invalid email", async () => {
    const result = await registerCustomerAction({ email: "not-an-email", password: "longenough" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/valid email/)
    expect(prisma.customerAccount.create).not.toHaveBeenCalled()
  })

  it("rejects a password under the minimum length", async () => {
    const result = await registerCustomerAction({ email: "jane@example.com", password: "short" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/at least/)
  })

  it("hashes the password and creates the account on valid input", async () => {
    vi.mocked(prisma.customerAccount.create).mockResolvedValue({ id: "1", email: "jane@example.com" } as any)
    const result = await registerCustomerAction({
      email: "Jane@Example.com",
      password: "longenough",
      name: "  Jane  ",
    })
    expect(hashPassword).toHaveBeenCalledWith("longenough")
    expect(prisma.customerAccount.create).toHaveBeenCalledWith({
      data: { email: "jane@example.com", passwordHash: "hashed-password", name: "Jane", provider: "credentials" },
    })
    expect(result.success).toBe(true)
  })

  it("returns a friendly error on duplicate email", async () => {
    vi.mocked(prisma.customerAccount.create).mockRejectedValue({ code: "P2002" })
    const result = await registerCustomerAction({ email: "jane@example.com", password: "longenough" })
    expect(result.success).toBe(false)
    expect(result.error).toMatch(/already exists/)
  })

  it("rejects before hashing when throttled", async () => {
    // Per-email limit hit (first registerAttempt call resolves false).
    vi.mocked(registerAttempt).mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    const result = await registerCustomerAction({ email: "jane@example.com", password: "longenough" })
    expect(result.success).toBe(false)
    expect(hashPassword).not.toHaveBeenCalled()
    expect(prisma.customerAccount.create).not.toHaveBeenCalled()
  })

  it("rejects when the global registration cap is hit", async () => {
    vi.mocked(registerAttempt).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    const result = await registerCustomerAction({ email: "jane@example.com", password: "longenough" })
    expect(result.success).toBe(false)
    expect(prisma.customerAccount.create).not.toHaveBeenCalled()
  })
})
