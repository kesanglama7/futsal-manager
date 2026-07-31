import { z } from "zod"
import { POSITION } from "@/generated/enums"

export const playerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Player name is required")
    .max(60, "Player name must be 60 characters or fewer"),
  jersey: z
    .number()
    .int("Jersey number must be a whole number")
    .min(1, "Jersey number must be at least 1")
    .max(99, "Jersey number must be 99 or fewer"),
  position: z.enum([
    POSITION.GOALKEEPER,
    POSITION.DEFENDER,
    POSITION.WINGER,
    POSITION.PIVOT,
  ]),
  photo: z.string().nullable().optional(),
})

export type PlayerInput = z.infer<typeof playerSchema>
