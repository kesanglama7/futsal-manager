"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Loader2, Trophy } from "lucide-react"

import { MatchesPublicList } from "@/features/public/components/matches/matches-public-list"
import { LeagueTable } from "@/features/league/components/league-table"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match } from "@/features/cms/types/cms-types"
import type { LeagueRow } from "@/lib/league-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type LoadState = "loading" | "ready" | "error"

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [leagueTable, setLeagueTable] = useState<LeagueRow[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadMatches = useCallback(async () => {
    setLoadState("loading")
    try {
      const res = await fetch("/api/public/matches")
      const data = await res.json()

      if (!res.ok) {
        setLoadError(data.error ?? "Failed to load matches")
        setLoadState("error")
        return
      }

      setMatches(data.matches)
      setLeagueTable(data.leagueTable ?? [])
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const upcoming = matches
    .filter((m) => m.status === MATCH_STATUS.LIVE || m.status === MATCH_STATUS.SCHEDULED)
    .sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )

  const past = matches
    .filter((m) => m.status === MATCH_STATUS.FINISHED)
    .sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight">Matches</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming fixtures and results from the Futsal Pro League.
        </p>
      </div>

      {loadState === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-4xl" />
          ))}
        </div>
      )}

      {loadState === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadMatches}>
            <Loader2 />
            Retry
          </Button>
        </div>
      )}

      {/* League standings */}
      {loadState === "ready" && leagueTable.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-rating" />
            <h2 className="font-heading text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">
              League Standings
            </h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-card p-2 sm:p-4">
            <LeagueTable rows={leagueTable} compact />
          </div>
        </section>
      )}

      {loadState === "ready" && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-12 text-center">
          <CalendarClock className="size-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No matches yet</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon for upcoming fixtures.
          </p>
        </div>
      )}

      {loadState === "ready" && matches.length > 0 && (
        <div className="flex flex-col gap-10">
          <MatchesPublicList title="Upcoming" matches={upcoming} />
          <MatchesPublicList title="Past" matches={past} />
        </div>
      )}
    </div>
  )
}
