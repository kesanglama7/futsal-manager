import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { playerSchema } from "@/features/cms/schemas/player-schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id, playerId } = await params
  const teamId = Number(id)
  const playerIdNum = Number(playerId)
  if (!Number.isInteger(teamId) || !Number.isInteger(playerIdNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
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

    const existing = await db.player.findFirst({
      where: { id: playerIdNum, teamId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    const player = await db.player.update({
      where: { id: playerIdNum },
      data: {
        name: parsed.data.name,
        jersey: parsed.data.jersey,
        position: parsed.data.position,
        photo: parsed.data.photo ?? null,
      },
    })

    return NextResponse.json({ player })
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
    console.error("Update player error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id, playerId } = await params
  const teamId = Number(id)
  const playerIdNum = Number(playerId)
  if (!Number.isInteger(teamId) || !Number.isInteger(playerIdNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  try {
    const existing = await db.player.findFirst({
      where: { id: playerIdNum, teamId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    await db.player.delete({ where: { id: playerIdNum } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete player error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
