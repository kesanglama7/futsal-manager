"use client"

import { LogoutButton } from "@/components/layout/logout-button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { useAuth } from "@/features/auth/hooks/use-auth"

export default function UserPage() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name}.
          </p>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your team will be shown here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
