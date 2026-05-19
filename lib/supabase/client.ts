import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("[v0] Supabase URL available:", !!SUPABASE_URL)
  console.log("[v0] Supabase Anon Key available:", !!SUPABASE_ANON_KEY)

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[v0] Missing Supabase environment variables:", {
      url: !!SUPABASE_URL,
      key: !!SUPABASE_ANON_KEY,
    })

    const altUrl =
      (globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_URL ||
      (typeof window !== "undefined" && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL)
    const altKey =
      (globalThis as any).process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      (typeof window !== "undefined" && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    if (altUrl && altKey) {
      console.log("[v0] Using alternative environment variable access")
      supabaseClient = createBrowserClient(altUrl, altKey)
      return supabaseClient
    }

    throw new Error("Supabase environment variables are not available")
  }

  supabaseClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return supabaseClient
}

export const getSupabaseClient = createClient
