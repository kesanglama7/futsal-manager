"use client"

import { useState } from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"

type UploadFolder = "logos" | "players"

/**
 * Uploads a file to /api/cms/upload (server proxy -> Supabase S3) and returns
 * the storage-agnostic object key for the caller to persist in the database.
 */
export function useUpload() {
  const { token } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(
    file: File,
    folder: UploadFolder,
    refId: number
  ): Promise<string | null> {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("folder", folder)
      formData.append("refId", String(refId))
      formData.append("file", file)

      const res = await fetch("/api/cms/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Upload failed")
        return null
      }

      return data.key as string
    } catch {
      setError("Network error. Please try again.")
      return null
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error, clearError: () => setError(null) }
}
