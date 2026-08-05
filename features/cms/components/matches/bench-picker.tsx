"use client"

import { resolveMediaUrl } from "@/lib/media"
import type { Player } from "@/features/cms/types/cms-types"
import { POSITION } from "@/generated/enums"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const POSITION_LABELS: Record<POSITION, string> = {
  [POSITION.GOALKEEPER]: "Goalkeeper",
  [POSITION.DEFENDER]: "Defender",
  [POSITION.WINGER]: "Winger",
  [POSITION.PIVOT]: "Pivot",
}

interface BenchPickerProps {
  open: boolean
  roster: Player[]
  /** Player ids already on the bench — these are marked and toggleable. */
  selectedPlayerIds: number[]
  /** Player ids already in the starting lineup — disabled. */
  excludedPlayerIds?: number[]
  onToggle: (playerId: number) => void
  onClose: () => void
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()

export function BenchPicker({
  open,
  roster,
  selectedPlayerIds,
  excludedPlayerIds = [],
  onToggle,
  onClose,
}: BenchPickerProps) {
  const selected = new Set(selectedPlayerIds)
  const excluded = new Set(excludedPlayerIds)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bench / substitutes</DialogTitle>
          <DialogDescription>
            Add the remaining squad players who will sit on the bench for this
            match. Starting players are unavailable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {roster.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No players in the roster yet.
            </p>
          )}

          {roster.map((player) => {
            const photoUrl = resolveMediaUrl(player.photo)
            const isOnBench = selected.has(player.id)
            const isExcluded = excluded.has(player.id)
            return (
              <button
                key={player.id}
                type="button"
                disabled={isExcluded}
                onClick={() => onToggle(player.id)}
                aria-disabled={isExcluded}
                aria-pressed={isOnBench}
                className={
                  "flex items-center gap-3 rounded-xl p-2 text-left transition " +
                  (isOnBench
                    ? "bg-muted ring-1 ring-primary"
                    : isExcluded
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-muted")
                }
              >
                <Avatar size="lg" className="size-10">
                  <AvatarImage src={photoUrl ?? undefined} alt={player.name} />
                  <AvatarFallback>{initials(player.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    <span className="mr-1.5 text-muted-foreground">
                      #{player.jersey}
                    </span>
                    {player.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {POSITION_LABELS[player.position]}
                  </div>
                </div>
                {isOnBench ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(player.id)
                    }}
                  >
                    Remove
                  </Button>
                ) : isExcluded ? (
                  <span className="text-xs text-muted-foreground">
                    In starting lineup
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggle(player.id)
                    }}
                  >
                    Add to bench
                  </Button>
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}