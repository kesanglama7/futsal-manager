import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { formationSchema } from "@/features/cms/schemas/formation-schema"

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

    const formations = await db.formation.findMany({
      where: { teamId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    })

    return NextResponse.json({ formations })
  } catch (error) {
    console.error("List formations error:", error)
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
    const parsed = formationSchema.safeParse(body)

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

    const formation = await db.formation.create({
      data: {
        teamId,
        type: parsed.data.type,
        name: parsed.data.name,
        positions: JSON.parse(JSON.stringify(parsed.data.positions)),
      },
    })

    return NextResponse.json({ formation }, { status: 201 })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A formation with this name already exists for the team" },
        { status: 409 }
      )
    }
    console.error("Create formation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
