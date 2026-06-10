"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogoutButton } from "@/components/ui/logout-button"

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors hover:text-foreground",
        pathname === href ? "text-foreground font-medium" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  )
}

export function SiteNavLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="flex items-center gap-4">
      <NavLink href="/">Gallery</NavLink>
      {isAuthenticated ? (
        <>
          <NavLink href="/admin">Upload</NavLink>
          <NavLink href="/admin/selections">Selections</NavLink>
          <LogoutButton />
        </>
      ) : (
        <NavLink href="/login">Admin Login</NavLink>
      )}
    </div>
  )
}
