/**
 * Resolves an S3 object key to a public URL served by Supabase Storage.
 *
 * The database stores storage-agnostic object keys (e.g. "avatars/user-42.png")
 * rather than full URLs. This helper maps a key to the Supabase public bucket
 * URL at read time, and returns `null` when the key or the project URL env var
 * is missing so callers can fall back to a placeholder gracefully.
 *
 * Bucket name is configurable; defaults to "futsal" for the public media bucket.
 */
export function resolveMediaUrl(
  key: string | null | undefined,
  bucket = "futsal"
): string | null {
  if (!key) return null

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!projectUrl) return null

  return `${projectUrl}/storage/v1/object/public/${bucket}/${key}`
}
