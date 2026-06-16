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

export function SiteNavLinks({ role }: { role?: "admin" | "customer" }) {
  if (role === "admin") {
    return (
      <div className="flex items-center gap-4">
        <NavLink href="/">Gallery</NavLink>
        <NavLink href="/admin">Upload</NavLink>
        <NavLink href="/admin/selections">Selections</NavLink>
        <NavLink href="/admin/users">Users</NavLink>
        <LogoutButton />
      </div>
    )
  }

  if (role === "customer") {
    return (
      <div className="flex items-center gap-4">
        <NavLink href="/">Gallery</NavLink>
        <LogoutButton />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <NavLink href="/">Gallery</NavLink>
      <NavLink href="/account">Sign In</NavLink>
      <NavLink href="/login">Admin</NavLink>
    </div>
  )
}
