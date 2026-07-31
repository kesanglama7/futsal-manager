"use client"

import { useState } from "react"
import { Pencil, Trash2, Loader2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { resolveMediaUrl } from "@/lib/media"
import { POSITION } from "@/generated/enums"
import type { Player } from "@/features/cms/types/cms-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const POSITION_LABELS: Record<POSITION, string> = {
  [POSITION.GOALKEEPER]: "Goalkeeper",
  [POSITION.DEFENDER]: "Defender",
  [POSITION.WINGER]: "Winger",
  [POSITION.PIVOT]: "Pivot",
}

interface RosterListProps {
  players: Player[]
  onEdit: (player: Player) => void
  onDeleted: (playerId: number) => void
}

export function RosterList({ players, onEdit, onDeleted }: RosterListProps) {
  const { token } = useAuth()
  const [deleting, setDeleting] = useState<Player | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError(null)

    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(
        `/api/cms/teams/${deleting.teamId}/players/${deleting.id}`,
        { method: "DELETE", headers }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Failed to delete player")
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

  const initials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase()

  return (
    <>
      <ul className="flex flex-col gap-2">
        {players.map((player) => {
          const photoUrl = resolveMediaUrl(player.photo)
          return (
            <li
              key={player.id}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar size="lg" className="size-10">
                  <AvatarImage src={photoUrl ?? undefined} alt={player.name} />
                  <AvatarFallback>{initials(player.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    <span className="mr-1.5 text-muted-foreground">
                      #{player.jersey}
                    </span>
                    {player.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {POSITION_LABELS[player.position]}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit player"
                  onClick={() => onEdit(player)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete player"
                  onClick={() => setDeleting(player)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete player</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove #{deleting?.jersey}{" "}
              {deleting?.name} from the roster?
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
