"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, LayoutTemplate } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { FormationEditor } from "@/features/cms/components/formation/formation-editor"
import { resolveMediaUrl } from "@/lib/media"
import type { Formation, Player, Team } from "@/features/cms/types/cms-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type LoadState = "loading" | "ready" | "error"

export default function TeamFormationsPage() {
  const params = useParams<{ teamId: string }>()
  const teamId = Number(params.teamId)
  const { token } = useAuth()

  const [team, setTeam] = useState<Team | null>(null)
  const [formations, setFormations] = useState<Formation[]>([])
  const [roster, setRoster] = useState<Player[]>([])
  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    if (!Number.isInteger(teamId)) {
      setLoadError("Invalid team")
      setLoadState("error")
      return
    }
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const [teamRes, formationsRes, playersRes] = await Promise.all([
        fetch(`/api/cms/teams/${teamId}`, { headers }),
        fetch(`/api/cms/teams/${teamId}/formations`, { headers }),
        fetch(`/api/cms/teams/${teamId}/players`, { headers }),
      ])

      const teamData = await teamRes.json()
      const formationsData = await formationsRes.json()
      const playersData = await playersRes.json()

      if (!teamRes.ok || !formationsRes.ok || !playersRes.ok) {
        setLoadError(
          teamData.error ??
            formationsData.error ??
            playersData.error ??
            "Failed to load formations"
        )
        setLoadState("error")
        return
      }

      setTeam(teamData.team)
      setFormations(formationsData.formations)
      setRoster(playersData.players)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [teamId, token])

  useEffect(() => {
    if (token) loadAll()
  }, [token, loadAll])

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button size="sm" variant="ghost" render={<Link href="/cms/teams" />}>
            <ArrowLeft />
            Back to teams
          </Button>
          <div className="mt-2 flex items-center gap-3">
            <Avatar size="lg" className="size-10">
              <AvatarImage src={logoUrl ?? undefined} alt={`${team?.name} logo`} />
              <AvatarFallback>{teamInitials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight">
                {team?.name ?? "Formations"}
              </h2>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <LayoutTemplate className="size-4" />
                Arrange your 5-a-side lineups on the pitch.
              </p>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" render={<Link href={`/cms/teams/${teamId}`} />}>
          Roster
        </Button>
      </div>

      <FormationEditor
        team={team ?? { id: teamId, name: "Team", logo: null } as Team}
        initialFormations={formations}
        roster={roster}
        initialLoadState={loadState}
        loadError={loadError}
        onReload={loadAll}
      />
    </div>
  )
}
