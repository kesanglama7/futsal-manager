"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Shield, Loader2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { TeamsList } from "@/features/cms/components/teams/teams-list"
import { TeamForm } from "@/features/cms/components/teams/team-form"
import type { Team } from "@/features/cms/types/cms-types"
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

export default function TeamsPage() {
  const { token } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Team | undefined>(undefined)

  const loadTeams = useCallback(async () => {
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch("/api/cms/teams", { headers })
      const data = await res.json()

      if (!res.ok) {
        setLoadError(data.error ?? "Failed to load teams")
        setLoadState("error")
        return
      }

      setTeams(data.teams)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [token])

  useEffect(() => {
    if (token) loadTeams()
  }, [token, loadTeams])

  const handleSaved = (team: Team) => {
    setTeams((prev) => {
      const exists = prev.some((t) => t.id === team.id)
      if (exists) {
        return prev.map((t) => (t.id === team.id ? team : t))
      }
      return [...prev, team].sort((a, b) => a.name.localeCompare(b.name))
    })
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleDeleted = (teamId: number) => {
    setTeams((prev) => prev.filter((t) => t.id !== teamId))
  }

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (team: Team) => {
    setEditing(team)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">
            Team Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Create teams, manage rosters, and set up formations.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Add team
        </Button>
      </div>

      {loadState === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-4xl" />
          ))}
        </div>
      )}

      {loadState === "error" && (
        <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadTeams}>
            <Loader2 />
            Retry
          </Button>
        </div>
      )}

      {loadState === "ready" && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-4xl border border-dashed p-12 text-center">
          <Shield className="size-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No teams yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first team to start managing rosters and formations.
          </p>
          <Button onClick={openCreate} className="mt-2">
            <Plus />
            Add team
          </Button>
        </div>
      )}

      {loadState === "ready" && teams.length > 0 && (
        <TeamsList
          teams={teams}
          onEdit={openEdit}
          onDeleted={handleDeleted}
        />
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? "Edit team" : "Add team"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the team name or logo."
                : "Create a new team to manage its roster and formations."}
            </SheetDescription>
          </SheetHeader>
          <TeamForm team={editing} onSaved={handleSaved} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
