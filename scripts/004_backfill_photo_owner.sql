-- BFT-27: one-off backfill before `prisma db push` enforces photos.user_id
-- NOT NULL + FK. Assigns every pre-existing (ownerless) photo to the first
-- admin account — the one seeded from ADMIN_EMAIL by prisma/seed.ts.
--
-- Run order on a database that already has photos:
--   1. this script        (adds the column nullable and backfills it)
--   2. prisma db push     (adds NOT NULL, the FK, and the index)
-- Fresh databases (init.sh) can skip straight to `prisma db push`.
--
-- The seed must have run first: if `users` is empty the subquery yields NULL
-- and the subsequent `db push` will still refuse the NOT NULL constraint.

ALTER TABLE photos ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE photos
SET user_id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;
