import { z } from "zod"

export const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required")
    .max(60, "Team name must be 60 characters or fewer"),
  logo: z.string().nullable().optional(),
})

export type TeamInput = z.infer<typeof teamSchema>
