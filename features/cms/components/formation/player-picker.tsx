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

interface PlayerPickerProps {
  open: boolean
  roster: Player[]
  selectedPlayerId: number | null
  onSelect: (playerId: number | null) => void
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

export function PlayerPicker({
  open,
  roster,
  selectedPlayerId,
  onSelect,
  onClose,
}: PlayerPickerProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select player</DialogTitle>
          <DialogDescription>
            Choose who occupies this slot on the pitch.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-start"
            onClick={() => onSelect(null)}
          >
            Clear slot
          </Button>

          {roster.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No players in the roster yet. Add players to bind them to a slot.
            </p>
          )}

          {roster.map((player) => {
            const photoUrl = resolveMediaUrl(player.photo)
            const isSelected = player.id === selectedPlayerId
            return (
              <button
                key={player.id}
                type="button"
                onClick={() => onSelect(player.id)}
                className={
                  "flex items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted " +
                  (isSelected ? "bg-muted ring-1 ring-primary" : "")
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
                {isSelected && (
                  <span className="text-xs font-medium text-primary">
                    Selected
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
