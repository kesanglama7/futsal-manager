"use client"

import { resolveMediaUrl } from "@/lib/media"
import type { Player, Team } from "@/features/cms/types/cms-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * Light-theme port of animation/PlayerCard.tsx. Shows the player's rating and
 * a PAC/SHO/PAS/DEF grid from the real stat fields.
 */
export function MatchPlayerCard({
  player,
  team,
  compact = false,
}: {
  player: Player
  team?: Team | null
  compact?: boolean
}) {
  const accent = teamAccent(team ?? { id: player.teamId, name: "" })
  const photoUrl = resolveMediaUrl(player.photo)

  return (
    <div
      className="animate-in zoom-in-95 relative w-64 overflow-hidden rounded-2xl border bg-card p-4 shadow-lg duration-300"
      style={{
        background: `linear-gradient(135deg, ${accent.primary}22, transparent 60%)`,
      }}
    >
      <div className="absolute top-2 right-2 rounded-md bg-rating px-2 py-0.5 font-display text-sm font-black text-black">
        {player.rating}
      </div>

      <div className="flex items-center gap-3">
        <Avatar size="lg" className="size-16 border-2" style={{ borderColor: accent.primary }}>
          <AvatarImage src={photoUrl ?? undefined} alt={player.name} />
          <AvatarFallback>
            <span className="font-display font-black">{player.jersey}</span>
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-display text-3xl font-black">#{player.jersey}</div>
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: accent.primary }}>
            {player.position}
          </div>
        </div>
      </div>

      <div className="mt-3 font-display text-lg font-bold tracking-wide uppercase">{player.name}</div>

      {!compact && (
        <div className="mt-3 grid grid-cols-4 gap-1 text-center text-xs font-bold">
          <Stat label="PAC" value={player.pace} />
          <Stat label="SHO" value={player.shooting} />
          <Stat label="PAS" value={player.passing} />
          <Stat label="DEF" value={player.defending} />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-muted py-1">
      <div className="text-primary">{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  )
}
