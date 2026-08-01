"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Plus,
  Users,
  LayoutTemplate,
  Loader2,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { RosterList } from "@/features/cms/components/roster/roster-list"
import { PlayerForm } from "@/features/cms/components/roster/player-form"
import { resolveMediaUrl } from "@/lib/media"
import type { Player, Team } from "@/features/cms/types/cms-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

type LoadState = "loading" | "ready" | "error"

export default function TeamRosterPage() {
  const params = useParams<{ teamId: string }>()
  const teamId = Number(params.teamId)
  const { token } = useAuth()

  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Player | undefined>(undefined)

  const loadRoster = useCallback(async () => {
    if (!Number.isInteger(teamId)) {
      setLoadError("Invalid team")
      setLoadState("error")
      return
    }
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const [teamRes, playersRes] = await Promise.all([
        fetch(`/api/cms/teams/${teamId}`, { headers }),
        fetch(`/api/cms/teams/${teamId}/players`, { headers }),
      ])

      const teamData = await teamRes.json()
      const playersData = await playersRes.json()

      if (!teamRes.ok || !playersRes.ok) {
        setLoadError(
          teamData.error ?? playersData.error ?? "Failed to load roster"
        )
        setLoadState("error")
        return
      }

      setTeam(teamData.team)
      setPlayers(playersData.players)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [teamId, token])

  useEffect(() => {
    if (token) loadRoster()
  }, [token, loadRoster])

  const handleSaved = (player: Player) => {
    setPlayers((prev) => {
      const exists = prev.some((p) => p.id === player.id)
      if (exists) {
        return prev
          .map((p) => (p.id === player.id ? player : p))
          .sort((a, b) => a.jersey - b.jersey)
      }
      return [...prev, player].sort((a, b) => a.jersey - b.jersey)
    })
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleDeleted = (playerId: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId))
  }

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (player: Player) => {
    setEditing(player)
    setFormOpen(true)
  }

  const logoUrl = team ? resolveMediaUrl(team.logo) : null
  const teamInitials = (team?.name ?? "T")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button size="sm" variant="ghost" render={<Link href="/cms/teams" />}>
          <ArrowLeft />
          Back to teams
        </Button>
      </div>

      {loadState === "loading" && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full max-w-sm rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      )}

      {loadState === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadRoster}>
            <Loader2 />
            Retry
          </Button>
        </div>
      )}

      {loadState === "ready" && team && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="size-14">
                <AvatarImage
                  src={logoUrl ?? undefined}
                  alt={`${team.name} logo`}
                />
                <AvatarFallback>{teamInitials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tight">
                  {team.name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" />
                    {players.length} players
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutTemplate className="size-4" />
                    {team._count?.formations ?? 0} formations
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                render={
                  <Link href={`/cms/teams/${team.id}/formations`} />
                }
              >
                <LayoutTemplate />
                Formations
              </Button>
              <Button onClick={openCreate}>
                <Plus />
                Add player
              </Button>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-4xl border border-dashed p-12 text-center">
              <Users className="size-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No players yet</h3>
              <p className="text-sm text-muted-foreground">
                Add players to build this team&apos;s roster.
              </p>
              <Button onClick={openCreate} className="mt-2">
                <Plus />
                Add player
              </Button>
            </div>
          ) : (
            <RosterList
              players={players}
              onEdit={openEdit}
              onDeleted={handleDeleted}
            />
          )}
        </>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editing ? "Edit player" : "Add player"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the player's details or photo."
                : "Add a player to this team's roster."}
            </SheetDescription>
          </SheetHeader>
          <PlayerForm teamId={teamId} player={editing} onSaved={handleSaved} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
