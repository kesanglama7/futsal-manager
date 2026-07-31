"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, X } from "lucide-react"

import { resolveMediaUrl } from "@/lib/media"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TeamLogoUploadProps {
  /** Existing object key stored in the form (from a saved team). */
  value: string | null | undefined
  /** Newly selected file whose upload is deferred until the form submits. */
  pendingFile: File | null
  onFileChange: (file: File | null) => void
}

export function TeamLogoUpload({
  value,
  pendingFile,
  onFileChange,
}: TeamLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  // Keep a local object URL for the pending file preview, cleaned up on change.
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
          "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed",
          preview ? "border-border" : "border-muted-foreground/30"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Team logo"
            className="size-full object-cover"
          />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {value || pendingFile ? "Change logo" : "Upload logo"}
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
              if (!file) return
              onFileChange(file)
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
