import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { playerSchema } from "@/features/cms/schemas/player-schema"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const teamId = Number(id)
  if (!Number.isInteger(teamId)) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 })
  }

  try {
    const team = await db.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const players = await db.player.findMany({
      where: { teamId },
      orderBy: [{ jersey: "asc" }],
    })

    return NextResponse.json({ players })
  } catch (error) {
    console.error("List players error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const teamId = Number(id)
  if (!Number.isInteger(teamId)) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const parsed = playerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const team = await db.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const player = await db.player.create({
      data: {
        name: parsed.data.name,
        jersey: parsed.data.jersey,
        position: parsed.data.position,
        photo: parsed.data.photo ?? null,
        teamId,
        rating: parsed.data.rating,
        pace: parsed.data.pace,
        shooting: parsed.data.shooting,
        passing: parsed.data.passing,
        defending: parsed.data.defending,
      },
    })

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "A player with this jersey number already exists on the team",
        },
        { status: 409 }
      )
    }
    console.error("Create player error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
