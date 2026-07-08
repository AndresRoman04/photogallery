import NextAuth from "next-auth"
import type { Provider } from "@auth/core/providers"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import { validateUserCredentials } from "./auth-credentials"
import { validateCustomerCredentials } from "./customer-credentials"
import { prisma } from "./prisma"

// Two distinct Credentials providers (different `id`s) so admin and customer
// logins can never cross-authenticate against the other's table, even though
// they share this one NextAuth instance.
const providers: Provider[] = [
  CredentialsProvider({
    id: "admin-credentials",
    name: "Admin Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      return validateUserCredentials(credentials?.email, credentials?.password)
    },
  }),
  CredentialsProvider({
    id: "customer-credentials",
    name: "Customer Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      return validateCustomerCredentials(credentials?.email, credentials?.password)
    },
  }),
]

// Only registered when configured — keeps the app working out of the box
// without Google/Facebook app credentials in dev.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({ allowDangerousEmailAccountLinking: true }))
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(FacebookProvider({ allowDangerousEmailAccountLinking: true }))
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // OAuth sign-ins never touch the admin User table — just record the
      // customer's email (and name, if shared) for future reference.
      if (account?.provider === "google" || account?.provider === "facebook") {
        if (!user.email) return false
        await prisma.customerAccount.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined },
          create: { email: user.email, name: user.name ?? null, provider: account.provider },
        })
      }
      return true
    },
    authorized({ auth, request: { nextUrl } }) {
      const isOnAdmin = nextUrl.pathname.startsWith("/admin")
      if (isOnAdmin) {
        // Only the admin-credentials provider ever yields role "admin" — a
        // customer session (password or OAuth) can never reach /admin.
        return auth?.user?.role === "admin"
      }
      return true
    },
    async jwt({ token, account }) {
      if (account) {
        token.role = account.provider === "admin-credentials" ? "admin" : "customer"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // `token.role` is set by the jwt() callback above; the underlying JWT
        // type augmentation isn't picked up at this call site, so narrow it here.
        session.user.role = token.role as "admin" | "customer" | undefined
        // token.sub carries the DB UUID returned by the authorize() callbacks
        // (User.id for admins, CustomerAccount.id for customers).
        if (token.sub) {
          session.user.id = token.sub
        }
      }
      return session
    },
  },
})
