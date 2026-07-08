import { Card, CardContent } from "@/components/ui/card"

// Route-level loading state for the server-rendered photographer directory —
// skeleton cards mirroring page.tsx's grid so the layout doesn't jump. Lives
// in the (home) route group so it only wraps `/`: a loading boundary at the
// app/ root would make Next stream every route's shell, turning
// /gallery/[slug]'s notFound() into a soft 404 (HTTP 200 with 404 content).
export default function Loading() {
  const studioName = process.env.NEXT_PUBLIC_STUDIO_NAME || "Photo Gallery"

  return (
    <main className="flex-1 bg-background">
      <section className="border-b bg-gradient-to-b from-muted/60 via-muted/20 to-background">
        <div className="container mx-auto px-4 py-16 text-center md:py-24">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">Photography Studio</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">{studioName}</h1>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Choose a photographer to browse their gallery
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden border border-muted bg-card shadow-md">
              <div className="relative aspect-[4/3] bg-muted shimmer-gradient"></div>
              <CardContent className="p-4 space-y-3">
                <div className="h-5 bg-muted shimmer-gradient rounded w-1/2"></div>
                <div className="h-4 bg-muted shimmer-gradient rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
