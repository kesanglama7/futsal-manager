import { db } from "@/lib/db"
import { MATCH_STATUS } from "@/generated/enums"

export interface LeagueRow {
  teamId: number
  name: string
  logo: string | null
  position: number
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

/**
 * Derives the league table from finished matches. Teams with no finished
 * match are excluded (includeAllTeams to show everyone). Sorted by points,
 * then goal difference, then goals scored.
 */
export async function buildLeagueTable(options?: {
  includeAllTeams?: boolean
}): Promise<LeagueRow[]> {
  const teams = await db.team.findMany({
    select: {
      id: true,
      name: true,
      logo: true,
      _count: { select: { roster: true } },
    },
    orderBy: { name: "asc" },
  })

  const finished = await db.match.findMany({
    where: { status: MATCH_STATUS.FINISHED },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
    },
  })

  const standings = new Map<
    number,
    Omit<LeagueRow, "position"> & { position: number }
  >()

  for (const team of teams) {
    standings.set(team.id, {
      teamId: team.id,
      name: team.name,
      logo: team.logo,
      position: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    })
  }

  for (const m of finished) {
    const home = standings.get(m.homeTeamId)
    const away = standings.get(m.awayTeamId)
    const hg = m.homeScore ?? 0
    const ag = m.awayScore ?? 0

    if (home) {
      home.played++
      home.goalsFor += hg
      home.goalsAgainst += ag
      if (hg > ag) { home.wins++; home.points += 3 }
      else if (hg === ag) { home.draws++; home.points += 1 }
      else home.losses++
    }
    if (away) {
      away.played++
      away.goalsFor += ag
      away.goalsAgainst += hg
      if (ag > hg) { away.wins++; away.points += 3 }
      else if (ag === hg) { away.draws++; away.points += 1 }
      else away.losses++
    }
  }

  const rows = [...standings.values()].filter(
    (t) => options?.includeAllTeams || t.played > 0
  )

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - a.goalsFor ||
      a.goalsAgainst - b.goalsAgainst
  )

  return rows.map((row, i) => ({ ...row, position: i + 1 }))
}
