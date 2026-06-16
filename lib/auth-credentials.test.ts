import { describe, it, expect, beforeEach, vi } from "vitest"
import { validateAdminCredentials } from "./auth-credentials"

describe("validateAdminCredentials", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com")
    vi.stubEnv("ADMIN_PASSWORD", "correct-password")
  })

  it("returns an admin user when credentials match", () => {
    expect(validateAdminCredentials("admin@example.com", "correct-password")).toEqual({
      id: "1",
      name: "Admin",
      email: "admin@example.com",
    })
  })

  it("returns null when the password is wrong", () => {
    expect(validateAdminCredentials("admin@example.com", "wrong")).toBeNull()
  })

  it("returns null when the email is wrong", () => {
    expect(validateAdminCredentials("someone-else@example.com", "correct-password")).toBeNull()
  })

  it("returns null when credentials are undefined", () => {
    expect(validateAdminCredentials(undefined, undefined)).toBeNull()
  })
})
