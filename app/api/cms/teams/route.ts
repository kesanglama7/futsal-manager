import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { teamSchema } from "@/features/cms/schemas/team-schema"

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const teams = await db.team.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { roster: true } },
      },
    })
    return NextResponse.json({ teams })
  } catch (error) {
    console.error("List teams error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const parsed = teamSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const team = await db.team.create({
      data: {
        name: parsed.data.name,
        logo: parsed.data.logo ?? null,
      },
    })

    return NextResponse.json({ team }, { status: 201 })
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
    console.error("Create team error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
