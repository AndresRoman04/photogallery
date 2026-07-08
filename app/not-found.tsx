import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageOff, Home } from "lucide-react"

// Rendered for any unknown route, including /gallery/[slug] slugs that don't
// resolve to a photographer (that page calls notFound()) — the most likely
// way a customer lands here, via a stale or mistyped gallery link.
export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImageOff className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-light tracking-tight">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-sm">
            This page doesn&apos;t exist — the gallery link may be outdated or mistyped.
          </p>
          <div className="flex justify-center">
            <Button asChild className="flex items-center gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Browse Galleries
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
