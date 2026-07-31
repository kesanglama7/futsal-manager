import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute role="USER">
      <DashboardShell variant="user" title="Futsal User Portal">
        {children}
      </DashboardShell>
    </ProtectedRoute>
  )
}
