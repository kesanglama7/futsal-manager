import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

/**
 * Server-only storage layer backed by Supabase Storage's S3-compatible API.
 *
 * The database stores storage-agnostic object keys (e.g. "logos/team-3.png");
 * this module handles the actual object I/O against Supabase S3. It must only
 * be imported from route handlers so credentials never reach the client bundle.
 */

let client: S3Client | null = null

function getS3Client(): S3Client {
  if (client) return client

  const endpoint = process.env.NEXT_PUBLIC_SUPABASE_URL
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Supabase S3 storage is not configured. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_S3_ACCESS_KEY and SUPABASE_S3_SECRET_KEY in .env"
    )
  }

  client = new S3Client({
    endpoint: `${endpoint}/storage/v1/s3`,
    region: "us-east-1", // required by the SDK, ignored by Supabase
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // required for Supabase S3 compatibility
  })

  return client
}

function getBucket(): string {
  return process.env.SUPABASE_S3_BUCKET ?? "futsal"
}

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "avif"] as const
type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number]

/**
 * Derives a sanitized file extension from a client-supplied file name.
 * Returns null when the extension is missing or not allowlisted.
 */
export function sanitizeExtension(fileName: string): AllowedExtension | null {
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (!ext) return null
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
    ? (ext as AllowedExtension)
    : null
}

/** Object key builder for team logos, e.g. "logos/team-3-1720000000000.png". */
export function teamLogoKey(teamId: number, ext: AllowedExtension): string {
  return `logos/team-${teamId}-${Date.now()}.${ext}`
}

/** Object key builder for player photos, e.g. "players/player-12-1720000000000.png". */
export function playerPhotoKey(
  playerId: number,
  ext: AllowedExtension
): string {
  return `players/player-${playerId}-${Date.now()}.${ext}`
}

export interface UploadObjectInput {
  key: string
  body: Uint8Array | Buffer
  contentType: string
  cacheControl?: string
}

/** Uploads a single object and returns its key. Throws on failure. */
export async function uploadObject({
  key,
  body,
  contentType,
  cacheControl = "public, max-age=31536000, immutable",
}: UploadObjectInput): Promise<string> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  )
  return key
}

/** Deletes a single object. Idempotent — does not throw when the object is missing. */
export async function deleteObject(key: string): Promise<void> {
  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: getBucket(),
        Key: key,
      })
    )
  } catch (error) {
    console.error(`Failed to delete object "${key}":`, error)
  }
}
