import { z } from "zod"
import { MATCH_STATUS } from "@/generated/enums"
import { formationSlotSchema } from "@/features/cms/schemas/formation-schema"

const matchStatusSchema = z.enum([
  MATCH_STATUS.SCHEDULED,
  MATCH_STATUS.LIVE,
  MATCH_STATUS.FINISHED,
])

/**
 * Create a match. scheduledAt is a `datetime-local` string (YYYY-MM-DDTHH:mm);
 * routes convert it with `new Date()` and reject invalid values.
 */
export const matchSchema = z
  .object({
    homeTeamId: z.number().int().positive(),
    awayTeamId: z.number().int().positive(),
    scheduledAt: z.string().min(1, "Scheduled date/time is required"),
    venue: z.string().trim().max(120).nullable().optional(),
    status: matchStatusSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.homeTeamId === data.awayTeamId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Home and away teams must be different",
        path: ["awayTeamId"],
      })
    }
  })

/**
 * Edit a match. Teams are immutable after creation; the score is derived from
 * GOAL events, so it is not manually editable either.
 */
export const matchUpdateSchema = z.object({
  scheduledAt: z.string().min(1, "Scheduled date/time is required").optional(),
  venue: z.string().trim().max(120).nullable().optional(),
  status: matchStatusSchema.optional(),
})

/**
 * A single bench/substitute entry. Roster players not in the starting 7.
 * position/jersey are optional display hints; playerId links the roster.
 */
export const matchBenchSlotSchema = z.object({
  playerId: z.number().int().positive(),
})

/**
 * Save a team's lineup for a match side. positions reuses the formation slot
 * shape (a snapshot of the chosen formation with player bindings). Up to 7
 * slots (starting line-up); 0 is valid (no lineup set). bench lists the
 * remaining squad (substitutes).
 */
export const matchLineupSchema = z.object({
  formationId: z.number().int().positive().nullable(),
  positions: z.array(formationSlotSchema).max(7, "A lineup can have at most 7 slots"),
  bench: z.array(matchBenchSlotSchema).default([]),
})

/** Create a GOAL event for a live/finished match. */
export const matchEventSchema = z.object({
  teamId: z.number().int().positive(),
  minute: z.number().int().min(0).max(99),
  playerId: z.number().int().positive("A goal needs a scorer"),
})

export type MatchInput = z.infer<typeof matchSchema>
export type MatchUpdateInput = z.infer<typeof matchUpdateSchema>
export type MatchLineupInput = z.infer<typeof matchLineupSchema>
export type MatchEventInput = z.infer<typeof matchEventSchema>
export type MatchBenchSlotInput = z.infer<typeof matchBenchSlotSchema>
