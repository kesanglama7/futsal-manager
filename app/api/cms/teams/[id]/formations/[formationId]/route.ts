import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { formationSchema } from "@/features/cms/schemas/formation-schema"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; formationId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id, formationId } = await params
  const teamId = Number(id)
  const formationIdNum = Number(formationId)
  if (!Number.isInteger(teamId) || !Number.isInteger(formationIdNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
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

    const existing = await db.formation.findFirst({
      where: { id: formationIdNum, teamId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Formation not found" },
        { status: 404 }
      )
    }

    const formation = await db.formation.update({
      where: { id: formationIdNum },
      data: {
        type: parsed.data.type,
        name: parsed.data.name,
        positions: JSON.parse(JSON.stringify(parsed.data.positions)),
      },
    })

    return NextResponse.json({ formation })
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
    console.error("Update formation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; formationId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { id, formationId } = await params
  const teamId = Number(id)
  const formationIdNum = Number(formationId)
  if (!Number.isInteger(teamId) || !Number.isInteger(formationIdNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  try {
    const existing = await db.formation.findFirst({
      where: { id: formationIdNum, teamId },
    })
    if (!existing) {
      return NextResponse.json(
        { error: "Formation not found" },
        { status: 404 }
      )
    }

    await db.formation.delete({ where: { id: formationIdNum } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete formation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
