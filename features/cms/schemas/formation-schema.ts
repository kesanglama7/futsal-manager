import { z } from "zod"
import { FORMATION_TYPE, POSITION } from "@/generated/enums"

/**
 * A single slot on the pitch. x/y are percentages (5..95) relative to the
 * pitch. playerId is the bound roster player, or null for an empty slot.
 * Max 6 slots per formation (5 outfield + goalkeeper).
 */
export const formationSlotSchema = z.object({
  slotId: z.string().min(1),
  x: z.number().min(5).max(95),
  y: z.number().min(5).max(95),
  position: z.enum([
    POSITION.GOALKEEPER,
    POSITION.DEFENDER,
    POSITION.WINGER,
    POSITION.PIVOT,
  ]),
  playerId: z.number().int().positive().nullable(),
})

export const formationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Formation name is required")
    .max(60, "Formation name must be 60 characters or fewer"),
  type: z.enum([FORMATION_TYPE.PRESET, FORMATION_TYPE.CUSTOM]),
  positions: z
    .array(formationSlotSchema)
    .min(1, "A formation needs at least one slot")
    .max(6, "A formation can have at most 6 slots"),
})

export type FormationInput = z.infer<typeof formationSchema>
export type FormationSlotInput = z.infer<typeof formationSlotSchema>
