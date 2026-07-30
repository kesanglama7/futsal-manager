"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSessionStore } from "@/features/auth/store/session-store"
import type { Role } from "@/features/auth/types/auth-types"

interface ProtectedRouteProps {
  children: React.ReactNode
  role: Role
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, hydrated } = useSessionStore()

  useEffect(() => {
    // Wait for hydration and loading to finish before making redirect decisions
    if (!hydrated || isLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (user && user.role !== role) {
      // If role mismatch, redirect to their proper dashboard instead of home
      const target = user.role === "ADMIN" ? "/cms" : "/user"
      router.replace(target)
    }
  }, [isAuthenticated, isLoading, hydrated, user, role, router])

  // While waiting for session to rehydrate from localStorage, show loading
  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (user && user.role !== role) {
    return null
  }

  return <>{children}</>
}
