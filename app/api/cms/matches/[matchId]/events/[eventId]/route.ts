import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { MATCH_EVENT_TYPE } from "@/generated/enums"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string; eventId: string }> }
) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  const { matchId, eventId } = await params
  const id = Number(matchId)
  const eventIdNum = Number(eventId)
  if (!Number.isInteger(id) || !Number.isInteger(eventIdNum)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  try {
    const existing = await db.matchEvent.findFirst({
      where: { id: eventIdNum, matchId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await db.$transaction(async (tx) => {
      await tx.matchEvent.delete({ where: { id: eventIdNum } })

      // Revert the score for GOAL events (floor at 0).
      if (existing.type === MATCH_EVENT_TYPE.GOAL) {
        const match = await tx.match.findUnique({
          where: { id },
          select: { homeTeamId: true, homeScore: true, awayScore: true },
        })
        if (!match) return

        const isHome = existing.teamId === match.homeTeamId
        const current = isHome ? match.homeScore : match.awayScore
        const next = Math.max((current ?? 0) - 1, 0)
        await tx.match.update({
          where: { id },
          data: { [isHome ? "homeScore" : "awayScore"]: next },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete match event error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
