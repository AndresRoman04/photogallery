-- BFT-28: one-off backfill before `prisma db push` enforces users.slug
-- UNIQUE + NOT NULL. Derives a slug from each user's email local part
-- (lowercased, non-alphanumerics collapsed to hyphens), numbering duplicates
-- "-2", "-3", ... by account age — mirroring lib/slug.ts.
--
-- Run order on a database that already has users (same pattern as 004):
--   1. this script        (adds the column nullable and backfills it)
--   2. prisma db push --accept-data-loss
--      (adds NOT NULL and the unique index; the flag only acknowledges
--      Prisma's warning that adding UNIQUE fails on duplicates — this
--      backfill numbers duplicates, so none can exist)
-- Fresh databases (init.sh) can skip straight to `prisma db push`.

ALTER TABLE users ADD COLUMN IF NOT EXISTS slug text;

WITH bases AS (
  SELECT id,
         created_at,
         COALESCE(
           NULLIF(
             regexp_replace(
               regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9]+', '-', 'g'),
               '^-+|-+$', '', 'g'
             ),
             ''
           ),
           'photographer'
         ) AS base
  FROM users
  WHERE slug IS NULL
),
numbered AS (
  SELECT id, base, row_number() OVER (PARTITION BY base ORDER BY created_at) AS rn
  FROM bases
)
UPDATE users u
SET slug = CASE WHEN n.rn = 1 THEN n.base ELSE n.base || '-' || n.rn END
FROM numbered n
WHERE u.id = n.id;
