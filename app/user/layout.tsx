"use client"

import { ProtectedRoute } from "@/features/auth/components/protected-route"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute role="USER">{children}</ProtectedRoute>
}
