"use client"

import { useEffect, useState } from "react"

import { resolveMediaUrl } from "@/lib/media"
import type {
  FormationSlot,
  MatchBenchSlot,
  Player,
  Team,
} from "@/features/cms/types/cms-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { PitchCanvas } from "@/features/cms/components/matches/pitch-canvas"
import { POSITION } from "@/generated/enums"
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

const GROUP_MS = 2200

interface MatchLineupRevealProps {
  team: Team
  lineup: FormationSlot[]
  bench?: MatchBenchSlot[]
  players: Player[]
  title: string
  reverse?: boolean
  onPlayer?: (player: Player) => void
}

/**
 * Light-theme port of animation/BroadcastLineup.tsx: World-Cup style "Team
 * Lineup" reveal — left rail with the team banner and a mini formation board,
 * right stage with player cutouts walking in (keeper alone, then trios), each
 * with a broadcast name plate underneath, and a lower-third strip. The bench
 * is revealed below the cutout stage after the starting seven. No
 * framer-motion — the walk-in and name-plate animations are CSS keyframes
 * (cutout-in / plate-in) with staggered delays.
 */
export function MatchLineupReveal({
  team,
  lineup,
  bench = [],
  players,
  title,
  reverse = false,
  onPlayer,
}: MatchLineupRevealProps) {
  const accent = teamAccent(team)

  // Full 7-man squad ordered by the 1-3-3 shape: GK, then 3 defenders, then
  // 3 attackers (wingers/pivot). Falls back to jersey order if a side is
  // missing players so the reveal still looks sensible. Each entry keeps its
  // stored slot coordinates so the mini-board can place dots at the real
  // formation positions instead of a fixed preset.
  const roster = lineup
    .map((slot) => ({
      slot,
      player: slot.playerId
        ? players.find((p) => p.id === slot.playerId) ?? null
        : null,
    }))
    .filter((row): row is { slot: FormationSlot; player: Player } => row.player !== null)
  const orderWeight = (position: POSITION): number => {
    switch (position) {
      case POSITION.GOALKEEPER:
        return 0
      case POSITION.DEFENDER:
        return 1
      case POSITION.WINGER:
      case POSITION.PIVOT:
        return 2
    }
  }
  const squad = roster
    .slice()
    .sort(
      (a, b) =>
        orderWeight(a.slot.position) - orderWeight(b.slot.position) ||
        a.player.jersey - b.player.jersey
    )
    .map((row) => ({ player: row.player, slot: row.slot }))

  const benchPlayers = bench
    .map((b) => players.find((p) => p.id === b.playerId) ?? null)
    .filter((p): p is Player => !!p)

  const squadPlayers = squad.map((row) => row.player)

  // Groups: keeper alone, defenders (3), attackers (3).
  const groups: Player[][] = [
    squadPlayers.slice(0, 1),
    squadPlayers.slice(1, 4),
    squadPlayers.slice(4, 7),
  ].filter((g) => g.length > 0)

  const [gi, setGi] = useState(0)
  useEffect(() => {
    setGi(0)
    const t = setInterval(() => setGi((i) => (i + 1 < groups.length ? i + 1 : i)), GROUP_MS)
    return () => clearInterval(t)
  }, [team.id, groups.length])

  const revealedCount = groups.slice(0, gi + 1).reduce((n, g) => n + g.length, 0)

  const photoUrl = resolveMediaUrl(team.logo)
  const lowerThird = squadPlayers.map((p) => `${p.jersey} ${p.name.split(" ").slice(-1)[0]}`).join("   ·   ")
  const benchThird = benchPlayers
    .map((p) => `${p.jersey} ${p.name.split(" ").slice(-1)[0]}`)
    .join("   ·   ")

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07070c]">
      {/* stadium ambience */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 100%, ${accent.primary}33, transparent 60%), radial-gradient(60% 60% at ${reverse ? "85%" : "15%"} 0%, ${accent.primary}22, transparent 70%)`,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(255,255,255,0.02)_3px_4px)]" />

      {/* Header strip */}
      <div className="absolute right-0 left-0 top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 pt-3 md:px-8 md:pt-4">
        <div
          className={cn(
            "animate-in slide-in-from-left-1/2 flex min-w-0 items-center gap-2 justify-self-start rounded-sm px-2.5 py-1.5 shadow-lg md:gap-3 md:px-4 md:py-2 duration-500",
            reverse && "md:justify-self-end md:order-2 md:flex-row-reverse"
          )}
          style={{ background: `linear-gradient(90deg, ${accent.primary}, ${accent.primary}bb)` }}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={team.name} className="h-5 w-5 shrink-0 drop-shadow md:h-7 md:w-7" />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/30 text-[10px] font-black text-white md:h-7 md:w-7 md:text-xs">
              {initials(team.name)}
            </span>
          )}
          <span className="truncate text-xs font-black tracking-[0.14em] text-white uppercase sm:text-base md:text-xl">
            {team.name}
          </span>
        </div>
        <div
          className={cn(
            "shrink-0 text-right animate-in slide-in-from-right-1/2 duration-500",
            reverse && "md:text-left md:order-1"
          )}
        >
          <div className="font-display text-sm font-black italic tracking-tight text-white uppercase sm:text-xl md:text-3xl">
            Team Lineup
          </div>
          <div className="truncate text-[8px] font-bold tracking-[0.3em] text-white/50 uppercase md:text-[10px]">
            {title}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "relative z-10 flex h-full items-stretch gap-3 px-2 pb-20 pt-16 sm:px-4 md:gap-8 md:px-8 md:pt-24",
          reverse && "flex-row-reverse"
        )}
      >
        {/* Mini formation board rail */}
        <div
          className="hidden w-[clamp(9rem,18vw,17rem)] shrink-0 self-center overflow-hidden rounded-sm shadow-2xl md:block lg:w-[clamp(11rem,16vw,18rem)] animate-in slide-in-from-left-1/2 duration-500"
          style={{ background: `linear-gradient(180deg, ${accent.primary}dd, ${accent.primary}88)` }}
        >
          <MiniBoard accent={accent} squad={squad} revealed={revealedCount} />
        </div>

        {/* Player cutout stage */}
        <div className="relative flex h-full min-w-0 flex-1 items-center justify-center px-1">
          <div key={gi} className="flex h-full w-full items-center justify-center gap-1.5 sm:gap-4 md:gap-8">
            {groups[gi]?.map((p, i) => (
              <Cutout
                key={p.id}
                player={p}
                accent={accent}
                index={i}
                single={groups[gi].length === 1}
                onClick={() => onPlayer?.(p)}
              />
            ))}
          </div>

          {/* light sweep on each group change */}
          <div
            key={`sweep-${gi}`}
            className="pointer-events-none absolute inset-y-0 w-1/3 skew-x-12 bg-white/15 blur-2xl animate-[sweep_0.9s_ease-out]"
            style={{ animationDirection: "normal" }}
          />
        </div>
      </div>

      {/* Bench rail */}
      {/* {benchPlayers.length > 0 && (
        <div
          className="absolute right-0 bottom-14 left-0 z-10 flex animate-in fade-in items-center gap-2 overflow-hidden px-3 py-1.5 md:px-8 duration-700"
          style={{ background: `linear-gradient(90deg, ${accent.primary}55, #00000066)` }}
        >
          <span className="shrink-0 rounded-sm bg-black/40 px-1.5 py-0.5 text-[8px] font-black tracking-[0.2em] text-white uppercase md:px-2 md:text-[10px] md:tracking-[0.3em]">
            Bench ({benchPlayers.length})
          </span>
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
            {benchPlayers.map((p) => {
              const benchPhoto = resolveMediaUrl(p.photo)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPlayer?.(p)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 transition-colors hover:bg-white/10"
                >
                  <Avatar className="size-5 border border-white/30">
                    <AvatarImage src={benchPhoto ?? undefined} alt={p.name} />
                    <AvatarFallback>
                      <span className="font-display text-[10px] font-black text-white">{p.jersey}</span>
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-[10px] font-bold tracking-widest text-white/85 uppercase">
                    {p.name.split(" ").slice(-1)[0]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )} */}

      {/* Lower third */}
      {/* <div
        className="absolute right-0 bottom-0 left-0 z-20 flex animate-in slide-in-from-bottom-6 flex-col gap-0.5 px-3 py-1.5 md:px-8 md:py-2"
        style={{ background: `linear-gradient(90deg, ${accent.primary}, #000000cc)` }}
      >
        <div className="flex items-center gap-2">
          <span className="shrink-0 rounded-sm bg-black/40 px-1.5 py-0.5 text-[8px] font-black tracking-[0.2em] text-white uppercase md:px-2 md:text-[10px] md:tracking-[0.3em]">
            1 GK + 6
          </span>
          <span className="min-w-0 truncate text-[10px] font-bold tracking-widest text-white/85 uppercase md:text-xs">
            {lowerThird || "Lineup not set yet"}
          </span>
        </div>
        {benchThird && (
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-sm bg-black/30 px-1.5 py-0.5 text-[8px] font-black tracking-[0.25em] text-white uppercase md:px-2 md:text-[9px]">
              Bench
            </span>
            <span className="min-w-0 truncate text-[9px] font-semibold tracking-widest text-white/70 uppercase md:text-[10px]">
              {benchThird}
            </span>
          </div>
        )}
      </div> */}
    </div>
  )
}

function Cutout({
  player,
  accent,
  index,
  single,
  onClick,
}: {
  player: Player
  accent: { primary: string; secondary: string }
  index: number
  single: boolean
  onClick: () => void
}) {
  const photoUrl = resolveMediaUrl(player.photo)
  const delay = 0.12 + index * 0.16

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center",
        single
          ? "max-w-[clamp(10rem,22vw,22rem)]"
          : "max-w-[clamp(6.5rem,15vw,15rem)]"
      )}
      style={{ animation: `cutout-in 0.6s ${delay}s cubic-bezier(0.34,1.56,0.64,1) both` }}
    >
      {/* spotlight */}
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 h-[70%] w-[130%] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accent.primary}66, transparent 70%)` }}
      />

      {/* cutout image — fixed-height, centered, scales with the viewport */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={player.name}
            className="mx-auto max-h-full w-auto max-w-full object-contain object-bottom drop-shadow-[0_18px_28px_rgba(0,0,0,0.75)]"
          />
        ) : (
          <div className="mx-auto flex h-3/4 w-3/4 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-b from-white/15 to-white/5">
            <span className="font-display text-4xl font-black text-white/70">
              {player.jersey}
            </span>
          </div>
        )}
      </div>

      {/* name plate */}
      <div
        className="mt-1.5 w-full max-w-[clamp(9rem,20vw,20rem)] origin-center overflow-hidden rounded-sm shadow-lg md:mt-2"
        style={{
          animation: `plate-in 0.35s ${0.35 + index * 0.16}s ease-out both`,
          background: `linear-gradient(90deg, ${accent.primary}, ${accent.secondary})`,
        }}
      >
        <div className="flex min-w-0 items-center justify-center gap-1 px-1 py-0.5 md:gap-2 md:px-2 md:py-1">
          <span className="shrink-0 rounded bg-black/40 px-1 text-[9px] font-black text-white md:text-xs">
            {player.jersey}
          </span>
          <span className="truncate text-[9px] font-black tracking-[0.12em] text-white uppercase sm:text-[11px] md:text-sm md:tracking-[0.18em]">
            {player.name.split(" ").slice(-1)[0]}
          </span>
          <span className="shrink-0 rounded bg-black/40 px-1 text-[9px] font-black text-white/80">
            {player.position}
          </span>
        </div>
      </div>
    </button>
  )
}

/** Fixed 1-3-3 broadcast positions on a 3:4 portrait pitch (percent coords).
 *  GK at the bottom, defenders in the middle band, wingers wide just above
 *  them, pivot at the top — matches the reference formation board. Values
 *  keep enough clearance from the edges that the number+name markers never
 *  clip against the pitch boundary or overlap each other.
 *  Squad order is GK, 3 defenders, 3 attackers, so index maps directly. */
const FIXED_133_POSITIONS: { x: number; y: number }[] = [
  { x: 50, y: 80 }, // GK
  { x: 31, y: 60 }, { x: 50, y: 53 }, { x: 69, y: 60 }, // defenders
  { x: 26, y: 37 }, { x: 74, y: 37 }, { x: 50, y: 24 }, // wingers + pivot
]

function MiniBoard({
  accent,
  squad,
  revealed,
}: {
  accent: { primary: string; secondary: string }
  squad: { player: Player; slot: FormationSlot }[]
  revealed: number
}) {
  return (
    <div className="p-3">
      <div className="mb-2 text-center text-[10px] font-black tracking-[0.3em] text-white/80 uppercase">
        Formation
      </div>
      <div
  className="relative aspect-[3/4] w-full overflow-hidden rounded-sm border border-white/25 shadow-lg [container-type:inline-size]"
>
  {/* Real pitch: green field with white lines, goals, penalty areas. */}
  <PitchCanvas>
    {squad.map((row, i) => {
      const p = row.player
      // Use the fixed 1-3-3 geometry so the board always reads clean,
      // regardless of the stored slot coords (which are editor
      // artifacts and can look scattered).
      const roleIndex = Math.min(i, FIXED_133_POSITIONS.length - 1)
      const pos = FIXED_133_POSITIONS[roleIndex]
      const on = i < revealed
      
      // FIX 1: Better last name logic. Drop the first name, keep the rest.
      // e.g., "Kevin De Bruyne" -> "De Bruyne"
      const nameParts = p.name.split(" ")
      const displayName = nameParts.length > 1 
        ? nameParts.slice(1).join(" ") 
        : p.name

      return (
        <div
          key={p.id}
          // Removed redundant Tailwind translates since it's handled in the style tag for the animation.
          // Added flex to keep horizontal centering stable.
          className="absolute flex flex-col items-center"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            opacity: on ? 1 : 0.5,
            transform: `translate(-50%, -50%) scale(${on ? 1.1 : 1})`,
            transition: "opacity 0.3s, transform 0.3s",
          }}
        >
          {/* Circular Marker */}
          <div
            className="flex aspect-square items-center justify-center rounded-full border-[0.5cqw] text-[4cqw] font-display font-black text-black"
            style={{
              width: "11cqw",
              backgroundColor: on ? "#ffffff" : "#ffffffb3",
              borderColor: on ? "#fff" : "#ffffff55",
              boxShadow: on ? "0 0 10px #fff" : "none",
            }}
          >
            {p.jersey}
          </div>
          
          {/* FIX 2: Absolutely positioned text so it doesn't skew the circle's vertical center */}
          <p
            className="absolute top-full mt-[0.8cqw] max-w-[24cqw] truncate text-[2.9cqw] font-bold leading-none tracking-wide text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
          >
            {displayName}
          </p>
        </div>
      )
    })}
  </PitchCanvas>
</div>
      <div className="mt-2 text-center text-[9px] font-black tracking-[0.25em] text-white/85 uppercase">
        1-3-3 · 1 GK · 3 Def · 3 Att
      </div>
    </div>
  )
}
