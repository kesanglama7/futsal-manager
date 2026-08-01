import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { matchEventSchema } from "@/features/cms/schemas/match-schema"
import { MATCH_EVENT_TYPE, MATCH_STATUS } from "@/generated/enums"

export async function POST(
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
    const parsed = matchEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const match = await db.match.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    })
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }
    if (match.status === MATCH_STATUS.SCHEDULED) {
      return NextResponse.json(
        { error: "Cannot add events to a scheduled match" },
        { status: 400 }
      )
    }
    if (
      parsed.data.teamId !== match.homeTeamId &&
      parsed.data.teamId !== match.awayTeamId
    ) {
      return NextResponse.json(
        { error: "Team is not part of this match" },
        { status: 400 }
      )
    }

    const scorerOnTeam = await db.player.count({
      where: { id: parsed.data.playerId, teamId: parsed.data.teamId },
    })
    if (scorerOnTeam !== 1) {
      return NextResponse.json(
        { error: "Scorer is not on this team's roster" },
        { status: 400 }
      )
    }

    const event = await db.$transaction(async (tx) => {
      const created = await tx.matchEvent.create({
        data: {
          matchId: id,
          teamId: parsed.data.teamId,
          type: MATCH_EVENT_TYPE.GOAL,
          minute: parsed.data.minute,
          playerId: parsed.data.playerId,
        },
      })

      const isHome = parsed.data.teamId === match.homeTeamId
      const current = isHome ? match.homeScore : match.awayScore
      const next = (current ?? 0) + 1
      await tx.match.update({
        where: { id },
        data: { [isHome ? "homeScore" : "awayScore"]: next },
      })

      return created
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error("Create match event error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
