"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"

import { resolveMediaUrl } from "@/lib/media"
import { MatchStatusBadge } from "@/features/cms/components/matches/match-status"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match, Team } from "@/features/cms/types/cms-types"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

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

function TeamMark({ team, align }: { team?: Team | null; align: "left" | "right" }) {
  if (!team) return null
  const logoUrl = resolveMediaUrl(team.logo)
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" && "flex-row-reverse text-right"
      )}
    >
      <Avatar size="sm" className="size-9 shrink-0">
        <AvatarImage src={logoUrl ?? undefined} alt={`${team.name} logo`} />
        <AvatarFallback>{initials(team.name)}</AvatarFallback>
      </Avatar>
      <span className="truncate font-semibold">{team.name}</span>
    </span>
  )
}

export function MatchCard({ match }: { match: Match }) {
  const finished =
    match.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null
  const isLive = match.status === MATCH_STATUS.LIVE

  return (
    <Link href={`/matches/${match.id}`} className="group">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-200 group-hover:border-primary/50 group-hover:-translate-y-0.5",
          isLive && "border-live/40"
        )}
      >
        {isLive && (
          <span className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-live" />
        )}
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <MatchStatusBadge status={match.status} />
          <span className="truncate text-xs font-medium text-muted-foreground">
            {formatDateTime(match.scheduledAt)}
          </span>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <TeamMark team={match.homeTeam} align="left" />
            {finished ? (
              <span className="shrink-0 font-display text-2xl font-black tabular-nums">
                {match.homeScore}
                <span className="mx-1 text-muted-foreground">–</span>
                {match.awayScore}
              </span>
            ) : (
              <span className="shrink-0 font-display text-lg font-bold text-muted-foreground">
                VS
              </span>
            )}
            <TeamMark team={match.awayTeam} align="right" />
          </div>
          {match.venue && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              <span className="truncate">{match.venue}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
