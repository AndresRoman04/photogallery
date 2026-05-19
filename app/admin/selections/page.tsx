import { AdminSelections } from "@/components/admin-selections"

export default function AdminSelectionsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight">Customer Selections</h2>
        <p className="text-muted-foreground">View and manage customer photo selections</p>
      </div>
      <AdminSelections />
    </div>
  )
}
