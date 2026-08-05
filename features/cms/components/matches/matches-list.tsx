"use client"

import Link from "next/link"
import { useState } from "react"
import { MapPin, Pencil, Trash2, Loader2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { resolveMediaUrl } from "@/lib/media"
import { MatchStatusBadge } from "@/features/cms/components/matches/match-status"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match } from "@/features/cms/types/cms-types"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface MatchesListProps {
  matches: Match[]
  onEdit: (match: Match) => void
  onDeleted: (matchId: number) => void
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

function TeamMark({
  name,
  logo,
  side,
}: {
  name: string
  logo: string | null
  side: "home" | "away"
}) {
  const logoUrl = resolveMediaUrl(logo)
  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        side === "away" && "flex-row-reverse text-right"
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="size-7 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span
          className={
            side === "home"
              ? "size-7 shrink-0 rounded-lg bg-primary/10"
              : "size-7 shrink-0 rounded-lg bg-muted"
          }
        />
      )}
      <span className="truncate font-semibold">{name}</span>
    </span>
  )
}

export function MatchesList({ matches, onEdit, onDeleted }: MatchesListProps) {
  const { token } = useAuth()
  const [deleting, setDeleting] = useState<Match | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError(null)

    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/cms/matches/${deleting.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Failed to delete match")
        setBusy(false)
        return
      }
      onDeleted(deleting.id)
      setDeleting(null)
      setBusy(false)
    } catch {
      setError("Network error. Please try again.")
      setBusy(false)
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {matches.map((match) => {
          const home = match.homeTeam
          const away = match.awayTeam
          const finished =
            match.status === MATCH_STATUS.FINISHED &&
            match.homeScore !== null &&
            match.awayScore !== null
          const isLive = match.status === MATCH_STATUS.LIVE

          return (
            <Card
              key={match.id}
              className={cn(
                "relative overflow-hidden",
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
                  {home && (
                    <TeamMark name={home.name} logo={home.logo} side="home" />
                  )}
                  {finished ? (
                    <span className="shrink-0 font-display text-2xl font-black tabular-nums">
                      {match.homeScore}
                      <span className="mx-1 text-muted-foreground">–</span>
                      {match.awayScore}
                    </span>
                  ) : isLive ? (
                    <span className="shrink-0 font-display text-lg font-black tabular-nums text-live">
                      {match.homeScore ?? 0}
                      <span className="mx-1 text-muted-foreground">–</span>
                      {match.awayScore ?? 0}
                    </span>
                  ) : (
                    <span className="shrink-0 font-display text-lg font-bold text-muted-foreground">
                      VS
                    </span>
                  )}
                  {away && (
                    <TeamMark name={away.name} logo={away.logo} side="away" />
                  )}
                </div>
                {match.venue && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href={`/cms/matches/${match.id}`} />}
                >
                  Manage
                </Button>
                <div className="flex-1" />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit match"
                  onClick={() => onEdit(match)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete match"
                  onClick={() => setDeleting(match)}
                >
                  <Trash2 />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete match</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this match between{" "}
              {deleting?.homeTeam?.name} and {deleting?.awayTeam?.name}? This
              will permanently remove its lineups and events.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={busy}
            >
              {busy && <Loader2 className="animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
