import Link from "next/link"
import { auth } from "@/lib/auth"
import { SiteNavLinks } from "@/components/site-nav-links"

export async function SiteNav() {
  const session = await auth()
  const isAuthenticated = !!session?.user

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
          Photo Gallery
        </Link>
        <SiteNavLinks isAuthenticated={isAuthenticated} />
      </nav>
    </header>
  )
}
