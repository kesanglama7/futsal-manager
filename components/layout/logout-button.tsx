"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <Button onClick={handleLogout} variant="outline">
      <LogOut />
      Sign Out
    </Button>
  )
}
