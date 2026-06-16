// Extracted from lib/auth.ts so the credential check can be unit tested
// without importing the `next-auth` package, which pulls in Next.js server
// internals not resolvable outside Next's own runtime.
import { prisma } from "./prisma"
import { verifyPassword } from "./password"

export async function validateUserCredentials(email: unknown, password: unknown) {
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return null
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  return { id: user.id, name: user.name ?? user.email, email: user.email }
}
