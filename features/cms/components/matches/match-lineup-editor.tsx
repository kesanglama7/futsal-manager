"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, Loader2, Save } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { PitchCanvas } from "@/features/cms/components/formation/pitch-canvas"
import { PitchPlayer } from "@/features/cms/components/formation/pitch-player"
import { PlayerPicker } from "@/features/cms/components/formation/player-picker"
import { MATCH_SIDE } from "@/generated/enums"
import type {
  Formation,
  Match,
  MatchTeam,
  Player,
  Team,
  FormationSlot,
} from "@/features/cms/types/cms-types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type LoadState = "loading" | "ready" | "error"

interface MatchLineupEditorProps {
  match: Match
  side: "HOME" | "AWAY"
  team: Team
  /** The lineup snapshot for this side, if one exists. */
  lineup: MatchTeam | undefined
  onSaved: () => void
}

export function MatchLineupEditor({
  match,
  side,
  team,
  lineup,
  onSaved,
}: MatchLineupEditorProps) {
  const { token } = useAuth()

  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formations, setFormations] = useState<Formation[]>([])
  const [roster, setRoster] = useState<Player[]>([])

  const [formationId, setFormationId] = useState<number | null>(null)
  const [slots, setSlots] = useState<FormationSlot[]>([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  useEffect(() => {
    setFormationId(lineup?.formationId ?? null)
    setSlots(lineup?.positions ?? [])
    setDirty(false)
  }, [lineup])

  const load = useCallback(async () => {
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const [formationsRes, rosterRes] = await Promise.all([
        fetch(`/api/cms/teams/${team.id}/formations`, { headers }),
        fetch(`/api/cms/teams/${team.id}/players`, { headers }),
      ])
      const formationsData = await formationsRes.json()
      const rosterData = await rosterRes.json()

      if (!formationsRes.ok || !rosterRes.ok) {
        setLoadError(
          formationsData.error ?? rosterData.error ?? "Failed to load team data"
        )
        setLoadState("error")
        return
      }

      setFormations(formationsData.formations)
      setRoster(rosterData.players)
      setLoadState("ready")
    } catch {
      setLoadError("Network error. Please try again.")
      setLoadState("error")
    }
  }, [team.id, token])

  useEffect(() => {
    load()
  }, [load])

  const playersBySlot = useMemo(() => {
    const map = new Map<string, Player | null>()
    for (const slot of slots) {
      map.set(
        slot.slotId,
        roster.find((p) => p.id === slot.playerId) ?? null
      )
    }
    return map
  }, [slots, roster])

  const selectFormation = (formation: Formation) => {
    setFormationId(formation.id)
    // Snapshot the formation geometry; player bindings start empty.
    setSlots(formation.positions.map((slot) => ({ ...slot, playerId: null })))
    setDirty(true)
    setSaveSuccess(false)
    setSaveError(null)
  }

  const setSlotPlayer = (slotId: string, playerId: number | null) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.slotId === slotId ? { ...slot, playerId } : slot
      )
    )
    setDirty(true)
    setSaveSuccess(false)
    setPickerSlot(null)
  }

  const clearLineup = () => {
    setFormationId(null)
    setSlots([])
    setDirty(true)
    setSaveSuccess(false)
    setSaveError(null)
  }

  async function saveLineup() {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(
        `/api/cms/matches/${match.id}/lineups/${side}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ formationId, positions: slots }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save lineup")
        setSaving(false)
        return
      }

      setDirty(false)
      setSaveSuccess(true)
      setSaving(false)
      onSaved()
    } catch {
      setSaveError("Network error. Please try again.")
      setSaving(false)
    }
  }

  const isHome = side === MATCH_SIDE.HOME

  if (loadState === "loading") {
    return (
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Skeleton className="aspect-[3/4] w-full max-w-md rounded-2xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <Loader2 />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Pitch */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">
            {team.name}
            {dirty && <span className="ml-2 text-xs text-muted-foreground">Unsaved</span>}
          </span>
          {lineup && (
            <span className="text-xs text-muted-foreground">
              {lineup.positions.filter((s) => s.playerId !== null).length}/
              {lineup.positions.length} players bound
            </span>
          )}
        </div>

        <div className="mx-auto max-w-md">
          <PitchCanvas>
            {slots.map((slot) => {
              const player = playersBySlot.get(slot.slotId) ?? null
              return (
                <PitchPlayer
                  key={slot.slotId}
                  x={slot.x}
                  y={slot.y}
                  player={player}
                  onClick={() => setPickerSlot(slot.slotId)}
                />
              )
            })}
          </PitchCanvas>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-2 text-xs font-black tracking-widest text-foreground uppercase">
            Formation
          </div>
          {formations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved formations for this team yet. Create one under Team
              Management.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {formations.map((formation) => (
                <li key={formation.id}>
                  <Button
                    size="sm"
                    variant={formationId === formation.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => selectFormation(formation)}
                  >
                    <span className="truncate">{formation.name}</span>
                    {formationId === formation.id && <Check className="size-4" />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Roster */}
        <div>
          <div className="mb-2 text-xs font-black tracking-widest text-foreground uppercase">
            Roster ({roster.length})
          </div>
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No players in the roster yet. Click a slot to bind players once
              added.
            </p>
          ) : (
            <div className="flex max-h-44 flex-col gap-1 overflow-y-auto">
              {roster.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-lg border px-2 py-1 text-sm"
                >
                  <span className="truncate">
                    <span className="text-muted-foreground">#{player.jersey}</span>{" "}
                    {player.name}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {player.position.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {saveError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              Lineup saved.
            </div>
          )}

          <Button onClick={saveLineup} disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" />}
            <Save />
            Save {isHome ? "home" : "away"} lineup
          </Button>
          <Button
            variant="outline"
            onClick={clearLineup}
            disabled={saving || (!formationId && slots.length === 0)}
            className="w-full"
          >
            Clear lineup
          </Button>
        </div>
      </div>

      <PlayerPicker
        open={!!pickerSlot}
        roster={roster}
        selectedPlayerId={
          pickerSlot
            ? (slots.find((s) => s.slotId === pickerSlot)?.playerId ?? null)
            : null
        }
        excludedPlayerIds={slots
          .filter((s) => s.slotId !== pickerSlot && s.playerId !== null)
          .map((s) => s.playerId as number)}
        onSelect={(playerId) => pickerSlot && setSlotPlayer(pickerSlot, playerId)}
        onClose={() => setPickerSlot(null)}
      />
    </div>
  )
}
