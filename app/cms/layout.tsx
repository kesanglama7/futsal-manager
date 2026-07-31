import { ProtectedRoute } from "@/features/auth/components/protected-route"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute role="ADMIN">
      <DashboardShell variant="cms" title="Futsal CMS Portal">
        {children}
      </DashboardShell>
    </ProtectedRoute>
  )
}
