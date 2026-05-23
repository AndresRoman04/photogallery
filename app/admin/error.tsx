'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert, RefreshCw, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin Panel error boundary captured error:', error)
  }, [error])

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card className="border-destructive/30 shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Admin Panel Error</CardTitle>
              <CardDescription>
                An error occurred within the administration dashboard.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg border border-border">
            <h4 className="font-semibold text-sm text-foreground mb-1">Details:</h4>
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
              {error.message || 'An unexpected error occurred in the admin panel.'}
            </pre>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Admin Route
            </Button>
            <Button
              asChild
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Link href="/">
                <LayoutDashboard className="h-4 w-4" />
                Go to Main Gallery
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
