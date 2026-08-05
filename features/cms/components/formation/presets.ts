import type { FormationSlot } from "@/features/cms/types/cms-types"
import { POSITION } from "@/generated/enums"

/**
 * Standard preset formations. Coordinates are percentages relative to the
 * pitch (x across width, y down the length; the pitch is drawn top-down with
 * both goals visible). Applying a preset seeds the 7 slots with playerId null.
 * Futsal is 7-a-side: 1 goalkeeper + 6 outfield.
 */
export interface PresetFormation {
  name: string
  slots: Omit<FormationSlot, "playerId">[]
}

export const PRESET_FORMATIONS: PresetFormation[] = [
  {
    name: "2-2-2-1 Diamond",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def-left", x: 30, y: 62, position: POSITION.DEFENDER },
      { slotId: "def-right", x: 70, y: 62, position: POSITION.DEFENDER },
      { slotId: "wing-left", x: 30, y: 35, position: POSITION.WINGER },
      { slotId: "wing-right", x: 70, y: 35, position: POSITION.WINGER },
      { slotId: "pivot", x: 40, y: 18, position: POSITION.PIVOT },
      { slotId: "pivot-roam", x: 60, y: 15, position: POSITION.PIVOT },
    ],
  },
  {
    name: "2-1-2-1 Box",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def", x: 50, y: 62, position: POSITION.DEFENDER },
      { slotId: "wing-left", x: 30, y: 40, position: POSITION.WINGER },
      { slotId: "wing-right", x: 70, y: 40, position: POSITION.WINGER },
      { slotId: "pivot", x: 50, y: 25, position: POSITION.PIVOT },
      { slotId: "wing-top", x: 42, y: 12, position: POSITION.WINGER },
      { slotId: "pivot-top", x: 58, y: 14, position: POSITION.PIVOT },
    ],
  },
  {
    name: "3-2-1",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def-left", x: 32, y: 62, position: POSITION.DEFENDER },
      { slotId: "def-center", x: 50, y: 55, position: POSITION.DEFENDER },
      { slotId: "def-right", x: 68, y: 62, position: POSITION.DEFENDER },
      { slotId: "wing", x: 40, y: 32, position: POSITION.WINGER },
      { slotId: "pivot", x: 55, y: 18, position: POSITION.PIVOT },
      { slotId: "wing-roam", x: 62, y: 32, position: POSITION.WINGER },
    ],
  },
  {
    name: "2-2-1-1 Box",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def-left", x: 30, y: 58, position: POSITION.DEFENDER },
      { slotId: "def-right", x: 70, y: 58, position: POSITION.DEFENDER },
      { slotId: "wing-left", x: 32, y: 32, position: POSITION.WINGER },
      { slotId: "wing-right", x: 68, y: 32, position: POSITION.WINGER },
      { slotId: "pivot", x: 42, y: 16, position: POSITION.PIVOT },
      { slotId: "pivot-roam", x: 58, y: 18, position: POSITION.PIVOT },
    ],
  },
]
