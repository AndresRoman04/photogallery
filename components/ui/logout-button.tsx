"use client"

import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error("Logout failed", {
          description: error.message,
        })
        return
      }

      toast.success("Logged out successfully")
      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast.error("An unexpected error occurred", {
        description: error.message,
      })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  )
}
