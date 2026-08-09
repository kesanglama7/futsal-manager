"use client"

import { resolveMediaUrl } from "@/lib/media"
import type { Player, Team } from "@/features/cms/types/cms-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { cn } from "@/lib/utils"

/**
 * Light-theme port of the animated PitchPlayer marker (no drag). Absolutely
 * positioned at percentage x/y; pops in with a zoom when given a delay.
 */
export function MatchPitchPlayer({
  x,
  y,
  player,
  team,
  delay = 0,
  size = "md",
  onClick,
}: {
  x: number
  y: number
  player?: Player | null
  team: Team
  delay?: number
  size?: "sm" | "md" | "lg"
  onClick?: () => void
}) {
  const accent = teamAccent(team)
  // Fluid marker sizing: the marker scales with the viewport/field instead of
  // staying a fixed px circle. Kept per-tier so call sites keep control of the
  // relative size while the absolute size adapts to the screen.
  const circleSize =
    size === "sm"
      ? "w-[clamp(1.75rem,3.5vw,2.5rem)] aspect-square"
      : size === "lg"
        ? "w-[clamp(3rem,6vw,4.5rem)] aspect-square"
        : "w-[clamp(2.25rem,4.5vw,3.25rem)] aspect-square"
  const textSize =
    size === "sm"
      ? "text-[clamp(0.55rem,1.2vw,0.8rem)]"
      : size === "lg"
        ? "text-[clamp(1rem,2.2vw,1.4rem)]"
        : "text-[clamp(0.7rem,1.5vw,1rem)]"
  const photoUrl = player ? resolveMediaUrl(player.photo) : null

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      title={player ? `#${player.jersey} ${player.name}` : "Empty slot"}
    >
      <div
        className={cn(
          "flex animate-in zoom-in-0 items-center justify-center overflow-hidden rounded-full border-2 font-bold text-white shadow-lg",
          "hover:scale-110",
          circleSize,
          textSize
        )}
        style={{
          backgroundColor: accent.primary,
          borderColor: accent.secondary,
          boxShadow: `0 0 20px ${accent.primary}80`,
          animationDelay: delay ? `${delay}s` : undefined,
          animationFillMode: "both",
        }}
      >
        {player && photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={player.name}
            className="size-full object-cover"
          />
        ) : (
          <span className={cn("font-display font-bold", textSize)}>{player ? player.jersey : "+"}</span>
        )}
      </div>
      {player && (
        <div className="pointer-events-none mt-0.5 text-center text-[clamp(0.55rem,1.1vw,0.8rem)] font-semibold whitespace-nowrap text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {player.name.split(" ").slice(-1)[0]}
        </div>
      )}
    </div>
  )
}
