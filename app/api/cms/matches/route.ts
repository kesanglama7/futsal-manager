import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { matchSchema } from "@/features/cms/schemas/match-schema"
import { MATCH_STATUS } from "@/generated/enums"

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const url = new URL(request.url)
    const statusParam = url.searchParams.get("status")

    const matches = await db.match.findMany({
      where: statusParam
        ? { status: statusParam as (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS] }
        : undefined,
      orderBy: { scheduledAt: "asc" },
      include: {
        homeTeam: true,
        awayTeam: true,
        matchTeams: { include: { team: true, formation: true } },
        _count: { select: { events: true } },
      },
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error("List matches error:", error)
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
    const parsed = matchSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    if (parsed.data.homeTeamId === parsed.data.awayTeamId) {
      return NextResponse.json(
        { error: "Home and away teams must be different" },
        { status: 400 }
      )
    }

    const scheduledAt = new Date(parsed.data.scheduledAt)
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduled date/time" },
        { status: 400 }
      )
    }

    const teamCount = await db.team.count({
      where: {
        id: { in: [parsed.data.homeTeamId, parsed.data.awayTeamId] },
      },
    })
    if (teamCount !== 2) {
      return NextResponse.json(
        { error: "One or both teams do not exist" },
        { status: 404 }
      )
    }

    const match = await db.$transaction(async (tx) => {
      const created = await tx.match.create({
        data: {
          homeTeamId: parsed.data.homeTeamId,
          awayTeamId: parsed.data.awayTeamId,
          scheduledAt,
          venue: parsed.data.venue ?? null,
          status: parsed.data.status ?? "SCHEDULED",
        },
      })

      await tx.matchTeam.createMany({
        data: [
          { matchId: created.id, teamId: created.homeTeamId, side: "HOME", positions: [] },
          { matchId: created.id, teamId: created.awayTeamId, side: "AWAY", positions: [] },
        ],
      })

      return created
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error("Create match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
