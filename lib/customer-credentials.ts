// Mirrors lib/auth-credentials.ts but checks the separate CustomerAccount
// table, so a customer login can never authenticate against admin accounts
// (or vice versa). Kept in its own module, importable without `next-auth`,
// so it stays unit-testable the same way.
import { prisma } from "./prisma"
import { verifyPassword } from "./password"
import { isLockedOut, recordFailure, recordSuccess } from "./login-throttle"

export async function validateCustomerCredentials(email: unknown, password: unknown) {
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return null
  }

  // Checked before touching the DB/bcrypt so a locked-out account doesn't
  // spend a bcrypt round, and returns the same generic null a wrong
  // password would — an attacker shouldn't learn a lockout is in effect.
  if (await isLockedOut(email, "customer")) {
    console.warn(`Customer login rejected — account locked out: ${email}`)
    return null
  }

  const account = await prisma.customerAccount.findUnique({ where: { email } })
  // No account, or an OAuth-only account with no password set — reject either way.
  if (!account || !account.passwordHash) return null

  const isValid = await verifyPassword(password, account.passwordHash)
  if (!isValid) {
    await recordFailure(email, "customer")
    return null
  }

  await recordSuccess(email, "customer")
  return { id: account.id, name: account.name ?? account.email, email: account.email }
}
