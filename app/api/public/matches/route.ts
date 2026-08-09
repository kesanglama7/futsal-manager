import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { buildLeagueTable } from "@/lib/league-table"
import { MATCH_STATUS } from "@/generated/enums"

// Intentionally unauthenticated: this is the public match list.
// Read-only — do not add write methods here.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const scope = url.searchParams.get("scope") // "upcoming" | "past" | undefined

    const where =
      scope === "upcoming"
        ? { status: { in: [MATCH_STATUS.SCHEDULED, MATCH_STATUS.LIVE] } }
        : scope === "past"
          ? { status: MATCH_STATUS.FINISHED }
          : undefined

    const [matches, leagueTable] = await Promise.all([
      db.match.findMany({
        where,
        orderBy: { scheduledAt: "asc" },
        include: {
          homeTeam: true,
          awayTeam: true,
          matchTeams: { include: { team: true } },
          _count: { select: { events: true } },
        },
      }),
      buildLeagueTable(),
    ])

    return NextResponse.json(
      { matches, leagueTable },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Public list matches error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
