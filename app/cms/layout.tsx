"use client"

import { ProtectedRoute } from "@/features/auth/components/protected-route"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute role="ADMIN">{children}</ProtectedRoute>
}
