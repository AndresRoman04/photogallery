import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("./prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))
vi.mock("./password", () => ({
  verifyPassword: vi.fn(),
}))
vi.mock("./login-throttle", () => ({
  isLockedOut: vi.fn().mockResolvedValue(false),
  recordFailure: vi.fn(),
  recordSuccess: vi.fn(),
}))

import { prisma } from "./prisma"
import { verifyPassword } from "./password"
import { isLockedOut, recordFailure, recordSuccess } from "./login-throttle"
import { validateUserCredentials } from "./auth-credentials"

describe("validateUserCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isLockedOut).mockResolvedValue(false)
  })

  it("returns a user when the email exists and the password matches", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "admin@example.com",
      passwordHash: "hashed",
      name: "Admin",
      createdAt: new Date(),
    } as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)

    const result = await validateUserCredentials("admin@example.com", "correct-password")

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "admin@example.com" } })
    expect(verifyPassword).toHaveBeenCalledWith("correct-password", "hashed")
    expect(result).toEqual({ id: "1", name: "Admin", email: "admin@example.com" })
    expect(recordSuccess).toHaveBeenCalledWith("admin@example.com", "admin")
  })

  it("falls back to the email when the user has no name", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "admin@example.com",
      passwordHash: "hashed",
      name: null,
      createdAt: new Date(),
    } as any)
    vi.mocked(verifyPassword).mockResolvedValue(true)

    const result = await validateUserCredentials("admin@example.com", "correct-password")
    expect(result).toEqual({ id: "1", name: "admin@example.com", email: "admin@example.com" })
  })

  it("returns null when the password is wrong", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "admin@example.com",
      passwordHash: "hashed",
      name: "Admin",
      createdAt: new Date(),
    } as any)
    vi.mocked(verifyPassword).mockResolvedValue(false)

    const result = await validateUserCredentials("admin@example.com", "wrong")
    expect(result).toBeNull()
    expect(recordFailure).toHaveBeenCalledWith("admin@example.com", "admin")
  })

  it("returns null when no user matches the email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await validateUserCredentials("someone-else@example.com", "correct-password")
    expect(result).toBeNull()
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it("returns null without checking the password when the account is locked out", async () => {
    vi.mocked(isLockedOut).mockResolvedValue(true)

    const result = await validateUserCredentials("admin@example.com", "correct-password")
    expect(result).toBeNull()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it("returns null when credentials are undefined", async () => {
    const result = await validateUserCredentials(undefined, undefined)
    expect(result).toBeNull()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it("returns null when credentials are empty strings", async () => {
    const result = await validateUserCredentials("", "")
    expect(result).toBeNull()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it("returns null when credentials are non-string values", async () => {
    const result = await validateUserCredentials(123, { not: "a string" })
    expect(result).toBeNull()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })
})
