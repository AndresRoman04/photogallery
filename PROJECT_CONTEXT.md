# Project Context: ByteForge Photo Gallery

## 🏗️ Architecture & Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Backend/DB:** Supabase (Auth, SSR, Database)
- **Styling:** Tailwind CSS (Modern `@theme` configuration)
- **UI Components:** Radix UI, Lucide React, Sonner (Toasts)

## 📂 Key Directories
- `app/`: Next.js 15 application routes and layouts.
- `app/admin/`: Protected dashboard for managing uploads and selections.
- `app/login/`: Entry point for administrative authentication.
- `components/ui/`: Low-level, reusable UI primitives (buttons, inputs, cards).
- `lib/supabase/`: Client and Server Supabase initializations using `@supabase/ssr`.
- `scripts/`: SQL database initialization and migration scripts.

## 🛠️ Core Components & Logic
- **AdminUpload:** Handles the file upload process to the gallery.
- **AdminSelections:** Interface for viewing customer-picked photos.
- **LogoutButton:** Manages client-side session destruction and redirection.
- **PhotoGallery:** The primary public-facing component for viewing images.

## 🔐 Security & Auth
- **Middleware:** `middleware.ts` acts as the primary gatekeeper, ensuring all `/admin/*` requests have a valid Supabase user session.
- **Auth Strategy:** SSR-compatible authentication leveraging cookies to maintain session state between the browser and Next.js server.
- **Protection:** Unauthorized access to admin routes triggers a redirect to `/login` with a `redirectedFrom` return path.

## 📊 Data Models / Database
- **SQL Scripts:** The project includes scripts for setting up gallery-related tables (`scripts/001_...` to `003_...`).
- **Supabase:** Integrated for both data storage and user management.

## 🚀 Recent Milestones
- **2026-05-19:** **BFT-7 Completed:** Implemented full admin security suite (Middleware, Login Page, Admin Layout, and Logout).
- **2026-05-19:** **Infrastructure:** Git repository initialized, branch management established (`main`, `feature/*`), and pushed to GitHub.
- **2026-05-19:** **Documentation:** Updated README and created initial Project Context.
