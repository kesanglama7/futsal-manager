import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-guard"
import { buildLeagueTable } from "@/lib/league-table"
import { MATCH_STATUS } from "@/generated/enums"

/**
 * CMS dashboard aggregate. Returns counts, recent matches, and a derived
 * league table (W/D/L/GF/GA/points) from finished matches in one fetch.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const [
      teamCount,
      playerCount,
      matchCount,
      liveCount,
      upcomingCount,
      finishedCount,
      recentMatches,
    ] = await Promise.all([
      db.team.count(),
      db.player.count(),
      db.match.count(),
      db.match.count({ where: { status: MATCH_STATUS.LIVE } }),
      db.match.count({ where: { status: MATCH_STATUS.SCHEDULED } }),
      db.match.count({ where: { status: MATCH_STATUS.FINISHED } }),
      db.match.findMany({
        orderBy: { scheduledAt: "desc" },
        take: 5,
        include: { homeTeam: true, awayTeam: true },
      }),
    ])

    const leagueTable = await buildLeagueTable()

    return NextResponse.json({
      counts: {
        teams: teamCount,
        players: playerCount,
        matches: matchCount,
        live: liveCount,
        upcoming: upcomingCount,
        finished: finishedCount,
      },
      recentMatches,
      leagueTable,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
