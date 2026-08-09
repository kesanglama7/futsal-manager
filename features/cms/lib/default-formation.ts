import type { FormationSlot } from "@/features/cms/types/cms-types"
import { POSITION } from "@/generated/enums"

/**
 * Fixed 1-3-3 formation shared by every team: 1 goalkeeper + 3 defenders +
 * 2 wingers + 1 pivot. Coordinates are percentages relative to the pitch
 * (x across width, y down the length; pitch drawn top-down, GK near y:90).
 */
export const DEFAULT_FORMATION_SLOTS: Omit<FormationSlot, "playerId">[] = [
  { slotId: "gk",         x: 50, y: 90, position: POSITION.GOALKEEPER },
  { slotId: "def-left",   x: 30, y: 70, position: POSITION.DEFENDER },
  { slotId: "def-center", x: 50, y: 64, position: POSITION.DEFENDER },
  { slotId: "def-right",  x: 70, y: 70, position: POSITION.DEFENDER },
  { slotId: "wing-left",  x: 30, y: 40, position: POSITION.WINGER },
  { slotId: "wing-right", x: 70, y: 40, position: POSITION.WINGER },
  { slotId: "pivot",      x: 50, y: 18, position: POSITION.PIVOT },
]

/** All 1-3-3 slots with no player bound, ready to persist as a lineup snapshot. */
export const DEFAULT_FORMATION: FormationSlot[] = DEFAULT_FORMATION_SLOTS.map(
  (slot) => ({ ...slot, playerId: null })
)
