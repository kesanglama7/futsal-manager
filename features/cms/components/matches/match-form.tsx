"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import {
  matchSchema,
  type MatchInput,
} from "@/features/cms/schemas/match-schema"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { MATCH_STATUS } from "@/generated/enums"
import type { Match, Team } from "@/features/cms/types/cms-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = [
  { value: MATCH_STATUS.SCHEDULED, label: "Scheduled" },
  { value: MATCH_STATUS.LIVE, label: "Live" },
  { value: MATCH_STATUS.FINISHED, label: "Finished" },
]

/** Format a Date for a `<input type="datetime-local">` value (local time). */
function toDateTimeLocal(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

interface MatchFormProps {
  /** Match being edited, or undefined when creating a new one. */
  match?: Match
  teams: Team[]
  onSaved: (match: Match) => void
}

export function MatchForm({ match, teams, onSaved }: MatchFormProps) {
  const { token } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MatchInput>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      homeTeamId: match?.homeTeamId ?? 0,
      awayTeamId: match?.awayTeamId ?? 0,
      scheduledAt: match ? toDateTimeLocal(match.scheduledAt) : "",
      venue: match?.venue ?? "",
      status: match?.status ?? MATCH_STATUS.SCHEDULED,
    },
  })

  async function onSubmit(data: MatchInput) {
    setSaving(true)
    setSubmitError(null)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(
        match ? `/api/cms/matches/${match.id}` : "/api/cms/matches",
        {
          method: match ? "PATCH" : "POST",
          headers,
          body: JSON.stringify(data),
        }
      )
      const responseData = await res.json()

      if (!res.ok) {
        setSubmitError(responseData.error ?? "Failed to save match")
        setSaving(false)
        return
      }

      onSaved(responseData.match as Match)
    } catch {
      setSubmitError("Network error. Please try again.")
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {submitError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Field>
        <FieldLabel>Home team</FieldLabel>
        <Controller
          control={control}
          name="homeTeamId"
          render={({ field }) => (
            <select
              {...field}
              disabled={!!match}
              value={field.value || ""}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={cn(
                "h-9 w-full rounded-3xl border-transparent bg-input/50 px-3 text-sm",
                "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <option value="" disabled>
                Select home team
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        />
        <FieldError
          errors={errors.homeTeamId ? [{ message: errors.homeTeamId.message }] : []}
        />
      </Field>

      <Field>
        <FieldLabel>Away team</FieldLabel>
        <Controller
          control={control}
          name="awayTeamId"
          render={({ field }) => (
            <select
              {...field}
              disabled={!!match}
              value={field.value || ""}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className={cn(
                "h-9 w-full rounded-3xl border-transparent bg-input/50 px-3 text-sm",
                "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <option value="" disabled>
                Select away team
              </option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          )}
        />
        <FieldError
          errors={errors.awayTeamId ? [{ message: errors.awayTeamId.message }] : []}
        />
      </Field>

      <Field>
        <FieldLabel>Scheduled date &amp; time</FieldLabel>
        <Controller
          control={control}
          name="scheduledAt"
          render={({ field }) => (
            <Input {...field} type="datetime-local" />
          )}
        />
        <FieldError
          errors={errors.scheduledAt ? [{ message: errors.scheduledAt.message }] : []}
        />
      </Field>

      <Field>
        <FieldLabel>Venue</FieldLabel>
        <Controller
          control={control}
          name="venue"
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="e.g. Arena Futsal Hall"
              autoComplete="off"
            />
          )}
        />
        <FieldError
          errors={errors.venue ? [{ message: errors.venue.message }] : []}
        />
      </Field>

      {match && (
        <Field>
          <FieldLabel>Status</FieldLabel>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={field.value === option.value ? "default" : "outline"}
                    onClick={() => field.onChange(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            )}
          />
        </Field>
      )}

      <Button type="submit" disabled={saving} className="w-full">
        {saving && <Loader2 className="animate-spin" />}
        {match ? "Save changes" : "Schedule match"}
      </Button>
    </form>
  )
}
