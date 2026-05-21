# Pull Request: BFT-11 Migration from Supabase to Open-Source Stack

## Description
This PR migrates the photography project from Supabase to a fully open-source, containerized stack. It replaces Supabase Auth with **Auth.js**, Supabase Database with **PostgreSQL (via Prisma)**, and Supabase Storage with **MinIO (S3-compatible)**.

Jira Story: **BFT-11**

## Changes

### 🏗️ Infrastructure & DevOps
- **Docker Integration:** Added `Dockerfile` (optimized for Next.js 16 standalone) and `docker-compose.yml` to orchestrate App, DB, and Storage.
- **Security:** Implemented a **24-hour security window** for dependencies using pnpm/npm `min-release-age` and filtered build scripts.
- **Node.js:** Upgraded environment to **Node.js 22** to support modern pnpm and Next.js 16 features.

### 🔐 Authentication (Auth.js)
- Replaced `@supabase/ssr` with **Auth.js v5 (beta)**.
- Implemented `lib/auth.ts` with a Credentials Provider for admin access.
- Migrated `middleware.ts` to the new Next.js 16 `proxy.ts` convention.
- Refactored `LoginPage` and `LogoutButton` to use Auth.js hooks.

### 💾 Persistence (Prisma ORM)
- Replaced Supabase client with **Prisma 7**.
- Created `schema.prisma` and `prisma.config.ts` (complying with Prisma 7's new driver adapter requirement).
- Implemented `PrismaPg` adapter with `pg` connection pooling in `lib/prisma.ts`.
- Migrated all data fetching to **Server Actions** in `app/actions/photos.ts`.

### 📦 Storage (MinIO/S3)
- Replaced Supabase Storage with the **AWS S3 SDK**.
- Created `lib/storage.ts` with support for both internal (Docker) and public (Browser) endpoints.
- Configured automatic bucket initialization and public access policies via Docker CLI.

### ⚡ Next.js & UI
- Upgraded to **Next.js 16**.
- Refactored `AdminUpload` to handle **10MB file limits** and use Server Actions.
- Fixed pre-rendering issues in the Login page using **Suspense boundaries**.
- Added missing dependencies like `vaul` for UI components.

## Technical Details
- **Standalone Mode:** Enabled `output: "standalone"` in `next.config.mjs` for lightweight production containers.
- **Driver Adapters:** Used `@prisma/adapter-pg` to enable PostgreSQL support in the latest Prisma version without legacy Rust engines.
- **Proxy Pattern:** Adopted the new Next.js 16 `proxy` export in `proxy.ts`.

## Verification
- [x] Containers build successfully using `docker-compose build`.
- [x] Database schema initializes correctly via `npx prisma db push`.
- [x] Admin login/logout flows verified.
- [x] Image upload and public gallery display verified with MinIO.

## Related Issues
Closes **BFT-11**
