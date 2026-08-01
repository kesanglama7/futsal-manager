import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { matchLineupSchema } from "@/features/cms/schemas/match-schema"
import { MATCH_SIDE } from "@/generated/enums"

const VALID_SIDES = new Set<string>([MATCH_SIDE.HOME, MATCH_SIDE.AWAY])

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ matchId: string; side: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { matchId, side } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 })
  }
  if (!VALID_SIDES.has(side)) {
    return NextResponse.json({ error: "Invalid side" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const parsed = matchLineupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const match = await db.match.findUnique({
      where: { id },
      include: { matchTeams: true },
    })
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const sideEntry = match.matchTeams.find((mt) => mt.side === side)
    if (!sideEntry) {
      return NextResponse.json({ error: "Match side not found" }, { status: 404 })
    }

    // The formation must belong to this side's team.
    if (parsed.data.formationId !== null) {
      const formation = await db.formation.findFirst({
        where: { id: parsed.data.formationId, teamId: sideEntry.teamId },
      })
      if (!formation) {
        return NextResponse.json(
          { error: "Formation does not belong to this team" },
          { status: 400 }
        )
      }
    }

    // Every bound slot player must be on this side's roster.
    const playerIds = [
      ...new Set(
        parsed.data.positions
          .map((p) => p.playerId)
          .filter((pid): pid is number => pid !== null)
      ),
    ]
    if (playerIds.length > 0) {
      const rosterCount = await db.player.count({
        where: { id: { in: playerIds }, teamId: sideEntry.teamId },
      })
      if (rosterCount !== playerIds.length) {
        return NextResponse.json(
          { error: "Player is not on this team's roster" },
          { status: 400 }
        )
      }
    }

    const lineup = await db.matchTeam.upsert({
      where: { matchId_side: { matchId: id, side: side as "HOME" | "AWAY" } },
      create: {
        matchId: id,
        teamId: sideEntry.teamId,
        side: side as "HOME" | "AWAY",
        formationId: parsed.data.formationId,
        positions: JSON.parse(JSON.stringify(parsed.data.positions)),
      },
      update: {
        formationId: parsed.data.formationId,
        positions: JSON.parse(JSON.stringify(parsed.data.positions)),
      },
      include: { team: true, formation: true },
    })

    return NextResponse.json({ lineup })
  } catch (error) {
    console.error("Save lineup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
