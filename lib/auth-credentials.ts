// Extracted from lib/auth.ts so the admin-credential check can be unit tested
// without importing the `next-auth` package, which pulls in Next.js server
// internals not resolvable outside Next's own runtime.
export function validateAdminCredentials(email: unknown, password: unknown) {
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return { id: "1", name: "Admin", email: email as string }
  }
  return null
}
