import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { MATCH_STATUS } from "@/generated/enums"
import type { Player } from "@/features/cms/types/cms-types"
import type { MatchSummary } from "@/features/public/types/public-types"

// Intentionally unauthenticated: this is the public match detail page.
// Read-only — do not add write methods here.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const id = Number(matchId)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid match id" }, { status: 400 })
  }

  // Lightweight polling payload: the detail page polls every 5-10s while a
  // match is live/upcoming. During that window only the scoreboard, status
  // and lineup/events change — head-to-head stats and full rosters do not, so
  // skip them to keep each poll cheap. The initial (non-poll) load still
  // returns everything needed to render the Lineups tab.
  const isPoll = new URL(request.url).searchParams.get("poll") === "1"

  try {
    const match = await db.match.findUnique({
      where: { id },
      include: isPoll
        ? {
            homeTeam: true,
            awayTeam: true,
            matchTeams: { include: { team: true } },
            events: {
              include: { team: true, player: true },
              orderBy: { minute: "asc" },
            },
          }
        : {
            homeTeam: { include: { roster: { orderBy: { jersey: "asc" } } } },
            awayTeam: { include: { roster: { orderBy: { jersey: "asc" } } } },
            matchTeams: { include: { team: true } },
            events: {
              include: { team: true, player: true },
              orderBy: { minute: "asc" },
            },
          },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const summary = isPoll
      ? null
      : await buildSummary(match.homeTeamId, match.awayTeamId)

    return NextResponse.json(
      { match, summary },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Public get match error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Derives head-to-head season stats for the two teams from finished matches
 * (no team-record schema is stored — everything is computed from real data).
 * Returns null if anything fails so the page can degrade gracefully.
 */
async function buildSummary(
  homeTeamId: number,
  awayTeamId: number
): Promise<MatchSummary | null> {
  try {
    const teamIds = [homeTeamId, awayTeamId]

    const finished = await db.match.findMany({
      where: {
        status: MATCH_STATUS.FINISHED,
        OR: [
          { homeTeamId: { in: teamIds } },
          { awayTeamId: { in: teamIds } },
        ],
      },
      select: {
        id: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    })

    const statsFor = (teamId: number) => {
      const base = {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      }

      for (const m of finished) {
        if (m.homeTeamId === teamId) {
          const gf = m.homeScore ?? 0
          const ga = m.awayScore ?? 0
          base.goalsFor += gf
          base.goalsAgainst += ga
          if (gf > ga) base.wins++
          else if (gf < ga) base.losses++
          else base.draws++
        } else if (m.awayTeamId === teamId) {
          const gf = m.awayScore ?? 0
          const ga = m.homeScore ?? 0
          base.goalsFor += gf
          base.goalsAgainst += ga
          if (gf > ga) base.wins++
          else if (gf < ga) base.losses++
          else base.draws++
        }
      }

      return base
    }

    const home = statsFor(homeTeamId)
    const away = statsFor(awayTeamId)

    // Top scorer per team across all finished matches involving either team.
    const finishedIds = finished.map((m) => m.id)
    const goalEvents = await db.matchEvent.findMany({
      where: {
        matchId: { in: finishedIds },
        playerId: { not: null },
      },
      include: { player: true },
    })

    const topScorerFor = (
      teamId: number
    ): { player: Player; goals: number } | null => {
      const counts = new Map<number, number>()
      for (const e of goalEvents) {
        if (e.teamId !== teamId || !e.player) continue
        counts.set(e.playerId!, (counts.get(e.playerId!) ?? 0) + 1)
      }
      let best: { player: Player; goals: number } | null = null
      for (const [playerId, goals] of counts) {
        const raw = goalEvents.find((e) => e.playerId === playerId)?.player
        if (!raw) continue
        const player: Player = {
          id: raw.id,
          name: raw.name,
          jersey: raw.jersey,
          position: raw.position,
          photo: raw.photo,
          teamId: raw.teamId,
          createdAt: raw.createdAt.toISOString(),
          updatedAt: raw.updatedAt.toISOString(),
          rating: raw.rating,
          pace: raw.pace,
          shooting: raw.shooting,
          passing: raw.passing,
          defending: raw.defending,
        }
        if (!best || goals > best.goals) best = { player, goals }
      }
      return best
    }

    return {
      home,
      away,
      topScorers: {
        home: topScorerFor(homeTeamId),
        away: topScorerFor(awayTeamId),
      },
    }
  } catch (error) {
    console.error("Build match summary error:", error)
    return null
  }
}
