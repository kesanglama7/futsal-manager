"use client"

import type { Match } from "@/features/cms/types/cms-types"
import { MatchCard } from "@/features/public/components/matches/match-card"

interface MatchesPublicListProps {
  title: string
  matches: Match[]
}

export function MatchesPublicList({ title, matches }: MatchesPublicListProps) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No {title.toLowerCase()} matches right now.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">
        {title} ({matches.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}
