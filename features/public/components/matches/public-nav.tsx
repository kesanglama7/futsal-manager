"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"

export function PublicNav() {
  const router = useRouter()
  const { user, isAuthenticated, hydrated, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push("/matches")
  }

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Button size="sm" variant="ghost" render={<Link href="/matches" />}>
        Matches
      </Button>

      {hydrated && isAuthenticated && user ? (
        <>
          <Button size="sm" variant="ghost" render={<Link href="/cms" />}>
            Admin
          </Button>
          <Button size="sm" variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </>
      ) : (
        <Button size="sm" variant="outline" render={<Link href="/login" />}>
          Sign in
        </Button>
      )}
    </nav>
  )
}
