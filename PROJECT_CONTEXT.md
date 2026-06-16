# Project Context: ByteForge Photo Gallery

## 🏗️ Architecture & Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Backend/DB:** PostgreSQL (via Prisma 7) & MinIO (S3-compatible Object Storage)
- **Authentication:** Auth.js v5 (beta)
- **Styling:** Tailwind CSS v4

## 📂 Key Directories
- `app/`: Application pages and routing.
  - `app/actions/`: Server Actions handling application CRUD operations.
  - `app/admin/`: Administrative dashboard for managing photos and customer selections.
  - `app/login/`: Interactive login page.
- `components/`: UI components (including Radix UI and shadcn/ui).
- `lib/`: Business logic utilities and helper configurations.
  - `lib/auth.ts`: Authentication configurations and authorization logic.
  - `lib/prisma.ts`: Database client connection pooling setup.
  - `lib/storage.ts`: S3/MinIO bucket connection and upload/download logic.
- `prisma/`: Prisma schema configuration files.
- `scripts/`: Development and utility helper scripts.

## 🛠️ Core Components & Logic
- **Server Actions (`app/actions/photos.ts`):** Implements database interactions for CRUD operations, including adding new photo entries and tracking customer photo selections.
- **Storage client (`lib/storage.ts`):** Initializes client connections to MinIO (S3) for file uploads, downloads, and presigned URLs.
- **Proxy Middleware (`proxy.ts`):** Uses the Next.js 16 proxy pattern to orchestrate page and path authentication guards.

## 🔐 Security & Auth
- **Admin Access:** Protected by Auth.js's `admin-credentials` provider, validated against the DB-backed `User` table (`lib/auth-credentials.ts`); passwords are hashed with `bcryptjs` (`lib/password.ts`) — no plaintext storage. Sessions carry `role: "admin"`, the only role allowed onto `/admin/*` (enforced in `lib/auth.ts`'s `authorized` callback).
- **Account Bootstrap:** `prisma/seed.ts` seeds one initial admin user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` only when the `users` table is empty. Additional admin accounts are managed at `/admin/users` (`app/actions/users.ts`).
- **Customer Accounts:** Separate, lower-privilege identity (`role: "customer"`) backed by `CustomerAccount` — self-registered with email/password at `/account` (`app/actions/customer-accounts.ts`), or via Google/Facebook OAuth (only enabled when their client ID/secret env vars are set). OAuth sign-ins just upsert the customer's email/name for reference; customers can never reach `/admin`.
- **Route Guarding:** Standard middleware matcher configuration redirects unauthenticated traffic trying to access `/admin/*` to `/login`.

## 📊 Data Models / Database
- **`User`**: Admin account — email (unique), hashed password, optional display name.
- **`CustomerAccount`**: Customer account — email (unique), optional hashed password (null for OAuth-only), optional name, signup provider.
- **`Photo`**: Stores photo metadata, titles, description, public image URLs, and private S3 storage paths.
- **`CustomerSelection`**: Represents photos selected by customers, including name, email, feedback notes, and a list of photo UUIDs.

## 🚀 Recent Milestones
- **May 19, 2026:** BFT-7: Integrated admin security checks.
- **May 21, 2026:** BFT-11: Migrated architecture from Supabase to self-hosted PostgreSQL (Prisma 7) and MinIO (Docker).
- **May 22, 2026:** Created `init.sh` for developer bootstrapping and updated project documentation.
- **June 15, 2026:** BFT-26: Replaced the single hardcoded admin with DB-backed `User` accounts, hashed passwords, a seed script for the first login, and an `/admin/users` management page.
- **June 15, 2026:** Added customer-facing `/account` sign in/register page (email+password plus optional Google/Facebook OAuth) backed by a new `CustomerAccount` model, kept fully separate from admin access via a `role` claim on the session. Filed BFT-29 for a future "customers create their own galleries" feature.
