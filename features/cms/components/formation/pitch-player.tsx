"use client"

import { useDrag } from "@/features/cms/hooks/use-drag"
import type { Player } from "@/features/cms/types/cms-types"
import { cn } from "@/lib/utils"

interface PitchPlayerProps {
  x: number
  y: number
  player?: Player | null
  onClick?: () => void
  onDragEnd?: (x: number, y: number) => void
  size?: "sm" | "md"
}

/**
 * A single slot on the pitch. Draggable via native pointer events; clicking
 * opens the player picker. Bound players show their jersey number, empty
 * slots show a "+".
 *
 * Adapted from design/pitchCanvas.tsx PitchPlayer, restyled for the light
 * theme with one accent color (the Team model has no per-team color).
 */
export function PitchPlayer({
  x,
  y,
  player,
  onClick,
  onDragEnd,
  size = "md",
}: PitchPlayerProps) {
  const { dragging, didDrag, dragProps } = useDrag()

  const dim = size === "sm" ? "size-8" : "size-11"

  const handleClick = () => {
    if (didDrag()) return
    onClick?.()
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      {...dragProps}
      onPointerMove={(event) => {
        if (!onDragEnd) return
        dragProps.onPointerMove(event, onDragEnd)
      }}
      onClick={handleClick}
      title={player ? `#${player.jersey} ${player.name}` : "Empty slot"}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 font-bold text-white shadow-lg transition-transform",
          "hover:scale-110",
          dragging && "scale-110",
          player
            ? "border-green-900/60 bg-emerald-600"
            : "border-dashed border-white/80 bg-black/20",
          dim
        )}
        style={{
          fontSize: size === "sm" ? "0.6rem" : "0.8rem",
        }}
      >
        {player ? player.jersey : "+"}
      </div>
      {player && (
        <div className="pointer-events-none mt-0.5 text-center text-[10px] font-semibold whitespace-nowrap text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {player.name.split(" ").slice(-1)[0]}
        </div>
      )}
    </div>
  )
}
