"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  Shield,
  Users,
  CalendarClock,
  Radio,
  Clock,
  Trophy,
  Loader2,
  ChevronRight,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { LogoutButton } from "@/components/layout/logout-button"
import { MatchStatusBadge } from "@/features/cms/components/matches/match-status"
import { LeagueTable } from "@/features/league/components/league-table"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match, Team } from "@/features/cms/types/cms-types"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type LoadState = "loading" | "ready" | "error"

interface DashboardResponse {
  counts: {
    teams: number
    players: number
    matches: number
    live: number
    upcoming: number
    finished: number
  }
  recentMatches: Match[]
  leagueTable: (Team & {
    teamId: number
    position: number
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    points: number
  })[]
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

export default function CMSPage() {
  const { token } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch("/api/cms/dashboard", { headers })
      const body = await res.json()

      if (!res.ok) {
        setLoadError(body.error ?? "Failed to load dashboard")
        setLoadState("error")
        return
      }

      setData(body as DashboardResponse)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [token])

  useEffect(() => {
    if (token) loadDashboard()
  }, [token, loadDashboard])

  if (loadState === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full max-w-sm rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (loadState === "error" || !data) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Welcome to the Futsal CMS Portal.</p>
          </div>
          <LogoutButton />
        </div>
        <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            <Loader2 />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { counts, recentMatches, leagueTable } = data

  const kpis = [
    { label: "Teams", value: counts.teams, icon: Shield, href: "/cms/teams" },
    { label: "Players", value: counts.players, icon: Users, href: "/cms/teams" },
    { label: "Matches", value: counts.matches, icon: CalendarClock, href: "/cms/matches" },
    { label: "Live", value: counts.live, icon: Radio, href: "/cms/matches", live: true },
    { label: "Upcoming", value: counts.upcoming, icon: Clock, href: "/cms/matches" },
    { label: "Finished", value: counts.finished, icon: Trophy, href: "/cms/matches" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Overview of your league — teams, matches, and the standings.
          </p>
        </div>
        {/* <LogoutButton /> */}
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          const content = (
            <Card className={kpi.live && kpi.value > 0 ? "border-live/40" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className={kpi.live && kpi.value > 0 ? "size-4 text-live" : "size-4 text-muted-foreground"} />
              </CardHeader>
              <CardContent>
                <div className="font-display text-4xl font-black tabular-nums">
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          )
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className="group">
              {content}
            </Link>
          ) : (
            <div key={kpi.label}>{content}</div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-xl font-bold uppercase">Recent Matches</CardTitle>
              <CardDescription>Latest fixtures and results</CardDescription>
            </div>
            <Button size="sm" variant="ghost" render={<Link href="/cms/matches" />}>
              View all <ChevronRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matches yet. Schedule your first match to see it here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentMatches.map((m) => {
                  const finished =
                    m.status === MATCH_STATUS.FINISHED &&
                    m.homeScore !== null &&
                    m.awayScore !== null
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/cms/matches/${m.id}`}
                        className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-muted/60"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="truncate text-sm font-medium">{m.homeTeam?.name}</span>
                          <span className="shrink-0 font-display text-base font-black tabular-nums">
                            {finished
                              ? `${m.homeScore} – ${m.awayScore}`
                              : "vs"}
                          </span>
                          <span className="truncate text-sm font-medium">{m.awayTeam?.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {formatDateTime(m.scheduledAt)}
                          </span>
                          <MatchStatusBadge status={m.status} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* League table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl font-bold uppercase">League Table</CardTitle>
            <CardDescription>Standings from finished matches</CardDescription>
          </CardHeader>
          <CardContent>
            {leagueTable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No finished matches yet. Standings will appear once matches are completed.
              </p>
            ) : (
              <LeagueTable rows={leagueTable} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
