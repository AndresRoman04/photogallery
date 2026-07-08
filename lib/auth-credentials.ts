// Extracted from lib/auth.ts so the credential check can be unit tested
// without importing the `next-auth` package, which pulls in Next.js server
// internals not resolvable outside Next's own runtime.
import { prisma } from "./prisma"
import { verifyPassword } from "./password"
import { isLockedOut, recordFailure, recordSuccess } from "./login-throttle"

export async function validateUserCredentials(email: unknown, password: unknown) {
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return null
  }

  // Checked before touching the DB/bcrypt so a locked-out account doesn't
  // spend a bcrypt round, and returns the same generic null a wrong
  // password would — an attacker shouldn't learn a lockout is in effect.
  if (await isLockedOut(email, "admin")) {
    console.warn(`Admin login rejected — account locked out: ${email}`)
    return null
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    await recordFailure(email, "admin")
    return null
  }

  await recordSuccess(email, "admin")
  return { id: user.id, name: user.name ?? user.email, email: user.email }
}
