import { AdminUpload } from "@/components/admin-upload"

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Photos</h2>
        <p className="text-muted-foreground">Add new photos to the gallery</p>
      </div>
      <AdminUpload />
    </div>
  )
}
