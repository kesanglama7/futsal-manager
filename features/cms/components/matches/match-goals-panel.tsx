"use client"

import { useEffect, useState } from "react"
import { Goal, Loader2, Trash2 } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { resolveMediaUrl } from "@/lib/media"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match, MatchEvent, Player, Team } from "@/features/cms/types/cms-types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

interface MatchGoalsPanelProps {
  match: Match
  events: MatchEvent[]
  onChanged: () => void
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function MatchGoalsPanel({ match, events, onChanged }: MatchGoalsPanelProps) {
  const { token } = useAuth()

  const [teamId, setTeamId] = useState<number>(match.homeTeamId)
  const [playerId, setPlayerId] = useState<number>(0)
  const [minute, setMinute] = useState<number>(1)
  const [roster, setRoster] = useState<Player[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const teams: Team[] = [match.homeTeam, match.awayTeam].filter(
    (t): t is Team => !!t
  )

  // Load the roster for the currently selected team (scorers must be on it).
  useEffect(() => {
    let cancelled = false

    async function load() {
      setRoster([])
      setPlayerId(0)
      try {
        const headers: Record<string, string> = {}
        if (token) headers.Authorization = `Bearer ${token}`

        const res = await fetch(`/api/cms/teams/${teamId}/players`, { headers })
        const data = await res.json()
        if (cancelled) return
        if (res.ok) setRoster(data.players as Player[])
      } catch {
        // Leave the scorer list empty; the select will be disabled.
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [teamId, token])

  async function addGoal() {
    if (!playerId) {
      setError("Select the goal scorer")
      return
    }
    setSaving(true)
    setError(null)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/cms/matches/${match.id}/events`, {
        method: "POST",
        headers,
        body: JSON.stringify({ teamId, minute, playerId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Failed to record goal")
        setSaving(false)
        return
      }

      setSaving(false)
      onChanged()
    } catch {
      setError("Network error. Please try again.")
      setSaving(false)
    }
  }

  async function deleteGoal(eventId: number) {
    setDeletingId(eventId)
    setError(null)

    try {
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`/api/cms/matches/${match.id}/events/${eventId}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Failed to delete goal")
        setDeletingId(null)
        return
      }

      setDeletingId(null)
      onChanged()
    } catch {
      setError("Network error. Please try again.")
      setDeletingId(null)
    }
  }

  const isLocked = match.status === MATCH_STATUS.SCHEDULED

  return (
    <div className="flex flex-col gap-4">
      {isLocked && (
        <p className="text-sm text-muted-foreground">
          Goals can be recorded once the match has started.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field>
          <FieldLabel>Team</FieldLabel>
          <select
            value={teamId}
            disabled={isLocked}
            onChange={(e) => setTeamId(Number(e.target.value))}
            className={cn(
              "h-9 w-full rounded-3xl border-transparent bg-input/50 px-3 text-sm",
              "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel>Scorer</FieldLabel>
          <select
            value={playerId}
            disabled={isLocked || roster.length === 0}
            onChange={(e) => setPlayerId(Number(e.target.value))}
            className={cn(
              "h-9 w-full rounded-3xl border-transparent bg-input/50 px-3 text-sm",
              "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            <option value={0} disabled>
              {roster.length === 0 ? "No players on roster" : "Select scorer"}
            </option>
            {roster.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.jersey} {player.name}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel>Minute</FieldLabel>
          <Input
            type="number"
            min={0}
            max={99}
            value={minute}
            disabled={isLocked}
            onChange={(e) =>
              setMinute(
                e.target.value === "" ? 0 : Math.max(0, Number(e.target.value))
              )
            }
          />
          <FieldError
            errors={Number.isNaN(minute) ? [{ message: "Enter a minute" }] : []}
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={addGoal} disabled={saving || isLocked} className="w-fit">
        {saving && <Loader2 className="animate-spin" />}
        <Goal />
        Record goal
      </Button>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals recorded yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const player = event.player
            const isHome = event.teamId === match.homeTeamId
            const team = isHome ? match.homeTeam : match.awayTeam
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 rounded-2xl border bg-card p-3"
              >
                <span className="w-10 shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
                  {event.minute}&#39;
                </span>
                <Avatar size="sm" className="size-8">
                  <AvatarImage
                    src={
                      player ? (resolveMediaUrl(player.photo) ?? undefined) : undefined
                    }
                    alt={player?.name ?? "Unknown"}
                  />
                  <AvatarFallback>
                    {player ? initials(player.name) : "—"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {player ? `#${player.jersey} ${player.name}` : "Unknown player"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {team?.name ?? "Unknown team"}
                    <span
                      className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        isHome
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isHome ? "Home" : "Away"}
                    </span>
                  </div>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete goal"
                  disabled={isLocked || deletingId === event.id}
                  onClick={() => deleteGoal(event.id)}
                >
                  {deletingId === event.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
