"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import {
  teamSchema,
  type TeamInput,
} from "@/features/cms/schemas/team-schema"
import { useUpload } from "@/features/cms/hooks/use-upload"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { TeamLogoUpload } from "@/features/cms/components/teams/team-logo-upload"
import type { Team } from "@/features/cms/types/cms-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

interface TeamFormProps {
  /** Team being edited, or undefined when creating a new one. */
  team?: Team
  onSaved: (team: Team) => void
}

const AUTH_HEADERS = (token: string | null) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export function TeamForm({ team, onSaved }: TeamFormProps) {
  const { token } = useAuth()
  const { upload } = useUpload()
  const [pendingLogo, setPendingLogo] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: team?.name ?? "",
      logo: team?.logo ?? null,
    },
  })

  async function upsertTeam(
    body: TeamInput,
    id?: number
  ): Promise<Team | null> {
    const res = await fetch(id ? `/api/cms/teams/${id}` : "/api/cms/teams", {
      method: id ? "PATCH" : "POST",
      headers: AUTH_HEADERS(token),
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setSubmitError(data.error ?? "Failed to save team")
      return null
    }
    return data.team as Team
  }

  async function onSubmit(data: TeamInput) {
    setSaving(true)
    setSubmitError(null)

    try {
      let savedTeam: Team | null = team ?? null

      if (savedTeam) {
        // Editing: persist the logo key first, then PATCH the whole record.
        let logo = data.logo
        if (pendingLogo) {
          const key = await upload(pendingLogo, "logos", savedTeam.id)
          if (!key) {
            setSubmitError("Logo upload failed. Please try again.")
            setSaving(false)
            return
          }
          logo = key
        }
        savedTeam = await upsertTeam({ name: data.name, logo }, savedTeam.id)
      } else {
        // Creating: the team id doesn't exist yet, so create first, then
        // upload the logo (if any) against the real id and PATCH it back.
        savedTeam = await upsertTeam({ name: data.name, logo: null })
        if (savedTeam && pendingLogo) {
          const key = await upload(pendingLogo, "logos", savedTeam.id)
          if (key) {
            savedTeam = await upsertTeam({ name: savedTeam.name, logo: key }, savedTeam.id)
          }
        }
      }

      if (savedTeam) onSaved(savedTeam)
    } catch {
      setSubmitError("Network error. Please try again.")
    } finally {
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
        <FieldLabel>Team logo</FieldLabel>
        <Controller
          control={control}
          name="logo"
          render={({ field }) => (
            <TeamLogoUpload
              value={field.value}
              pendingFile={pendingLogo}
              onFileChange={setPendingLogo}
            />
          )}
        />
      </Field>

      <Field>
        <FieldLabel>Team name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              {...field}
              placeholder="e.g. FC Lightning"
              autoComplete="off"
            />
          )}
        />
        <FieldError
          errors={errors.name ? [{ message: errors.name.message }] : []}
        />
      </Field>

      <Button type="submit" disabled={saving} className="w-full">
        {saving && <Loader2 className="animate-spin" />}
        {team ? "Save changes" : "Create team"}
      </Button>
    </form>
  )
}
