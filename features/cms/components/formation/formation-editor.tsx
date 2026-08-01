"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Plus, Trash2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { PitchCanvas } from "@/features/cms/components/formation/pitch-canvas"
import { PitchPlayer } from "@/features/cms/components/formation/pitch-player"
import { PlayerPicker } from "@/features/cms/components/formation/player-picker"
import { PRESET_FORMATIONS } from "@/features/cms/components/formation/presets"
import { FORMATION_TYPE } from "@/generated/enums"
import type {
  Formation,
  FormationSlot,
  Player,
  Team,
} from "@/features/cms/types/cms-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"

type LoadState = "loading" | "ready" | "error"

interface FormationEditorProps {
  team: Team
  initialFormations: Formation[]
  roster: Player[]
  initialLoadState: LoadState
  loadError: string | null
  onReload: () => void
}

function blankFormation(name: string): Omit<Formation, "id" | "createdAt" | "updatedAt"> {
  return {
    teamId: 0,
    type: FORMATION_TYPE.PRESET,
    name,
    positions: PRESET_FORMATIONS[0].slots.map((slot) => ({
      ...slot,
      playerId: null,
    })),
  }
}

export function FormationEditor({
  team,
  initialFormations,
  roster,
  initialLoadState,
  loadError,
  onReload,
}: FormationEditorProps) {
  const { token } = useAuth()

  const [formations, setFormations] = useState<Formation[]>(initialFormations)
  const [loadState, setLoadState] = useState<LoadState>(initialLoadState)

  const [activeId, setActiveId] = useState<number | null>(null)
  const [slots, setSlots] = useState<FormationSlot[]>([])
  const [name, setName] = useState("")
  const [type, setType] = useState<FORMATION_TYPE>(FORMATION_TYPE.PRESET)
  const [dirty, setDirty] = useState(false)

  const [nameError, setNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [pickerSlot, setPickerSlot] = useState<string | null>(null)

  useEffect(() => {
    setFormations(initialFormations)
    setLoadState(initialLoadState)
  }, [initialFormations, initialLoadState])

  // Load the first formation into the editor once data is ready.
  useEffect(() => {
    if (loadState !== "ready") return
    if (formations.length === 0) {
      setSlots([])
      setActiveId(null)
      return
    }
    const active = formations.find((f) => f.id === activeId) ?? formations[0]
    setActiveId(active.id)
    setSlots(active.positions)
    setName(active.name)
    setType(active.type)
    setDirty(false)
  }, [loadState, formations]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const applyFormation = (presetName: string) => {
    const preset = PRESET_FORMATIONS.find((f) => f.name === presetName)
    if (!preset) return

    setSlots(preset.slots.map((slot) => ({ ...slot, playerId: null })))
    setName(preset.name)
    setType(FORMATION_TYPE.PRESET)
    setDirty(true)
  }

  const markCustom = () => {
    if (type !== FORMATION_TYPE.CUSTOM) {
      setType(FORMATION_TYPE.CUSTOM)
    }
    setDirty(true)
  }

  const moveSlot = (slotId: string, x: number, y: number) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.slotId === slotId ? { ...slot, x, y } : slot))
    )
    markCustom()
  }

  const setSlotPlayer = (slotId: string, playerId: number | null) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.slotId === slotId ? { ...slot, playerId } : slot))
    )
    markCustom()
    setPickerSlot(null)
  }

  const saveFormation = async () => {
    if (!name.trim()) {
      setNameError("Formation name is required")
      return
    }
    setSaving(true)
    setSaveError(null)

    const body = { name: name.trim(), type, positions: slots }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = activeId
        ? await fetch(`/api/cms/teams/${team.id}/formations/${activeId}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(body),
          })
        : await fetch(`/api/cms/teams/${team.id}/formations`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          })

      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save formation")
        setSaving(false)
        return
      }

      setFormations((prev) => {
        const exists = prev.some((f) => f.id === data.formation.id)
        return exists
          ? prev.map((f) => (f.id === data.formation.id ? data.formation : f))
          : [...prev, data.formation]
      })
      setActiveId(data.formation.id)
      setDirty(false)
      setSaving(false)
    } catch {
      setSaveError("Network error. Please try again.")
      setSaving(false)
    }
  }

  const deleteFormation = async () => {
    if (!activeId) return
    setSaving(true)
    setSaveError(null)

    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(
        `/api/cms/teams/${team.id}/formations/${activeId}`,
        { method: "DELETE", headers }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSaveError(data?.error ?? "Failed to delete formation")
        setSaving(false)
        return
      }

      setFormations((prev) => prev.filter((f) => f.id !== activeId))
      setActiveId(null)
      setSlots([])
      setDirty(false)
      setSaving(false)
    } catch {
      setSaveError("Network error. Please try again.")
      setSaving(false)
    }
  }

  const createNew = () => {
    const template = blankFormation("Custom Formation")
    setSlots(template.positions)
    setName(template.name)
    setType(FORMATION_TYPE.PRESET)
    setActiveId(null)
    setDirty(true)
    setNameError(null)
  }

  const selectFormation = (formation: Formation) => {
    setActiveId(formation.id)
    setSlots(formation.positions)
    setName(formation.name)
    setType(formation.type)
    setDirty(false)
  }

  if (loadState === "loading") {
    return (
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Skeleton className="aspect-[3/4] w-full max-w-md rounded-2xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button variant="outline" size="sm" onClick={onReload}>
          <Loader2 />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Pitch */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium">{name || "Untitled"}</span>
            {type === FORMATION_TYPE.CUSTOM && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Custom
              </span>
            )}
            {dirty && <span className="text-xs text-muted-foreground">Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={createNew}>
              <Plus />
              New
            </Button>
            {activeId && (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Delete formation"
                onClick={deleteFormation}
                disabled={saving}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </div>

        <div data-pitch className="mx-auto max-w-md">
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
                  onDragEnd={(x, y) => moveSlot(slot.slotId, x, y)}
                />
              )
            })}
          </PitchCanvas>
        </div>
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-6">
        {/* Presets */}
        <div>
          <div className="mb-2 text-xs font-black tracking-widest text-foreground uppercase">
            Preset formations
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_FORMATIONS.map((preset) => (
              <Button
                key={preset.name}
                size="sm"
                variant={name === preset.name && type === FORMATION_TYPE.PRESET ? "default" : "outline"}
                onClick={() => applyFormation(preset.name)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Saved formations */}
        <div>
          <div className="mb-2 text-xs font-black tracking-widest text-foreground uppercase">
            Saved formations
          </div>
          {formations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No saved formations yet. Pick a preset, arrange, and save.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {formations.map((formation) => (
                <li key={formation.id}>
                  <Button
                    size="sm"
                    variant={activeId === formation.id ? "default" : "ghost"}
                    className="w-full justify-between"
                    onClick={() => selectFormation(formation)}
                  >
                    <span className="truncate">{formation.name}</span>
                    {activeId === formation.id && <Check className="size-4" />}
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
              No players in the roster. Click a slot to bind players once added.
            </p>
          ) : (
            <div className="flex max-h-52 flex-col gap-1 overflow-y-auto">
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

        {/* Name + save */}
        <div className="flex flex-col gap-3">
          <Field>
            <FieldLabel>Formation name</FieldLabel>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(null)
                setDirty(true)
              }}
              placeholder="e.g. 2-2 Diamond"
              autoComplete="off"
            />
            <FieldError
              errors={nameError ? [{ message: nameError }] : []}
            />
          </Field>

          {saveError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {saveError}
            </div>
          )}

          <Button onClick={saveFormation} disabled={saving} className="w-full">
            {saving && <Loader2 className="animate-spin" />}
            Save formation
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
