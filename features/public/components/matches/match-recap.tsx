"use client"

import { resolveMediaUrl } from "@/lib/media"
import type {
  Match,
  MatchEvent,
} from "@/features/cms/types/cms-types"
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

interface MatchRecapProps {
  match: Match
  events: MatchEvent[]
}

export function MatchRecap({ match, events }: MatchRecapProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        No goals recorded yet.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        Match Events
      </h3>
      <ul className="flex flex-col gap-2">
        {events.map((event) => {
          const isHome = event.teamId === match.homeTeamId
          const player = event.player
          const photoUrl = player ? resolveMediaUrl(player.photo) : null
          return (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3"
            >
              <span className="w-12 shrink-0 text-center font-display text-lg font-black text-primary">
                {event.minute}&#39;
              </span>
              <Avatar size="sm" className="size-8">
                <AvatarImage src={photoUrl ?? undefined} alt={player?.name ?? "Unknown"} />
                <AvatarFallback>{player ? initials(player.name) : "—"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {player ? `#${player.jersey} ${player.name}` : "Unknown player"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {event.team?.name ?? "Unknown team"}
                </div>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                  isHome
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isHome ? "Home" : "Away"}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
