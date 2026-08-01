import Link from "next/link"
import { Shield } from "lucide-react"

import { PublicNav } from "@/features/public/components/matches/public-nav"

export const metadata = {
  title: "Matches — Futsal Pro League",
  description:
    "Upcoming and past futsal matches with lineups, stats and broadcast intros.",
}

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/matches" className="flex items-center gap-2 font-display text-xl font-black uppercase tracking-wider">
            <Shield className="size-5 text-primary" />
            Futsal Pro
          </Link>
          <PublicNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  )
}
