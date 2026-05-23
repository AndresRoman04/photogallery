"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Gallery Error Boundary captured an error:", error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="max-w-md w-full border-red-200 shadow-xl bg-gradient-to-br from-red-50 via-white to-red-50/30">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <AlertCircle className="h-6 w-6 text-red-600 animate-pulse" />
          <CardTitle className="text-red-800 font-bold">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-red-700">
            An unexpected error occurred while loading the photo gallery. Please try resetting the view or contact support if the issue persists.
          </p>
          {error.message && (
            <div className="p-3 bg-red-100/50 rounded-lg text-xs font-mono text-red-800 border border-red-200 break-words">
              {error.message}
            </div>
          )}
          <Button
            onClick={() => reset()}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg transition-all duration-300"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
