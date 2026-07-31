"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Pencil,
  Trash2,
  Users,
  LayoutTemplate,
  Loader2,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { resolveMediaUrl } from "@/lib/media"
import type { Team } from "@/features/cms/types/cms-types"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface TeamsListProps {
  teams: Team[]
  onEdit: (team: Team) => void
  onDeleted: (teamId: number) => void
}

export function TeamsList({ teams, onEdit, onDeleted }: TeamsListProps) {
  const { token } = useAuth()
  const [deleting, setDeleting] = useState<Team | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    setError(null)

    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/cms/teams/${deleting.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Failed to delete team")
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

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const logoUrl = resolveMediaUrl(team.logo)
          return (
            <Card key={team.id}>
              <CardHeader>
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`${team.name} logo`}
                    className="size-14 rounded-xl object-cover"
                  />
                )}
                <CardTitle className="truncate">{team.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" />
                    {team._count?.roster ?? 0} players
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutTemplate className="size-4" />
                    {team._count?.formations ?? 0} formations
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" render={<Link href={`/cms/teams/${team.id}`} />}>
                  Roster
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href={`/cms/teams/${team.id}/formations`} />
                  }
                >
                  Formations
                </Button>
                <div className="flex-1" />
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Edit team"
                  onClick={() => onEdit(team)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete team"
                  onClick={() => setDeleting(team)}
                >
                  <Trash2 />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleting?.name}"? This will
              permanently remove the team, its players, and its formations.
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
