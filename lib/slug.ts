// URL-safe slugs for the public per-photographer gallery routes
// (/gallery/[slug]). Kept free of Prisma/Next imports so it can be unit
// tested directly, per the lib/auth-credentials.ts precedent.

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // strip combining marks left over from NFKD decomposition (é -> e)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// Slugs are generated once at account creation and never change afterwards —
// silently moving a photographer's public gallery URL on rename would be
// worse than a stale slug.
export async function generateUniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const root = slugify(base) || "photographer"
  let candidate = root
  for (let n = 2; await isTaken(candidate); n++) {
    candidate = `${root}-${n}`
  }
  return candidate
}
