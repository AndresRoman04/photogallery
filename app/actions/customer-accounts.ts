"use server"

import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { registerAttempt } from "@/lib/login-throttle"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

// Per-email: slows repeated attempts on one address. Global: the only reliable
// ceiling on mass creation, since server actions can't trust a client IP here
// (no reverse proxy). Both are deliberately generous for a small studio.
const PER_EMAIL_LIMIT = 3
const PER_EMAIL_WINDOW_MS = 15 * 60_000
const GLOBAL_LIMIT = 20
const GLOBAL_WINDOW_MS = 60 * 60_000

export async function registerCustomerAction(data: { email: string; password: string; name?: string | null }) {
  try {
    const email = data.email?.trim().toLowerCase()
    const password = data.password ?? ""

    if (!email || !EMAIL_REGEX.test(email)) {
      return { success: false, error: "Enter a valid email address." }
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
    }

    // Throttle before hashing so a flood can't burn bcrypt rounds. Both checks
    // return the same generic error as any other failure — no signal to an
    // attacker that a limit was hit (consistent with BFT-32's silent lockout).
    const [emailOk, globalOk] = await Promise.all([
      registerAttempt(email, "register", PER_EMAIL_LIMIT, PER_EMAIL_WINDOW_MS),
      registerAttempt("*", "register-global", GLOBAL_LIMIT, GLOBAL_WINDOW_MS),
    ])
    if (!emailOk || !globalOk) {
      console.warn(`Registration throttled (email=${email}, emailOk=${emailOk}, globalOk=${globalOk})`)
      return { success: false, error: "Failed to register" }
    }

    const passwordHash = await hashPassword(password)
    await prisma.customerAccount.create({
      data: { email, passwordHash, name: data.name?.trim() || null, provider: "credentials" },
    })

    return { success: true, email }
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return { success: false, error: "An account with that email already exists." }
    }
    console.error("Failed to register customer account:", error)
    return { success: false, error: "Failed to register" }
  }
}
