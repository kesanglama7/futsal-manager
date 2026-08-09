import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { matchUpdateSchema } from "@/features/cms/schemas/match-schema"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 })
  }

  try {
    const match = await db.match.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        matchTeams: { include: { team: true } },
        events: {
          include: { team: true, player: true },
          orderBy: { minute: "asc" },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error("Get match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const parsed = matchUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const existing = await db.match.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const data: {
      scheduledAt?: Date
      venue?: string | null
      status?: "SCHEDULED" | "LIVE" | "FINISHED"
    } = {}

    if (parsed.data.scheduledAt !== undefined) {
      const scheduledAt = new Date(parsed.data.scheduledAt)
      if (Number.isNaN(scheduledAt.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduled date/time" },
          { status: 400 }
        )
      }
      data.scheduledAt = scheduledAt
    }

    if (parsed.data.venue !== undefined) data.venue = parsed.data.venue
    if (parsed.data.status !== undefined) data.status = parsed.data.status

    const match = await db.match.update({ where: { id }, data })

    return NextResponse.json({ match })
  } catch (error) {
    console.error("Update match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 })
  }

  try {
    const existing = await db.match.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    await db.match.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
