import type {
  FORMATION_TYPE,
  MATCH_EVENT_TYPE,
  MATCH_SIDE,
  MATCH_STATUS,
  POSITION,
} from "@/generated/enums"

export interface Team {
  id: number
  name: string
  logo: string | null
  createdAt: string
  updatedAt: string
  roster?: Player[]
  _count?: {
    roster: number
    formations: number
  }
}

export interface Player {
  id: number
  name: string
  jersey: number
  position: POSITION
  photo: string | null
  teamId: number
  createdAt: string
  updatedAt: string
  rating: number
  pace: number
  shooting: number
  passing: number
  defending: number
}

export interface FormationSlot {
  slotId: string
  x: number
  y: number
  position: POSITION
  playerId: number | null
}

export interface Formation {
  id: number
  teamId: number
  type: FORMATION_TYPE
  name: string
  positions: FormationSlot[]
  createdAt: string
  updatedAt: string
}

export interface Match {
  id: number
  homeTeamId: number
  awayTeamId: number
  scheduledAt: string
  venue: string | null
  status: MATCH_STATUS
  homeScore: number | null
  awayScore: number | null
  createdAt: string
  updatedAt: string
  homeTeam?: Team
  awayTeam?: Team
  matchTeams?: MatchTeam[]
  events?: MatchEvent[]
  _count?: { events: number }
}

export interface MatchTeam {
  id: number
  matchId: number
  teamId: number
  side: MATCH_SIDE
  formationId: number | null
  positions: FormationSlot[]
  createdAt: string
  updatedAt: string
  team?: Team
  formation?: Formation | null
}

export interface MatchEvent {
  id: number
  matchId: number
  teamId: number
  type: MATCH_EVENT_TYPE
  minute: number
  playerId: number | null
  createdAt: string
  team?: Team
  player?: Player | null
}
