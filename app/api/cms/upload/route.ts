import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-guard"
import {
  playerPhotoKey,
  sanitizeExtension,
  teamLogoKey,
  uploadObject,
} from "@/lib/storage"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
])

const ALLOWED_FOLDERS = new Set(["logos", "players"])

/**
 * Generic media upload. The client POSTs multipart/form-data with a `folder`
 * ("logos" | "players"), a `refId` (the owning team/player id, embedded in the
 * object key), and the `file`. Returns the storage-agnostic object key, which
 * the client stores in the database and renders via resolveMediaUrl.
 *
 * The object key is always built server-side from an allowlisted folder +
 * refId + sanitized extension — a client-supplied path is never trusted.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const formData = await request.formData()

    const folder = formData.get("folder")
    const refId = Number(formData.get("refId"))
    const file = formData.get("file")

    if (typeof folder !== "string" || !ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { error: "Invalid upload folder" },
        { status: 400 }
      )
    }

    if (!Number.isInteger(refId) || refId <= 0) {
      return NextResponse.json({ error: "Invalid reference id" }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PNG, JPEG, WebP, AVIF and GIF images are allowed" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File must be 5MB or smaller" },
        { status: 400 }
      )
    }

    const ext = sanitizeExtension(file.name)
    if (!ext) {
      return NextResponse.json(
        { error: "File extension must be png, jpg, jpeg, webp or avif" },
        { status: 400 }
      )
    }

    const key =
      folder === "logos"
        ? teamLogoKey(refId, ext)
        : playerPhotoKey(refId, ext)

    const body = new Uint8Array(await file.arrayBuffer())

    await uploadObject({
      key,
      body,
      contentType: file.type,
    })

    return NextResponse.json({ key })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
