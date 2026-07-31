import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

/**
 * Guards a CMS route handler so only signed-in administrators can access it.
 * Reads the JWT from the Authorization header (Bearer token), matching the
 * pattern used by app/api/auth/me/route.ts. Returns the verified payload on
 * success, or a NextResponse error that the caller should return early.
 */
export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null

  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    )
  }

  if (payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return payload
}
