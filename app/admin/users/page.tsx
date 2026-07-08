import { AdminUsers } from "@/components/admin-users"

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">Manage admin accounts that can access this dashboard</p>
      </div>
      <AdminUsers />
    </div>
  )
}
