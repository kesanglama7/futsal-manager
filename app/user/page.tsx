"use client"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function UserPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>User Dashboard</CardTitle>
          <CardDescription>
            Welcome to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Signed in as <strong>{user?.name}</strong> ({user?.email})
          </p>
          <p className="text-xs text-muted-foreground">
            Role: <span className="font-medium uppercase">{user?.role}</span>
          </p>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
