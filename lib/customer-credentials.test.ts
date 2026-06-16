import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("./prisma", () => ({
  prisma: { customerAccount: { findUnique: vi.fn() } },
}))
vi.mock("./password", () => ({
  verifyPassword: vi.fn(),
}))

import { prisma } from "./prisma"
import { verifyPassword } from "./password"
import { validateCustomerCredentials } from "./customer-credentials"

describe("validateCustomerCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a customer when the email exists and the password matches", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: "hashed",
      name: "Jane",
      provider: "credentials",
      createdAt: new Date(),
    } as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)

    const result = await validateCustomerCredentials("jane@example.com", "correct-password")

    expect(prisma.customerAccount.findUnique).toHaveBeenCalledWith({ where: { email: "jane@example.com" } })
    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "hashed")
    expect(result).toEqual({ id: "1", name: "Jane", email: "jane@example.com" })
  })

  it("returns null for an OAuth-only account with no password set", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: null,
      name: "Jane",
      provider: "google",
      createdAt: new Date(),
    } as any)

    const result = await validateCustomerCredentials("jane@example.com", "anything")
    expect(result).toBeNull()
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it("returns null when the password is wrong", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: "hashed",
      name: "Jane",
      provider: "credentials",
      createdAt: new Date(),
    } as any)
    vi.mocked(verifyPassword).mockResolvedValue(false)

    const result = await validateCustomerCredentials("jane@example.com", "wrong")
    expect(result).toBeNull()
  })

  it("returns null when no account matches the email", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue(null)

    const result = await validateCustomerCredentials("nobody@example.com", "correct-password")
    expect(result).toBeNull()
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it("returns null when credentials are undefined", async () => {
    const result = await validateCustomerCredentials(undefined, undefined)
    expect(result).toBeNull()
    expect(prisma.customerAccount.findUnique).not.toHaveBeenCalled()
  })
})
