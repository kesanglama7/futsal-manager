"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Loader2, MapPin, Play } from "lucide-react"

import { MatchIntroModal } from "@/features/public/components/matches/match-intro-modal"
import { MatchLineupCard } from "@/features/public/components/matches/match-lineup-card"
import { MatchStats } from "@/features/public/components/matches/match-stats"
import { MatchRecap } from "@/features/public/components/matches/match-recap"
import { PublicTabs } from "@/features/public/components/matches/public-tabs"
import { MatchStatusBadge } from "@/features/cms/components/matches/match-status"
import { resolveMediaUrl } from "@/lib/media"
import { MATCH_STATUS, MATCH_SIDE } from "@/generated/enums"
import type { Team } from "@/features/cms/types/cms-types"
import type { MatchDetail } from "@/features/public/types/public-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type LoadState = "loading" | "ready" | "error"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

function TeamBlock({ team }: { team?: Team | null }) {
  if (!team) return null
  const logoUrl = resolveMediaUrl(team.logo)
  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar size="lg" className="size-16">
        <AvatarImage src={logoUrl ?? undefined} alt={`${team.name} logo`} />
        <AvatarFallback>{initials(team.name)}</AvatarFallback>
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

  const [detail, setDetail] = useState<MatchDetail | null>(null)
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [introOpen, setIntroOpen] = useState(false)

  const loadDetail = useCallback(async () => {
    if (!Number.isInteger(matchId)) {
      setLoadError("Invalid match")
      setLoadState("error")
      return
    }
    setLoadState("loading")
    try {
      const res = await fetch(`/api/public/matches/${matchId}`)
      const data = await res.json()

      if (!res.ok) {
        setLoadError(data.error ?? "Failed to load match")
        setLoadState("error")
        return
      }

      setDetail(data as MatchDetail)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [matchId])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const match = detail?.match
  const home = match?.homeTeam
  const away = match?.awayTeam
  const homePlayers = home?.roster ?? []
  const awayPlayers = away?.roster ?? []
  const homeLineup =
    match?.matchTeams?.find((mt) => mt.side === MATCH_SIDE.HOME) ?? null
  const awayLineup =
    match?.matchTeams?.find((mt) => mt.side === MATCH_SIDE.AWAY) ?? null

  const showScore =
    match?.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null

  const introDisabled = !home || !away

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button size="sm" variant="ghost" render={<Link href="/matches" />}>
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
          <Button variant="outline" size="sm" onClick={loadDetail}>
            <Loader2 />
            Retry
          </Button>
        </div>
      )}

      {loadState === "ready" && match && (
        <>
          {/* Scoreboard */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-6">
            {match.status === MATCH_STATUS.LIVE && (
              <span className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-live" />
            )}
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
              <span className="text-xs font-medium text-muted-foreground">
                {formatDateTime(match.scheduledAt)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-6 sm:gap-10">
              <TeamBlock team={home} />
              <div className="flex flex-col items-center gap-1">
                {showScore ? (
                  <div className="flex items-center font-display text-6xl font-black tabular-nums sm:text-7xl">
                    <span>{match.homeScore}</span>
                    <span className="mx-3 text-muted-foreground">–</span>
                    <span>{match.awayScore}</span>
                  </div>
                ) : (
                  <span className="font-display text-4xl font-black text-muted-foreground">
                    VS
                  </span>
                )}
                <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Home – Away
                </span>
              </div>
              <TeamBlock team={away} />
            </div>

            {/* Scorers strip — goal minute + player name per team */}
            {showScore && match.events && match.events.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4">
                {[home?.id, away?.id].map((teamId) => {
                  const teamGoals = match.events
                    ?.filter((e) => e.teamId === teamId)
                    .sort((a, b) => a.minute - b.minute)
                  const team = teamId === home?.id ? home : away
                  return (
                    <div key={teamId} className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                        {team?.name}
                      </div>
                      {teamGoals && teamGoals.length > 0 ? (
                        teamGoals.map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="truncate font-medium">
                              {e.player?.name ?? "Unknown"}
                            </span>
                            <span className="shrink-0 font-display text-base font-black text-live">
                              {e.minute}&#39;
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {!introDisabled && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => setIntroOpen(true)}>
                  <Play />
                  Launch Match Intro
                </Button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <PublicTabs
            tabs={[
              { id: "intro", label: "Intro" },
              { id: "lineups", label: "Lineups" },
              { id: "stats", label: "Stats" },
              { id: "recap", label: "Recap" },
            ]}
            defaultTab="lineups"
          >
            {(active) => {
              if (active === "intro") {
                return (
                  <div className="rounded-2xl border bg-card p-10 text-center">
                    <h3 className="text-2xl font-black">Broadcast Intro Ready</h3>
                    <p className="mt-2 text-muted-foreground">
                      A cinematic sequence featuring both team lineups, player
                      cards, and head-to-head stats.
                    </p>
                    <Button size="lg" className="mt-6" onClick={() => setIntroOpen(true)} disabled={introDisabled}>
                      <Play />
                      Play Intro
                    </Button>
                  </div>
                )
              }

              if (active === "lineups") {
                return (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <MatchLineupCard
                      team={home!}
                      lineup={homeLineup?.positions ?? []}
                      players={homePlayers}
                      formationName={homeLineup?.formation?.name}
                      side="Home"
                    />
                    <MatchLineupCard
                      team={away!}
                      lineup={awayLineup?.positions ?? []}
                      players={awayPlayers}
                      formationName={awayLineup?.formation?.name}
                      side="Away"
                    />
                  </div>
                )
              }

              if (active === "stats") {
                return (
                  <MatchStats
                    match={match}
                    home={home!}
                    away={away!}
                    homePlayers={homePlayers}
                    awayPlayers={awayPlayers}
                    summary={detail?.summary ?? null}
                    events={match.events ?? []}
                  />
                )
              }

              return <MatchRecap match={match} events={match.events ?? []} />
            }}
          </PublicTabs>
        </>
      )}

      {home && away && (
        <MatchIntroModal
          open={introOpen}
          onClose={() => setIntroOpen(false)}
          match={match!}
          home={home}
          away={away}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          summary={detail?.summary ?? null}
        />
      )}
    </div>
  )
}
