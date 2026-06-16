// Mirrors lib/auth-credentials.ts but checks the separate CustomerAccount
// table, so a customer login can never authenticate against admin accounts
// (or vice versa). Kept in its own module, importable without `next-auth`,
// so it stays unit-testable the same way.
import { prisma } from "./prisma"
import { verifyPassword } from "./password"

export async function validateCustomerCredentials(email: unknown, password: unknown) {
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return null
  }

  const account = await prisma.customerAccount.findUnique({ where: { email } })
  // No account, or an OAuth-only account with no password set — reject either way.
  if (!account || !account.passwordHash) return null

  const isValid = await verifyPassword(password, account.passwordHash)
  if (!isValid) return null

  return { id: account.id, name: account.name ?? account.email, email: account.email }
}
