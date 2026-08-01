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

interface MatchLineupRevealProps {
  team: Team
  lineup: FormationSlot[]
  players: Player[]
  title: string
  reverse?: boolean
  onPlayer?: (player: Player) => void
}

const STEP = 0.22

/**
 * Light-theme port of animation/BroadcastLineup.tsx: TV-style lineup reveal
 * with a team banner, staggered roster rows, and pitch markers that pop in
 * synced to the rows. Animations are CSS-driven (tw-animate-css + inline
 * animationDelay), no framer-motion.
 */
export function MatchLineupReveal({
  team,
  lineup,
  players,
  title,
  reverse = false,
  onPlayer,
}: MatchLineupRevealProps) {
  const accent = teamAccent(team)

  const roster = lineup
    .map((slot) => ({
      slot,
      player: slot.playerId
        ? players.find((p) => p.id === slot.playerId) ?? null
        : null,
    }))
    .filter((row) => row.player !== null)

  const lowerThird = roster
    .map((row) => `${row.player!.jersey} ${row.player!.name}`)
    .join("   ·   ")

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Team-color ambience */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at ${reverse ? "80%" : "20%"} 30%, ${accent.primary}, transparent 60%)`,
        }}
      />
      {/* Diagonal light sweep */}
      <div className="pointer-events-none absolute inset-y-0 w-1/3 animate-[sweep_1.6s_ease-out] skew-x-12 bg-primary/10 blur-2xl" />

      <div
        className={`relative flex h-full flex-col gap-4 p-5 md:grid md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-8 md:p-10 ${
          reverse ? "md:[direction:rtl]" : ""
        }`}
      >
        {/* Roster column */}
        <div className="min-w-0 [direction:ltr]">
          {/* Banner */}
          <div
            className="relative mb-4 flex animate-in slide-in-from-left-1/2 items-center gap-3 overflow-hidden rounded-r-xl px-4 py-3"
            style={{
              background: `linear-gradient(90deg, ${accent.primary}, transparent)`,
              borderLeft: `6px solid ${accent.secondary}`,
            }}
          >
            {resolveMediaUrl(team.logo) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveMediaUrl(team.logo) ?? undefined}
                alt={team.name}
                className="h-12 w-12 drop-shadow"
              />
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white"
                style={{ backgroundColor: accent.primary }}
              >
                {initials(team.name)}
              </span>
            )}
            <div>
              <div className="text-[10px] font-black tracking-[0.35em] text-white/80 uppercase">
                {title}
              </div>
              <div className="text-2xl font-black leading-tight text-white uppercase md:text-3xl">
                {team.name}
              </div>
            </div>
          </div>

          {roster.length === 0 ? (
            <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              Lineup not set yet — check back before matchday.
            </div>
          ) : (
            <div className="space-y-1.5">
              {roster.map((row, i) => {
                const player = row.player!
                const photoUrl = resolveMediaUrl(player.photo)
                return (
                  <button
                    key={row.slot.slotId}
                    type="button"
                    onClick={() => onPlayer?.(player)}
                    className="flex w-full animate-in slide-in-from-left-1/2 items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-left backdrop-blur transition-colors hover:bg-muted"
                    style={{
                      animationDelay: `${0.25 + i * STEP}s`,
                      animationFillMode: "both",
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-base font-black text-white"
                      style={{
                        backgroundColor: accent.primary,
                        boxShadow: `0 0 14px ${accent.primary}66`,
                      }}
                    >
                      {player.jersey}
                    </span>
                    <Avatar size="sm" className="size-8 border border-border">
                      <AvatarImage src={photoUrl ?? undefined} alt="" />
                      <AvatarFallback>
                        <span className="font-display text-xs font-black">{player.jersey}</span>
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-display text-base font-bold tracking-wide text-foreground uppercase">
                      {player.name}
                    </span>
                    <span className="ml-auto text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                      {player.position}
                    </span>
                    <span className="rounded bg-rating px-1.5 py-0.5 font-display text-xs font-black text-black">
                      {player.rating}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Pitch column */}
        <div
          className="mx-auto h-full max-h-[52vh] w-full max-w-xs [direction:ltr] md:max-h-[70vh] md:max-w-sm"
          data-pitch
        >
          <PitchCanvas>
            {lineup.map((slot, i) => {
              const player = slot.playerId
                ? players.find((p) => p.id === slot.playerId) ?? null
                : null
              const rosterIdx = roster.findIndex(
                (row) => row.slot.slotId === slot.slotId
              )
              return (
                <MatchPitchPlayer
                  key={slot.slotId}
                  x={slot.x}
                  y={slot.y}
                  player={player}
                  team={team}
                  delay={0.25 + (rosterIdx >= 0 ? rosterIdx : i) * STEP}
                  onClick={() => player && onPlayer?.(player)}
                />
              )
            })}
          </PitchCanvas>
        </div>
      </div>

      {/* Lower third */}
      <div className="absolute right-0 bottom-0 left-0 flex animate-in slide-in-from-bottom-6 items-center gap-3 border-t bg-muted/80 px-5 py-2 backdrop-blur">
        <span
          className="rounded px-2 py-0.5 text-[10px] font-black tracking-[0.3em] text-black uppercase"
          style={{ backgroundColor: accent.primary }}
        >
          Starting Six
        </span>
        <span className="truncate text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {lowerThird || "Lineup not set yet"}
        </span>
      </div>
    </div>
  )
}
