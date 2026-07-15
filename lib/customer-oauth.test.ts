import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("./prisma", () => ({
  prisma: { customerAccount: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } },
}))

import { prisma } from "./prisma"
import { resolveOAuthSignIn, OAUTH_ACCOUNT_EXISTS_REDIRECT } from "./customer-oauth"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("resolveOAuthSignIn", () => {
  it("creates a new account and allows sign-in when the email is unknown", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue(null)

    const result = await resolveOAuthSignIn("jane@example.com", "Jane", "google")

    expect(result).toBe(true)
    expect(prisma.customerAccount.create).toHaveBeenCalledWith({
      data: { email: "jane@example.com", name: "Jane", provider: "google" },
    })
  })

  it("allows a returning user of the same OAuth provider and refreshes their name", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: null,
      provider: "google",
    } as any)

    const result = await resolveOAuthSignIn("jane@example.com", "Jane Doe", "google")

    expect(result).toBe(true)
    expect(prisma.customerAccount.update).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      data: { name: "Jane Doe" },
    })
    expect(prisma.customerAccount.create).not.toHaveBeenCalled()
  })

  it("denies sign-in when the email belongs to a credentials-created account", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: "hashed",
      provider: "credentials",
    } as any)

    const result = await resolveOAuthSignIn("jane@example.com", "Jane", "google")

    expect(result).toBe(OAUTH_ACCOUNT_EXISTS_REDIRECT)
    expect(prisma.customerAccount.create).not.toHaveBeenCalled()
    expect(prisma.customerAccount.update).not.toHaveBeenCalled()
  })

  it("denies sign-in when the email belongs to a different OAuth provider", async () => {
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: null,
      provider: "facebook",
    } as any)

    const result = await resolveOAuthSignIn("jane@example.com", "Jane", "google")

    expect(result).toBe(OAUTH_ACCOUNT_EXISTS_REDIRECT)
    expect(prisma.customerAccount.update).not.toHaveBeenCalled()
  })

  it("denies sign-in when a same-provider account somehow also has a password", async () => {
    // Defense in depth: a password identity is never bypassed via OAuth,
    // even if the provider column matches.
    vi.mocked(prisma.customerAccount.findUnique).mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      passwordHash: "hashed",
      provider: "google",
    } as any)

    const result = await resolveOAuthSignIn("jane@example.com", "Jane", "google")

    expect(result).toBe(OAUTH_ACCOUNT_EXISTS_REDIRECT)
  })

  it("denies sign-in when the provider shares no email", async () => {
    const result = await resolveOAuthSignIn(null, "Jane", "google")

    expect(result).toBe(OAUTH_ACCOUNT_EXISTS_REDIRECT)
    expect(prisma.customerAccount.findUnique).not.toHaveBeenCalled()
  })
})
