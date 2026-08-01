import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { teamSchema } from "@/features/cms/schemas/team-schema"

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
    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        _count: { select: { roster: true, formations: true } },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const parsed = teamSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const existing = await db.team.findUnique({ where: { id: teamId } })
    if (!existing) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const team = await db.team.update({
      where: { id: teamId },
      data: {
        name: parsed.data.name,
        logo: parsed.data.logo ?? null,
      },
    })

    return NextResponse.json({ team })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A team with this name already exists" },
        { status: 409 }
      )
    }
    console.error("Update team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const existing = await db.team.findUnique({ where: { id: teamId } })
    if (!existing) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Players and formations cascade via FK onDelete: Cascade
    await db.team.delete({ where: { id: teamId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2003"
    ) {
      // Match.homeTeamId/awayTeamId FK is onDelete: Restrict
      return NextResponse.json(
        { error: "Cannot delete a team that has matches" },
        { status: 409 }
      )
    }
    console.error("Delete team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
