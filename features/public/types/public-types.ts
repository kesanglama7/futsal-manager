import type { Match, Player } from "@/features/cms/types/cms-types"

export interface TeamSummary {
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}

export interface TopScorer {
  player: Player
  goals: number
}

export interface MatchSummary {
  home: TeamSummary
  away: TeamSummary
  topScorers: {
    home: TopScorer | null
    away: TopScorer | null
  }
}

/** Response of `GET /api/public/matches/:id`. */
export interface MatchDetail {
  match: Match
  summary: MatchSummary | null
}
