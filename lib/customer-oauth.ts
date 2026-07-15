// Decides whether a Google/Facebook sign-in may proceed (BFT-35). Accounts
// stay with the sign-in method that created them: an OAuth sign-in never
// silently merges into an email-matched account someone created by password
// (or via the other OAuth provider), because neither side has proven they're
// the same person — credentials registration doesn't verify emails, so an
// email match proves nothing in either direction.
//
// Extracted from lib/auth.ts so it can be unit tested without importing
// `next-auth`, per the lib/auth-credentials.ts precedent.
import { prisma } from "./prisma"

// Returning a string from Auth.js's signIn callback redirects there instead
// of completing the sign-in; account-auth.tsx explains the error to the user.
export const OAUTH_ACCOUNT_EXISTS_REDIRECT = "/account?error=account-exists"

export async function resolveOAuthSignIn(
  email: string | null | undefined,
  name: string | null | undefined,
  provider: string
): Promise<true | string> {
  if (!email) return OAUTH_ACCOUNT_EXISTS_REDIRECT

  const existing = await prisma.customerAccount.findUnique({ where: { email } })

  if (!existing) {
    await prisma.customerAccount.create({
      data: { email, name: name ?? null, provider },
    })
    return true
  }

  // Returning OAuth user: same provider created the account, no password
  // identity to protect — refresh the name and let them in.
  if (existing.provider === provider && !existing.passwordHash) {
    await prisma.customerAccount.update({
      where: { email },
      data: { name: name ?? undefined },
    })
    return true
  }

  console.warn(
    `OAuth sign-in denied — ${provider} attempted email already registered via ${existing.provider}: ${email}`
  )
  return OAUTH_ACCOUNT_EXISTS_REDIRECT
}
