import type React from "react"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex-1 bg-background">
      <main className="container mx-auto px-4 py-8 space-y-6">
        <AdminBreadcrumb />
        {children}
      </main>
    </div>
  )
}
