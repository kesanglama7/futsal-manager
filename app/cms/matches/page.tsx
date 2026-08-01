"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Plus, Loader2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { MatchesList } from "@/features/cms/components/matches/matches-list"
import { MatchForm } from "@/features/cms/components/matches/match-form"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match, Team } from "@/features/cms/types/cms-types"
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

const SECTION_ORDER = [MATCH_STATUS.LIVE, MATCH_STATUS.SCHEDULED, MATCH_STATUS.FINISHED]

const SECTION_TITLES: Record<MATCH_STATUS, string> = {
  [MATCH_STATUS.LIVE]: "Live",
  [MATCH_STATUS.SCHEDULED]: "Upcoming",
  [MATCH_STATUS.FINISHED]: "Finished",
}

export default function MatchesPage() {
  const { token } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Match | undefined>(undefined)

  const loadMatches = useCallback(async () => {
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const [matchesRes, teamsRes] = await Promise.all([
        fetch("/api/cms/matches", { headers }),
        fetch("/api/cms/teams", { headers }),
      ])
      const matchesData = await matchesRes.json()
      const teamsData = await teamsRes.json()

      if (!matchesRes.ok || !teamsRes.ok) {
        setLoadError(
          matchesData.error ?? teamsData.error ?? "Failed to load matches"
        )
        setLoadState("error")
        return
      }

      setMatches(matchesData.matches)
      setTeams(teamsData.teams)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [token])

  useEffect(() => {
    if (token) loadMatches()
  }, [token, loadMatches])

  const handleSaved = (match: Match) => {
    setMatches((prev) => {
      const exists = prev.some((m) => m.id === match.id)
      const next = exists
        ? prev.map((m) => (m.id === match.id ? match : m))
        : [...prev, match]
      return next.sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    })
    setFormOpen(false)
    setEditing(undefined)
  }

  const handleDeleted = (matchId: number) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId))
  }

  const openCreate = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  const openEdit = (match: Match) => {
    setEditing(match)
    setFormOpen(true)
  }

  const sections = SECTION_ORDER.map((status) => ({
    status,
    matches: matches.filter((m) => m.status === status),
  })).filter((section) => section.matches.length > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">
            Match Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Schedule matches, set up lineups, and record goals.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus />
          Schedule match
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
          <Button variant="outline" size="sm" onClick={loadMatches}>
            <Loader2 />
            Retry
          </Button>
        </div>
      )}

      {loadState === "ready" && matches.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-4xl border border-dashed p-12 text-center">
          <CalendarClock className="size-10 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No matches yet</h3>
          <p className="text-sm text-muted-foreground">
            Schedule your first match to start managing lineups and goals.
          </p>
          <Button onClick={openCreate} className="mt-2">
            <Plus />
            Schedule match
          </Button>
        </div>
      )}

      {loadState === "ready" && matches.length > 0 && (
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.status} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {SECTION_TITLES[section.status]} ({section.matches.length})
              </h3>
              <MatchesList
                matches={section.matches}
                onEdit={openEdit}
                onDeleted={handleDeleted}
              />
            </div>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? "Edit match" : "Schedule match"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the match details. Teams cannot be changed after creation."
                : "Pick two teams and set the date and venue."}
            </SheetDescription>
          </SheetHeader>
          <MatchForm match={editing} teams={teams} onSaved={handleSaved} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
