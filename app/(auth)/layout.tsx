import Link from "next/link"
import { Shield } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Link
        href="/matches"
        className="flex items-center gap-2 font-display text-2xl font-black uppercase tracking-wider"
      >
        <Shield className="size-6 text-primary" />
        Futsal Pro
      </Link>
      {children}
    </div>
  )
}
