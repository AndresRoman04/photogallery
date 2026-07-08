import Link from "next/link"
import { Camera } from "lucide-react"
import { auth } from "@/lib/auth"
import { SiteNavLinks } from "@/components/site-nav-links"
import { ModeToggle } from "@/components/mode-toggle"

export async function SiteNav() {
  const session = await auth()
  const role = session?.user?.role

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors">
          <Camera className="h-5 w-5" />
          Photo Gallery
        </Link>
        <div className="flex items-center gap-2">
          <SiteNavLinks role={role} />
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
