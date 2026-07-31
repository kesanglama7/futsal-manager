import type { FORMATION_TYPE, POSITION } from "@/generated/enums"

export interface Team {
  id: number
  name: string
  logo: string | null
  createdAt: string
  updatedAt: string
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
