"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import {
  playerSchema,
  type PlayerInput,
} from "@/features/cms/schemas/player-schema"
import { useUpload } from "@/features/cms/hooks/use-upload"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { PlayerPhotoUpload } from "@/features/cms/components/roster/player-photo-upload"
import { POSITION } from "@/generated/enums"
import type { Player } from "@/features/cms/types/cms-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

const POSITION_OPTIONS = [
  { value: POSITION.GOALKEEPER, label: "Goalkeeper" },
  { value: POSITION.DEFENDER, label: "Defender" },
  { value: POSITION.WINGER, label: "Winger" },
  { value: POSITION.PIVOT, label: "Pivot" },
]

interface PlayerFormProps {
  teamId: number
  /** Player being edited, or undefined when creating a new one. */
  player?: Player
  onSaved: (player: Player) => void
}

const AUTH_HEADERS = (token: string | null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export function PlayerForm({ teamId, player, onSaved }: PlayerFormProps) {
  const { token } = useAuth()
  const { upload } = useUpload()
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlayerInput>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player?.name ?? "",
      jersey: player?.jersey ?? 0,
      position: player?.position ?? POSITION.DEFENDER,
      photo: player?.photo ?? null,
      pace: player?.pace ?? 65,
      shooting: player?.shooting ?? 65,
      passing: player?.passing ?? 65,
      defending: player?.defending ?? 65,
    },
  })

  const selectedPosition = watch("position")

  const pace = watch("pace") ?? 0
  const shooting = watch("shooting") ?? 0
  const passing = watch("passing") ?? 0
  const defending = watch("defending") ?? 0
  const derivedRating = Math.max(
    1,
    Math.min(99, Math.round((pace + shooting + passing + defending) / 4))
  )

  async function upsertPlayer(
    body: PlayerInput,
    id?: number
  ): Promise<Player | null> {
    const res = await fetch(
      id
        ? `/api/cms/teams/${teamId}/players/${id}`
        : `/api/cms/teams/${teamId}/players`,
      {
        method: id ? "PATCH" : "POST",
        headers: AUTH_HEADERS(token),
        body: JSON.stringify(body),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      setSubmitError(data.error ?? "Failed to save player")
      return null
    }
    return data.player as Player
  }

  async function onSubmit(data: PlayerInput) {
    setSaving(true)
    setSubmitError(null)

    try {
      let savedPlayer: Player | null = player ?? null

      if (savedPlayer) {
        let photo = data.photo
        if (pendingPhoto) {
          const key = await upload(pendingPhoto, "players", savedPlayer.id)
          if (!key) {
            setSubmitError("Photo upload failed. Please try again.")
            setSaving(false)
            return
          }
          photo = key
        }
        savedPlayer = await upsertPlayer(
          {
            name: data.name,
            jersey: data.jersey,
            position: data.position,
            photo,
            pace: data.pace,
            shooting: data.shooting,
            passing: data.passing,
            defending: data.defending,
          },
          savedPlayer.id
        )
      } else {
        savedPlayer = await upsertPlayer({
          name: data.name,
          jersey: data.jersey,
          position: data.position,
          photo: null,
          pace: data.pace,
          shooting: data.shooting,
          passing: data.passing,
          defending: data.defending,
        })
        if (savedPlayer && pendingPhoto) {
          const key = await upload(pendingPhoto, "players", savedPlayer.id)
          if (key) {
            savedPlayer = await upsertPlayer(
              {
                name: savedPlayer.name,
                jersey: savedPlayer.jersey,
                position: savedPlayer.position,
                photo: key,
                pace: savedPlayer.pace,
                shooting: savedPlayer.shooting,
                passing: savedPlayer.passing,
                defending: savedPlayer.defending,
              },
              savedPlayer.id
            )
          }
        }
      }

      if (savedPlayer) onSaved(savedPlayer)
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const initials = (player?.name ?? "P")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {submitError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <Field>
        <FieldLabel>Photo</FieldLabel>
        <Controller
          control={control}
          name="photo"
          render={({ field }) => (
            <PlayerPhotoUpload
              value={field.value}
              pendingFile={pendingPhoto}
              onFileChange={setPendingPhoto}
              fallback={initials}
            />
          )}
        />
      </Field>

      <Field>
        <FieldLabel>Name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input {...field} placeholder="e.g. Alex Silva" autoComplete="off" />
          )}
        />
        <FieldError
          errors={errors.name ? [{ message: errors.name.message }] : []}
        />
      </Field>

      <Field>
        <FieldLabel>Jersey number</FieldLabel>
        <Controller
          control={control}
          name="jersey"
          render={({ field }) => (
            <Input
              {...field}
              type="number"
              min={1}
              max={99}
              placeholder="e.g. 10"
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? undefined : Number(e.target.value)
                )
              }
            />
          )}
        />
        <FieldError
          errors={errors.jersey ? [{ message: errors.jersey.message }] : []}
        />
      </Field>

      <Field>
        <FieldLabel>Position</FieldLabel>
        <Controller
          control={control}
          name="position"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {POSITION_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={selectedPosition === option.value ? "default" : "outline"}
                  className={cn(
                    selectedPosition === option.value &&
                      "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    field.onChange(option.value)
                    setValue("position", option.value)
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        />
        <FieldError
          errors={errors.position ? [{ message: errors.position.message }] : []}
        />
      </Field>

      <Field>
        <FieldLabel>Attributes</FieldLabel>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-rating px-1.5 py-0.5 font-display text-xs font-black text-black">
            {derivedRating}
          </span>
          <span className="text-xs text-muted-foreground">
            Rating is auto-calculated from the four attributes below.
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="pace"
            render={({ field }) => (
              <StatInput label="Pace" field={field} error={errors.pace} />
            )}
          />
          <Controller
            control={control}
            name="shooting"
            render={({ field }) => (
              <StatInput label="Shooting" field={field} error={errors.shooting} />
            )}
          />
          <Controller
            control={control}
            name="passing"
            render={({ field }) => (
              <StatInput label="Passing" field={field} error={errors.passing} />
            )}
          />
          <Controller
            control={control}
            name="defending"
            render={({ field }) => (
              <StatInput label="Defending" field={field} error={errors.defending} />
            )}
          />
        </div>
      </Field>

      <Button type="submit" disabled={saving} className="w-full">
        {saving && <Loader2 className="animate-spin" />}
        {player ? "Save changes" : "Add player"}
      </Button>
    </form>
  )
}

function StatInput({
  label,
  field,
  error,
}: {
  label: string
  field: { value: number | undefined; onChange: (value: number | undefined) => void }
  error?: { message?: string }
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        type="number"
        min={1}
        max={99}
        value={field.value}
        onChange={(e) =>
          field.onChange(
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
      />
      <FieldError errors={error ? [{ message: error.message ?? "" }] : []} />
    </div>
  )
}
