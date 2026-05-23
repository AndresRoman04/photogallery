'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Gallery global error boundary captured error:', error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/20 bg-gradient-to-br from-destructive/5 via-card to-amber-500/5 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-destructive to-amber-600 bg-clip-text text-transparent">
            Something went wrong!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-sm">
            An error occurred while loading the gallery. Please try refreshing or resetting the view.
          </p>
          <div className="p-3 bg-muted rounded-lg border border-border text-xs text-muted-foreground font-mono break-all max-h-24 overflow-y-auto">
            {error.message || 'Unknown gallery error'}
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => reset()}
              className="bg-gradient-to-r from-destructive to-amber-600 hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
