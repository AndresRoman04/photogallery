import type { DefaultSession } from "next-auth"

// Adds `role` ("admin" | "customer") to the session/JWT so proxy.ts can gate
// /admin without re-querying the DB on every request. Set in lib/auth.ts's
// jwt/session callbacks based on which provider authenticated the user.
//
// next-auth re-exports its Session/JWT types from @auth/core (`export * from
// "@auth/core/..."`), and @auth/core's own types are what callback signatures
// actually use — so the augmentation has to target @auth/core, not next-auth.
declare module "next-auth" {
  interface Session {
    user: {
      role?: "admin" | "customer"
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/types" {
  interface Session {
    user: {
      role?: "admin" | "customer"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "customer"
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: "admin" | "customer"
  }
}
