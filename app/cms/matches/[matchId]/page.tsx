"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Loader2, MapPin } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { MatchLineupEditor } from "@/features/cms/components/matches/match-lineup-editor"
import { MatchGoalsPanel } from "@/features/cms/components/matches/match-goals-panel"
import { MatchStatusBadge } from "@/features/cms/components/matches/match-status"
import { resolveMediaUrl } from "@/lib/media"
import { MATCH_STATUS, MATCH_SIDE } from "@/generated/enums"
import type { Match, Team } from "@/features/cms/types/cms-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

type LoadState = "loading" | "ready" | "error"

function formatDateTime(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

function TeamAvatar({ team }: { team?: Team | null }) {
  if (!team) return null
  const logoUrl = resolveMediaUrl(team.logo)
  const initials = (team.name ?? "T")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar size="lg" className="size-16">
        <AvatarImage src={logoUrl ?? undefined} alt={`${team.name} logo`} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="max-w-40 truncate text-center text-sm font-semibold">
        {team.name}
      </div>
    </div>
  )
}

export default function MatchDetailPage() {
  const params = useParams<{ matchId: string }>()
  const matchId = Number(params.matchId)
  const { token } = useAuth()

  const [match, setMatch] = useState<Match | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyStatus, setBusyStatus] = useState<MATCH_STATUS | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const loadMatch = useCallback(async () => {
    if (!Number.isInteger(matchId)) {
      setLoadError("Invalid match")
      setLoadState("error")
      return
    }
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/cms/matches/${matchId}`, { headers })
      const data = await res.json()

      if (!res.ok) {
        setLoadError(data.error ?? "Failed to load match")
        setLoadState("error")
        return
      }

      setMatch(data.match)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [matchId, token])

  useEffect(() => {
    if (token) loadMatch()
  }, [token, loadMatch])

  async function updateStatus(next: MATCH_STATUS) {
    if (!match) return
    setBusyStatus(next)
    setStatusError(null)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/cms/matches/${match.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: next }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatusError(data.error ?? "Failed to update status")
        setBusyStatus(null)
        return
      }

      setBusyStatus(null)
      loadMatch()
    } catch {
      setStatusError("Network error. Please try again.")
      setBusyStatus(null)
    }
  }

  const homeLineup = match?.matchTeams?.find(
    (mt) => mt.side === MATCH_SIDE.HOME
  )
  const awayLineup = match?.matchTeams?.find(
    (mt) => mt.side === MATCH_SIDE.AWAY
  )

  const showScore =
    match?.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button size="sm" variant="ghost" render={<Link href="/cms/matches" />}>
          <ArrowLeft />
          Back to matches
        </Button>
      </div>

      {loadState === "loading" && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full max-w-xl rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {loadState === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadMatch}>
            <Loader2 />
            Retry
          </Button>
        </div>
      )}

      {loadState === "ready" && match && (
        <>
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MatchStatusBadge status={match.status} />
                {match.venue && (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    {match.venue}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatDateTime(match.scheduledAt)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-6 sm:gap-10">
              <TeamAvatar team={match.homeTeam} />
              <div className="flex flex-col items-center gap-1">
                {showScore ? (
                  <span className="text-4xl font-bold tabular-nums">
                    {match.homeScore} – {match.awayScore}
                  </span>
                ) : (
                  <span className="text-2xl font-semibold text-muted-foreground">
                    vs
                  </span>
                )}
                <span className="text-xs text-muted-foreground">Home – Away</span>
              </div>
              <TeamAvatar team={match.awayTeam} />
            </div>

            {statusError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {statusError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              {match.status === MATCH_STATUS.SCHEDULED && (
                <Button
                  size="sm"
                  disabled={busyStatus !== null}
                  onClick={() => updateStatus(MATCH_STATUS.LIVE)}
                >
                  {busyStatus === MATCH_STATUS.LIVE && (
                    <Loader2 className="animate-spin" />
                  )}
                  Start live
                </Button>
              )}
              {match.status === MATCH_STATUS.LIVE && (
                <Button
                  size="sm"
                  disabled={busyStatus !== null}
                  onClick={() => updateStatus(MATCH_STATUS.FINISHED)}
                >
                  {busyStatus === MATCH_STATUS.FINISHED && (
                    <Loader2 className="animate-spin" />
                  )}
                  Mark finished
                </Button>
              )}
              {match.status === MATCH_STATUS.FINISHED && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyStatus !== null}
                  onClick={() => updateStatus(MATCH_STATUS.LIVE)}
                >
                  {busyStatus === MATCH_STATUS.LIVE && (
                    <Loader2 className="animate-spin" />
                  )}
                  Reopen match
                </Button>
              )}
            </div>
          </div>

          {/* Lineups */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Lineups &amp; substitutions
            </h3>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary uppercase">
                    Home
                  </span>
                  <span className="truncate">{match.homeTeam?.name}</span>
                </div>
                {match.homeTeam && (
                  <MatchLineupEditor
                    match={match}
                    side={MATCH_SIDE.HOME}
                    team={match.homeTeam}
                    lineup={homeLineup}
                    onSaved={loadMatch}
                  />
                )}
              </div>

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground uppercase">
                    Away
                  </span>
                  <span className="truncate">{match.awayTeam?.name}</span>
                </div>
                {match.awayTeam && (
                  <MatchLineupEditor
                    match={match}
                    side={MATCH_SIDE.AWAY}
                    team={match.awayTeam}
                    lineup={awayLineup}
                    onSaved={loadMatch}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Goals */}
          <section className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Goals
            </h3>
            <MatchGoalsPanel
              match={match}
              events={match.events ?? []}
              onChanged={loadMatch}
            />
          </section>
        </>
      )}
    </div>
  )
}
