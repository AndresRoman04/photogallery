# ByteForge Photo Gallery

A modern, secure photo gallery application built with Next.js 16, React 19, Auth.js, Prisma, PostgreSQL, and MinIO. This application allows administrators to manage photo uploads and view customer selections through a protected administrative dashboard.

## 🚀 Features

- **Dynamic Photo Gallery:** Responsive grid for browsing and selecting photos.
- **Secure Admin Panel:** Protected administrative area for photo management.
- **Authentication:** Robust security using **Auth.js** and the new Next.js 16 **Proxy pattern** (`proxy.ts`).
- **Real-time Notifications:** Instant feedback for user actions using Sonner toasts.
- **Theme Support:** Modern UI with dark/light mode support via Tailwind CSS v4.
- **Customer Selections:** Dedicated area to view and manage photos selected by customers.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Database:** PostgreSQL via [Prisma 7](https://www.prisma.io/) (utilizing the pg driver adapter)
- **Authentication:** [Auth.js v5](https://authjs.dev/)
- **Storage:** [MinIO](https://min.io/) (S3-compatible object storage)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Components:** [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed.

### Installation & Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/AndresRoman04/photogallery.git
   cd photogallery
   ```

2. Initialize the application stack:
   Run the interactive/automated initialization script in the root directory:
   ```bash
   ./init.sh
   ```
   This script will:
   - Generate your local `.env` configuration file if it doesn't already exist.
   - Build and boot up the Next.js App, PostgreSQL database, and MinIO storage containers.
   - Wait for the database container to accept connections.
   - Synchronize the database schema with your Prisma models using `npx prisma db push`.

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🗄️ Services & Ports

When running via Docker Compose, the following local services are exposed:

- **Web Application:** [http://localhost:3000](http://localhost:3000)
- **PostgreSQL Database:** `localhost:5432`
- **MinIO S3 API:** [http://localhost:9000](http://localhost:9000)
- **MinIO Admin Console:** [http://localhost:9001](http://localhost:9001)

---

## 🔐 Administrative Access

The admin dashboard is protected and located at `/admin`. To access it:
1. Navigate to `/login`.
2. Sign in with the default credentials:
   - **Email:** `admin@example.com`
   - **Password:** `adminPassword`
3. You will be automatically redirected to the admin dashboard.

---

## 🛠️ Development & Database Commands

Prisma CLI commands run in a one-shot tooling container (the app image is a pure standalone build with no Prisma CLI inside):

* **Push schema updates to database:**
  ```bash
  docker compose run --rm migrate
  ```
* **Seed the initial admin user:**
  ```bash
  docker compose run --rm migrate pnpm exec prisma db seed
  ```
* **Any other Prisma command:**
  ```bash
  docker compose run --rm migrate pnpm exec prisma <command>
  ```
* **Provision the storage bucket** (creates the `photos` bucket and its anonymous-download policy; idempotent — `init.sh` runs this automatically):
  ```bash
  docker compose run --rm storage-init
  ```

## 🛡️ Dependency Audit Baseline

As of 2026-07-10 (BFT-33/BFT-34), `pnpm audit --prod` is **clean** — zero known
vulnerabilities in the production dependency tree. Anything a future
`pnpm audit --prod` reports is a genuine regression.

The full audit (`pnpm audit`, dev tree included) carries two accepted
advisories in `@modelcontextprotocol/sdk@0.5.0`, pulled in by
`@orengrinker/jira-mcp-server` — a local development tool (Claude Code Jira
integration) that never ships to production. Every published version of that
package pins the same vulnerable SDK, so there is no upgrade path short of
replacing the tool; the risk is accepted because the server only runs locally
over stdio during development.

Transitive pins live in `pnpm-workspace.yaml` `overrides` (`hono`, `postcss`) —
check there first when an advisory points at a package no app code imports.

## 📄 License

Created for ByteForge. All rights reserved.
