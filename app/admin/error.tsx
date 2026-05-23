"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin Dashboard Error Boundary captured an error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full border-amber-200 shadow-xl bg-gradient-to-br from-amber-50 via-white to-amber-50/30">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <AlertTriangle className="h-6 w-6 text-amber-600 animate-pulse" />
          <CardTitle className="text-amber-800 font-bold">Admin Dashboard Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-amber-700">
            An unexpected error occurred while loading the admin panel. Please check your network connection, ensure the Docker stack is running, and try resetting the view.
          </p>
          {error.message && (
            <div className="p-3 bg-amber-100/50 rounded-lg text-xs font-mono text-amber-800 border border-amber-200 break-words">
              {error.message}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => reset()}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all duration-300"
            >
              Reset View
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="flex-1 border-amber-200 text-amber-800 hover:bg-amber-50"
            >
              Go to Gallery
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
