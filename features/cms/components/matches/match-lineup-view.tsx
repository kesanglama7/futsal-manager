"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, Save } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { PitchCanvas } from "@/features/cms/components/matches/pitch-canvas"
import { PitchPlayer } from "@/features/cms/components/matches/pitch-player"
import { PlayerPicker } from "@/features/cms/components/matches/player-picker"
import { BenchPicker } from "@/features/cms/components/matches/bench-picker"
import { resolveMediaUrl } from "@/lib/media"
import { MATCH_SIDE, POSITION } from "@/generated/enums"
import {
  DEFAULT_FORMATION_SLOTS,
  DEFAULT_FORMATION,
} from "@/features/cms/lib/default-formation"
import type {
  Match,
  MatchTeam,
  Player,
  Team,
  FormationSlot,
  MatchBenchSlot,
} from "@/features/cms/types/cms-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type LoadState = "loading" | "ready" | "error"
type Side = "HOME" | "AWAY"

interface SideState {
  roster: Player[]
  slots: FormationSlot[]
  bench: MatchBenchSlot[]
}

interface MatchLineupViewProps {
  match: Match
  homeTeam: Team
  awayTeam: Team
  homeLineup?: MatchTeam
  awayLineup?: MatchTeam
  onSaved: () => void
}

const EMPTY_STATE: SideState = {
  roster: [],
  slots: [],
  bench: [],
}

function teamInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Rebuild a side's slots onto the fixed 1-3-3 geometry. Saved lineups (from a
 * now-removed formation system) carry their own slot coordinates, so we carry
 * over player bindings by position: the GK goes to the GK slot, DEFENDERs to
 * the three defence slots in order, WINGER/PIVOTs to the three attack slots.
 */
function hydrateSlots(saved?: FormationSlot[]): FormationSlot[] {
  if (!saved || saved.length === 0) return DEFAULT_FORMATION

  const take = (position: POSITION): number[] =>
    saved
      .filter((s) => s.playerId !== null && s.position === position)
      .map((s) => s.playerId as number)

  const gk = take(POSITION.GOALKEEPER)
  const defs = take(POSITION.DEFENDER)
  const atts = take(POSITION.WINGER).concat(take(POSITION.PIVOT))

  const used = new Set<number>()
  const next = (pool: number[]) => pool.find((pid) => !used.has(pid)) ?? null

  return DEFAULT_FORMATION_SLOTS.map((slot) => {
    let playerId: number | null = null
    if (slot.position === POSITION.GOALKEEPER) {
      playerId = next(gk)
    } else if (slot.position === POSITION.DEFENDER) {
      playerId = next(defs)
    } else {
      playerId = next(atts)
    }
    if (playerId !== null) used.add(playerId)
    return { ...slot, playerId }
  })
}

export function MatchLineupView({
  match,
  homeTeam,
  awayTeam,
  homeLineup,
  awayLineup,
  onSaved,
}: MatchLineupViewProps) {
  const { token } = useAuth()

  const [loadState, setLoadState] = useState<LoadState>("loading")
  const [loadError, setLoadError] = useState<string | null>(null)

  const [home, setHome] = useState<SideState>(EMPTY_STATE)
  const [away, setAway] = useState<SideState>(EMPTY_STATE)

  const [dirty, setDirty] = useState<Record<Side, boolean>>({
    HOME: false,
    AWAY: false,
  })
  const [saving, setSaving] = useState<Side | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<Side | null>(null)

  const [pickerSide, setPickerSide] = useState<Side | null>(null)
  const [pickerSlot, setPickerSlot] = useState<string | null>(null)
  const [benchSide, setBenchSide] = useState<Side | null>(null)
  const [benchOpen, setBenchOpen] = useState(false)

  // Reflect saved lineups back into local state (mapped onto 1-3-3) when the
  // match reloads.
  useEffect(() => {
    setHome((prev) => ({
      ...prev,
      slots: hydrateSlots(homeLineup?.positions),
      bench: homeLineup?.bench ?? [],
    }))
    setAway((prev) => ({
      ...prev,
      slots: hydrateSlots(awayLineup?.positions),
      bench: awayLineup?.bench ?? [],
    }))
    setDirty({ HOME: false, AWAY: false })
    setSaveSuccess(null)
    setSaveError(null)
  }, [homeLineup, awayLineup])

  const load = useCallback(async () => {
    setLoadState("loading")
    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const loadSide = async (team: Team) => {
        const rosterRes = await fetch(`/api/cms/teams/${team.id}/players`, {
          headers,
        })
        const rosterData = await rosterRes.json()
        if (!rosterRes.ok) {
          throw new Error(rosterData.error ?? "Failed to load team data")
        }
        return {
          roster: rosterData.players as Player[],
        }
      }

      const [homeData, awayData] = await Promise.all([
        loadSide(homeTeam),
        loadSide(awayTeam),
      ])

      setHome((prev) => ({ ...prev, ...homeData }))
      setAway((prev) => ({ ...prev, ...awayData }))
      setLoadState("ready")
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Network error. Please try again."
      )
      setLoadState("error")
    }
  }, [token, homeTeam, awayTeam])

  useEffect(() => {
    load()
  }, [load])

  const playersBySlot = useCallback(
    (roster: Player[], slots: FormationSlot[]) => {
      const map = new Map<string, Player | null>()
      for (const slot of slots) {
        map.set(
          slot.slotId,
          roster.find((p) => p.id === slot.playerId) ?? null
        )
      }
      return map
    },
    []
  )

  const homePlayersBySlot = useMemo(
    () => playersBySlot(home.roster, home.slots),
    [playersBySlot, home.roster, home.slots]
  )
  const awayPlayersBySlot = useMemo(
    () => playersBySlot(away.roster, away.slots),
    [playersBySlot, away.roster, away.slots]
  )

  const patchSide = (side: Side, updater: (prev: SideState) => SideState) => {
    const setter = side === MATCH_SIDE.HOME ? setHome : setAway
    setter((prev) => updater(prev))
    setDirty((prev) => ({ ...prev, [side]: true }))
    setSaveSuccess(null)
    setSaveError(null)
  }

  const setSlotPlayer = (
    side: Side,
    slotId: string,
    playerId: number | null
  ) => {
    patchSide(side, (prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.slotId === slotId ? { ...slot, playerId } : slot
      ),
    }))
    setPickerSlot(null)
    setPickerSide(null)
  }

  const toggleBenchPlayer = (side: Side, playerId: number) => {
    patchSide(side, (prev) => ({
      ...prev,
      bench: prev.bench.some((b) => b.playerId === playerId)
        ? prev.bench.filter((b) => b.playerId !== playerId)
        : [...prev.bench, { playerId }],
    }))
  }

  const removeBenchPlayer = (side: Side, playerId: number) => {
    patchSide(side, (prev) => ({
      ...prev,
      bench: prev.bench.filter((b) => b.playerId !== playerId),
    }))
  }

  const clearLineup = (side: Side) => {
    patchSide(side, (prev) => ({
      ...prev,
      slots: [],
      bench: [],
    }))
  }

  async function saveSide(side: Side) {
    setSaving(side)
    setSaveError(null)
    setSaveSuccess(null)

    const state = side === MATCH_SIDE.HOME ? home : away

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
          body: JSON.stringify({
            positions: state.slots,
            bench: state.bench,
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setSaveError(data.error ?? "Failed to save lineup")
        setSaving(null)
        return
      }

      setDirty((prev) => ({ ...prev, [side]: false }))
      setSaveSuccess(side)
      setSaving(null)
      onSaved()
    } catch {
      setSaveError("Network error. Please try again.")
      setSaving(null)
    }
  }

  const openPicker = (side: Side, slotId: string) => {
    setPickerSide(side)
    setPickerSlot(slotId)
  }

  const openBench = (side: Side) => {
    setBenchSide(side)
    setBenchOpen(true)
  }

  if (loadState === "loading") {
    return (
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
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

  const pickerState = pickerSide
    ? pickerSide === MATCH_SIDE.HOME
      ? home
      : away
    : null
  const benchState = benchSide
    ? benchSide === MATCH_SIDE.HOME
      ? home
      : away
    : null

  const renderSidePanel = (side: Side, team: Team, state: SideState) => {
    const isHome = side === MATCH_SIDE.HOME
    const sideDirty = dirty[side]
    const starters = state.slots.filter((s) => s.playerId !== null).length
    const savingThis = saving === side
    const saved = saveSuccess === side

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="size-10">
            <AvatarImage
              src={resolveMediaUrl(team.logo) ?? undefined}
              alt={`${team.name} logo`}
            />
            <AvatarFallback>{teamInitials(team.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase",
                  isHome
                    ? "bg-emerald-500/15 text-emerald-600"
                    : "bg-sky-500/15 text-sky-600"
                )}
              >
                {isHome ? "Home" : "Away"}
              </span>
              {sideDirty && (
                <span className="text-xs text-muted-foreground">Unsaved</span>
              )}
            </div>
            <div className="truncate text-sm font-semibold">{team.name}</div>
          </div>
        </div>

        {/* Formation */}
        <div>
          <div className="mb-2 text-[11px] font-black tracking-widest text-foreground uppercase">
            Formation
          </div>
          <p className="text-sm font-semibold">1-3-3</p>
          <p className="text-xs text-muted-foreground">
            1 GK · 3 defenders · 3 attack — every team uses this fixed shape.
          </p>
        </div>

        {/* Counts */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-black",
              isHome
                ? "bg-emerald-500/15 text-emerald-600"
                : "bg-sky-500/15 text-sky-600"
            )}
          >
            {starters}/7 starters
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-black text-muted-foreground">
            {state.bench.length} bench
          </span>
        </div>

        {/* Bench */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-foreground uppercase">
              Bench
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openBench(side)}
            >
              Manage bench
            </Button>
          </div>
          {state.bench.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No substitutes yet.
            </p>
          ) : (
            <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
              {state.bench.map((b) => {
                const player = state.roster.find((p) => p.id === b.playerId)
                if (!player) return null
                return (
                  <li
                    key={b.playerId}
                    className="flex items-center justify-between rounded-lg border px-2 py-1 text-sm"
                  >
                    <span className="truncate">
                      <span className="text-muted-foreground">
                        #{player.jersey}
                      </span>{" "}
                      {player.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBenchPlayer(side, player.id)}
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => saveSide(side)}
            disabled={saving !== null}
            className="w-full"
          >
            {savingThis && <Loader2 className="animate-spin" />}
            <Save />
            Save {isHome ? "home" : "away"} lineup
          </Button>
          <Button
            variant="outline"
            onClick={() => clearLineup(side)}
            disabled={saving !== null || state.slots.length === 0}
            className="w-full"
          >
            Clear lineup
          </Button>
        </div>
        {saved && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            Lineup saved.
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {saveError && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)]">
        {/* Team A panel (LEFT) */}
        <div className="order-2 lg:order-1">
          {renderSidePanel(MATCH_SIDE.HOME, homeTeam, home)}
        </div>

        {/* Single central pitch (CENTER) */}
        <div className="order-1 mx-auto w-full max-w-md lg:order-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Team A</span>
            <span className="text-sm font-medium">Team B</span>
          </div>
          {/* Each team's formation is stored across the full 0-100 field but
              must stay inside its own half. Top half is Team A (own goal at
              the top boundary), bottom half is Team B (own goal at the
              bottom boundary). Compress accordingly:
                Team A: y' = 50 - y/2   (GK ~top, pivot ~center)
                Team B: y' = 50 + y/2   (GK ~bottom, pivot ~center)
              Markers are small so a full 7-player formation fits a half. */}
          <PitchCanvas>
            {home.slots.map((slot) => {
              const player = homePlayersBySlot.get(slot.slotId) ?? null
              return (
                <PitchPlayer
                  key={`home-${slot.slotId}`}
                  x={slot.x}
                  y={50 - slot.y / 2}
                  player={player}
                  tone="home"
                  size="sm"
                  onClick={() => openPicker(MATCH_SIDE.HOME, slot.slotId)}
                />
              )
            })}
            {away.slots.map((slot) => {
              const player = awayPlayersBySlot.get(slot.slotId) ?? null
              return (
                <PitchPlayer
                  key={`away-${slot.slotId}`}
                  x={slot.x}
                  y={50 + slot.y / 2}
                  player={player}
                  tone="away"
                  size="sm"
                  onClick={() => openPicker(MATCH_SIDE.AWAY, slot.slotId)}
                />
              )
            })}
          </PitchCanvas>
        </div>

        {/* Team B panel (RIGHT) */}
        <div className="order-3">
          {renderSidePanel(MATCH_SIDE.AWAY, awayTeam, away)}
        </div>
      </div>

      <PlayerPicker
        open={!!pickerSlot && !!pickerState}
        roster={pickerState?.roster ?? []}
        selectedPlayerId={
          pickerSlot && pickerState
            ? (pickerState.slots.find((s) => s.slotId === pickerSlot)?.playerId ??
              null)
            : null
        }
        excludedPlayerIds={
          pickerState
            ? pickerState.slots
                .filter((s) => s.slotId !== pickerSlot && s.playerId !== null)
                .map((s) => s.playerId as number)
            : []
        }
        onSelect={(playerId) =>
          pickerSlot && pickerSide && setSlotPlayer(pickerSide, pickerSlot, playerId)
        }
        onClose={() => {
          setPickerSlot(null)
          setPickerSide(null)
        }}
      />

      <BenchPicker
        open={benchOpen && !!benchState}
        roster={benchState?.roster ?? []}
        selectedPlayerIds={benchState?.bench.map((b) => b.playerId) ?? []}
        excludedPlayerIds={
          benchState
            ? benchState.slots
                .filter((s) => s.playerId !== null)
                .map((s) => s.playerId as number)
            : []
        }
        onToggle={(playerId) =>
          benchSide && toggleBenchPlayer(benchSide, playerId)
        }
        onClose={() => {
          setBenchOpen(false)
          setBenchSide(null)
        }}
      />
    </div>
  )
}
