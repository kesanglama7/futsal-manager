"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

import { resolveMediaUrl } from "@/lib/media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PlayerPhotoUploadProps {
  /** Existing object key stored in the form (from a saved player). */
  value: string | null | undefined
  /** Newly selected file whose upload is deferred until the form submits. */
  pendingFile: File | null
  onFileChange: (file: File | null) => void
  /** Fallback initials shown when no photo exists yet. */
  fallback: string
}

export function PlayerPhotoUpload({
  value,
  pendingFile,
  onFileChange,
  fallback,
}: PlayerPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingFile) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(pendingFile)
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingFile])

  const preview = objectUrl ?? (value ? resolveMediaUrl(value) : null)

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative size-16 shrink-0 overflow-hidden rounded-full",
          preview ? "" : "border border-dashed border-muted-foreground/30"
        )}
      >
        <Avatar size="lg" className="size-full">
          <AvatarImage src={preview ?? undefined} alt="Player photo" />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {value || pendingFile ? "Change photo" : "Upload photo"}
          </Button>
          {(value || pendingFile) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onFileChange(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
            >
              <X />
              Remove
            </Button>
          )}
          <Input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (file) onFileChange(file)
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG or WebP up to 5MB
        </p>
      </div>
    </div>
  )
}
