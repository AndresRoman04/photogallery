// Shared input-validation constants. Kept free of Prisma/Next imports so it
// can be imported anywhere (server actions, tests) without pulling in runtime
// deps — same rationale as lib/slug.ts.

// Pragmatic email shape check (not RFC-complete): non-space local, "@",
// non-space domain, ".", non-space TLD. Matches what registration/user
// creation already used before this was centralized.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Upper bounds on free-text / collection sizes accepted from clients. These
// exist to stop abuse (inbox flooding, junk rows), not to constrain honest
// input — a real customer stays well under all of them.
export const MAX_EMAIL_LENGTH = 254 // RFC 5321 max
export const MAX_NAME_LENGTH = 100
export const MAX_NOTES_LENGTH = 2000
export const MAX_SELECTION_PHOTOS = 100
