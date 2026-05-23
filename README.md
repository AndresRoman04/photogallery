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

If you need to execute Prisma CLI commands inside the running container context, prefix them with `docker compose exec`:

* **Push schema updates to database:**
  ```bash
  docker compose exec app npx prisma db push
  ```
* **Generate Prisma Client:**
  ```bash
  docker compose exec app npx prisma generate
  ```

## 📄 License

Created for ByteForge. All rights reserved.
