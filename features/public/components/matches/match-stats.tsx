"use client"

import type {
  Match,
  MatchEvent,
  Player,
  Team,
} from "@/features/cms/types/cms-types"
import type { MatchSummary } from "@/features/public/types/public-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { MatchStatsBar } from "@/features/public/components/matches/match-stats-bar"

interface MatchStatsProps {
  match: Match
  home: Team
  away: Team
  homePlayers: Player[]
  awayPlayers: Player[]
  summary: MatchSummary | null
  events: MatchEvent[]
}

function topScorer(events: MatchEvent[], teamId: number): { name: string; goals: number } | null {
  const counts = new Map<number, { name: string; goals: number }>()
  for (const e of events) {
    if (e.teamId !== teamId || !e.player) continue
    const current = counts.get(e.player.id) ?? { name: e.player.name, goals: 0 }
    current.goals++
    counts.set(e.player.id, current)
  }
  let best: { name: string; goals: number } | null = null
  for (const entry of counts.values()) {
    if (!best || entry.goals > best.goals) best = entry
  }
  return best
}

function avgRating(players: Player[]): number {
  if (players.length === 0) return 0
  return Math.round(players.reduce((sum, p) => sum + p.rating, 0) / players.length)
}

export function MatchStats({
  match,
  home,
  away,
  homePlayers,
  awayPlayers,
  summary,
  events,
}: MatchStatsProps) {
  const homeAccent = teamAccent(home)
  const awayAccent = teamAccent(away)

  const homeGoals = match.homeScore ?? 0
  const awayGoals = match.awayScore ?? 0

  const topHome = summary?.topScorers.home
    ? { name: summary.topScorers.home.player.name, goals: summary.topScorers.home.goals }
    : topScorer(events, home.id)
  const topAway = summary?.topScorers.away
    ? { name: summary.topScorers.away.player.name, goals: summary.topScorers.away.goals }
    : topScorer(events, away.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Match Stats
        </h3>
        <div className="space-y-4">
          <MatchStatsBar
            label="Goals Scored"
            home={homeGoals}
            away={awayGoals}
            homeColor={homeAccent.primary}
            awayColor={awayAccent.primary}
          />
          <MatchStatsBar
            label="Goals Conceded"
            home={awayGoals}
            away={homeGoals}
            homeColor={homeAccent.primary}
            awayColor={awayAccent.primary}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Season Head to Head
        </h3>
        {summary ? (
          <div className="space-y-4">
            <MatchStatsBar
              label="Wins"
              home={summary.home.wins}
              away={summary.away.wins}
              homeColor={homeAccent.primary}
              awayColor={awayAccent.primary}
            />
            <MatchStatsBar
              label="Goals For"
              home={summary.home.goalsFor}
              away={summary.away.goalsFor}
              homeColor={homeAccent.primary}
              awayColor={awayAccent.primary}
            />
            <MatchStatsBar
              label="Goals Against"
              home={summary.home.goalsAgainst}
              away={summary.away.goalsAgainst}
              homeColor={homeAccent.primary}
              awayColor={awayAccent.primary}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Season stats will appear once matches are finished.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {home.name} — Top Scorer
          </h3>
          {topHome ? (
            <div>
              <div className="text-xl font-black">{topHome.name}</div>
              <div className="text-sm text-primary">
                {topHome.goals} {topHome.goals === 1 ? "goal" : "goals"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No goals recorded</p>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Squad Rating
          </h3>
          <div>
            <div className="text-xl font-black">{avgRating(homePlayers)}</div>
            <div className="text-sm text-muted-foreground">{home.name}</div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-black">{avgRating(awayPlayers)}</div>
            <div className="text-sm text-muted-foreground">{away.name}</div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {away.name} — Top Scorer
          </h3>
          {topAway ? (
            <div>
              <div className="text-xl font-black">{topAway.name}</div>
              <div className="text-sm text-primary">
                {topAway.goals} {topAway.goals === 1 ? "goal" : "goals"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No goals recorded</p>
          )}
        </div>
      </div>
    </div>
  )
}
