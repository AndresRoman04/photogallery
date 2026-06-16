import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { validateAdminCredentials } from "./auth-credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return validateAdminCredentials(credentials?.email, credentials?.password)
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith("/admin")
      if (isOnAdmin) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }
      return true
    },
  },
})
