import Link from "next/link"

export function SiteFooter() {
  const studioName = process.env.NEXT_PUBLIC_STUDIO_NAME || "Photo Gallery"

  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {studioName}. All rights reserved.
        </p>
        <Link href="/login" className="hover:text-foreground transition-colors">
          Admin
        </Link>
      </div>
    </footer>
  )
}
