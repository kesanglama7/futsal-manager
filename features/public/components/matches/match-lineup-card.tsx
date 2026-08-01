"use client"

import { resolveMediaUrl } from "@/lib/media"
import type {
  FormationSlot,
  Player,
  Team,
} from "@/features/cms/types/cms-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { MatchPitchPlayer } from "@/features/public/components/matches/match-pitch-player"
import { PitchCanvas } from "@/features/cms/components/formation/pitch-canvas"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

interface MatchLineupCardProps {
  team: Team
  lineup: FormationSlot[]
  players: Player[]
  formationName?: string | null
  side: "Home" | "Away"
}

export function MatchLineupCard({
  team,
  lineup,
  players,
  formationName,
  side,
}: MatchLineupCardProps) {
  const accent = teamAccent(team)
  const logoUrl = resolveMediaUrl(team.logo)

  const bound = lineup.filter((slot) => slot.playerId !== null)
  const roster = lineup
    .map((slot) => ({
      slot,
      player: slot.playerId
        ? players.find((p) => p.id === slot.playerId) ?? null
        : null,
    }))
    .filter((row) => row.player !== null)

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={`${team.name} logo`} className="size-10 rounded-xl object-cover" />
        ) : (
          <span
            className="flex size-10 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{ backgroundColor: accent.primary }}
          >
            {initials(team.name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-2xl font-black uppercase">{team.name}</div>
          <div className="text-xs tracking-widest text-muted-foreground uppercase">
            {side} · {formationName ?? "No formation selected"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="mx-auto w-full max-w-xs">
          <PitchCanvas>
            {lineup.map((slot) => {
              const player = slot.playerId
                ? players.find((p) => p.id === slot.playerId) ?? null
                : null
              return (
                <MatchPitchPlayer
                  key={slot.slotId}
                  x={slot.x}
                  y={slot.y}
                  player={player}
                  team={team}
                  size="sm"
                />
              )
            })}
          </PitchCanvas>
        </div>

        <div>
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Lineup not set yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {roster.map((row) => {
                const player = row.player!
                const photoUrl = resolveMediaUrl(player.photo)
                return (
                  <li
                    key={row.slot.slotId}
                    className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5"
                  >
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md font-display text-sm font-black text-white"
                      style={{ backgroundColor: accent.primary }}
                    >
                      {player.jersey}
                    </span>
                    <Avatar size="sm" className="size-7 border border-border">
                      <AvatarImage src={photoUrl ?? undefined} alt="" />
                      <AvatarFallback>
                        <span className="font-display text-xs font-black">{player.jersey}</span>
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-display text-sm font-semibold uppercase">{player.name}</span>
                    <span className="ml-auto rounded bg-rating px-1.5 py-0.5 font-display text-xs font-black text-black">
                      {player.rating}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {bound.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {bound.length}/6 starting players
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
