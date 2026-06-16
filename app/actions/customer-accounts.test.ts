import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: { customerAccount: { create: vi.fn() } },
}))
vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}))

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { registerCustomerAction } from "./customer-accounts"

beforeEach(() => {
  vi.clearAllMocks()
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
})
