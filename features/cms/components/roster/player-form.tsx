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
    },
  })

  const selectedPosition = watch("position")

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
          { name: data.name, jersey: data.jersey, position: data.position, photo },
          savedPlayer.id
        )
      } else {
        savedPlayer = await upsertPlayer({
          name: data.name,
          jersey: data.jersey,
          position: data.position,
          photo: null,
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

      <Button type="submit" disabled={saving} className="w-full">
        {saving && <Loader2 className="animate-spin" />}
        {player ? "Save changes" : "Add player"}
      </Button>
    </form>
  )
}
