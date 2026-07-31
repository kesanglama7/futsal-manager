import type { FormationSlot } from "@/features/cms/types/cms-types"
import { POSITION } from "@/generated/enums"

/**
 * Standard preset formations. Coordinates are percentages relative to the
 * pitch (x across width, y down the length; the pitch is drawn top-down with
 * both goals visible). Applying a preset seeds the 5 slots with playerId null.
 */
export interface PresetFormation {
  name: string
  slots: Omit<FormationSlot, "playerId">[]
}

export const PRESET_FORMATIONS: PresetFormation[] = [
  {
    name: "2-2 Diamond",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def-left", x: 30, y: 60, position: POSITION.DEFENDER },
      { slotId: "def-right", x: 70, y: 60, position: POSITION.DEFENDER },
      { slotId: "pivot", x: 50, y: 35, position: POSITION.PIVOT },
      { slotId: "wing", x: 50, y: 15, position: POSITION.WINGER },
    ],
  },
  {
    name: "1-2-1 Box",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def", x: 50, y: 62, position: POSITION.DEFENDER },
      { slotId: "wing-left", x: 30, y: 38, position: POSITION.WINGER },
      { slotId: "wing-right", x: 70, y: 38, position: POSITION.WINGER },
      { slotId: "pivot", x: 50, y: 15, position: POSITION.PIVOT },
    ],
  },
  {
    name: "2-1-1 Diagonal",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def-left", x: 32, y: 62, position: POSITION.DEFENDER },
      { slotId: "def-right", x: 68, y: 55, position: POSITION.DEFENDER },
      { slotId: "wing", x: 45, y: 32, position: POSITION.WINGER },
      { slotId: "pivot", x: 58, y: 15, position: POSITION.PIVOT },
    ],
  },
  {
    name: "3-1",
    slots: [
      { slotId: "gk", x: 50, y: 90, position: POSITION.GOALKEEPER },
      { slotId: "def-left", x: 30, y: 58, position: POSITION.DEFENDER },
      { slotId: "def-center", x: 50, y: 48, position: POSITION.DEFENDER },
      { slotId: "def-right", x: 70, y: 58, position: POSITION.DEFENDER },
      { slotId: "pivot", x: 50, y: 18, position: POSITION.PIVOT },
    ],
  },
]
