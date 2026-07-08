"use client"

// Last-resort boundary for errors thrown in the root layout itself, where
// app/error.tsx can't catch them. It replaces the entire document, so it must
// render its own <html>/<body> and can't rely on any provider (theme, fonts,
// toaster) from app/layout.tsx — keep it to plain elements and utility classes.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("Root layout error boundary captured error:", error)

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xl">
          <h1 className="text-2xl font-light tracking-tight mb-3">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6">
            An unexpected error prevented the app from loading. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
