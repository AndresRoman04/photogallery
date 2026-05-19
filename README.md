# ByteForge Photo Gallery

A modern, secure photo gallery application built with Next.js 15, React 19, and Supabase. This application allows administrators to manage photo uploads and view customer selections through a protected administrative dashboard.

## 🚀 Features

- **Dynamic Photo Gallery:** Responsive grid for browsing and selecting photos.
- **Secure Admin Panel:** Protected administrative area for photo management.
- **Authentication:** Robust security using Supabase Auth and Next.js Middleware.
- **Real-time Notifications:** Instant feedback for user actions using Sonner toasts.
- **Theme Support:** Modern UI with dark/light mode support via Tailwind CSS.
- **Customer Selections:** Dedicated area to view and manage photos selected by customers.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Library:** [React 19](https://react.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [Radix UI](https://www.radix-ui.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AndresRoman04/photogallery.git
   cd photogallery
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔐 Administrative Access

The admin panel is protected and located at `/admin`. To access it:
1. Navigate to `/login`.
2. Sign in with your Supabase credentials.
3. You will be automatically redirected to the admin dashboard.

## 📄 License

Created for ByteForge. All rights reserved.
