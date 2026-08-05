"use client"

import { resolveMediaUrl } from "@/lib/media"
import { MATCH_STATUS } from "@/generated/enums"
import type {
  Match,
  MatchEvent,
  Player,
  Team,
} from "@/features/cms/types/cms-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/** A goal event that is safe to render (has a scorer). */
interface GoalRow {
  player: Player
  minute: number
}

/** Grouped scorers + MVP for a single team. */
interface TeamResult {
  team: Team
  goals: GoalRow[]
}

function goalRows(events: MatchEvent[], teamId: number): GoalRow[] {
  return events
    .filter((e) => e.teamId === teamId && !!e.player)
    .map((e) => ({ player: e.player!, minute: e.minute }))
    .sort((a, b) => a.minute - b.minute)
}

function resolveTeamResult(
  team: Team,
  events: MatchEvent[]
): TeamResult | null {
  return {
    team,
    goals: goalRows(events, team.id),
  }
}

/**
 * The final phase of the broadcast intro: the match result.
 *
 * Renders the final score with each team's goalscoring (who scored, at what
 * minute) in a TV lower-third / stat-block style, then the MVP — the single
 * player who scored the most goals in the match. If no goals were scored, or
 * the top goal tally is shared by more than one player (e.g. a 1-1 where each
 * team's single scorer has 1 goal), there is no MVP and a placeholder is shown
 * instead.
 */
export function MatchResultSummary({
  match,
  home,
  away,
  events = [],
}: {
  match: Match
  home: Team
  away: Team
  events: MatchEvent[]
}) {
  const finished =
    match.status === MATCH_STATUS.FINISHED &&
    match.homeScore !== null &&
    match.awayScore !== null

  if (!finished) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-muted-foreground">
        This match hasn't been played yet — check back after the final whistle.
      </div>
    )
  }

  const homeResult = resolveTeamResult(home, events)
  const awayResult = resolveTeamResult(away, events)
  const results = [homeResult, awayResult].filter(
    (r): r is TeamResult => !!r
  )

  // MVP = the single player who scored the most goals in the match. Requires
  // at least one goal, and the top tally must belong to exactly one player.
  const tally = new Map<number, number>()
  for (const r of results) {
    for (const g of r.goals) {
      tally.set(g.player.id, (tally.get(g.player.id) ?? 0) + 1)
    }
  }
  let topPlayer: Player | null = null
  let topGoals = 0
  for (const [playerId, goals] of tally) {
    if (goals > topGoals) {
      topGoals = goals
      const found = results
        .flatMap((r) => r.goals)
        .find((g) => g.player.id === playerId)?.player
      topPlayer = found ?? null
    }
  }
  const sharedTop = Array.from(tally.values()).filter((g) => g === topGoals).length > 1
  const mvp = topPlayer && topGoals > 0 && !sharedTop ? topPlayer : null

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto p-6 md:gap-7 md:p-8">
      {/* Header */}
      <div className="animate-in slide-in-from-top-4 text-xs font-black tracking-[0.5em] text-primary uppercase">
        Full Time
      </div>

      {/* Scoreboard */}
      <div
        className="grid w-full max-w-2xl animate-in zoom-in-95 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-2xl border bg-card/70 p-4 shadow-lg backdrop-blur md:gap-6 md:p-6"
      >
        {[home, away].map((team, i) => {
          const accent = teamAccent(team)
          const logoUrl = resolveMediaUrl(team.logo)
          const teamGoals = i === 0 ? homeResult?.goals ?? [] : awayResult?.goals ?? []
          return (
            <div
              key={team.id}
              className={cn(
                "flex flex-col items-center gap-2",
                i === 1 && "order-last"
              )}
            >
              <div
                className="flex size-14 items-center justify-center overflow-hidden rounded-full border-2 bg-white/10 md:size-20"
                style={{
                  borderColor: accent.primary,
                  boxShadow: `0 0 30px ${accent.primary}55`,
                }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt={team.name} className="size-10 md:size-14" />
                ) : (
                  <span className="font-display text-lg font-black text-white md:text-xl">
                    {initials(team.name)}
                  </span>
                )}
              </div>
              <div className="max-w-32 truncate text-center font-display text-sm font-black uppercase md:text-lg">
                {team.name}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {teamGoals.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  teamGoals.map((g) => (
                    <span
                      key={`${g.player.id}-${g.minute}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white md:text-xs"
                      style={{ backgroundColor: accent.primary }}
                      title={`${g.player.name}`}
                    >
                      <span className="rounded-sm bg-black/30 px-1 font-display">
                        {g.player.jersey}
                      </span>
                      {g.minute}&#39;
                    </span>
                  ))
                )}
              </div>
            </div>
          )
        })}

        {/* Center score */}
        <div className="flex flex-col items-center gap-1">
          <div className="font-display text-6xl font-black tabular-nums md:text-8xl">
            {match.homeScore}
            <span className="mx-2 text-muted-foreground md:mx-3">–</span>
            {match.awayScore}
          </div>
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Final
          </div>
        </div>
      </div>

      {/* Venue strip */}
      <div className="animate-in fade-in text-center text-xs text-muted-foreground md:text-sm">
        {[match.venue, match.scheduledAt].filter(Boolean).join(" · ")}
      </div>

      {/* Goalscorers grid */}
      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {results.map((r, i) => {
          const accent = teamAccent(r.team)
          return (
            <div
              key={r.team.id}
              className={cn(
                "animate-in rounded-2xl border bg-card/70 p-4 backdrop-blur md:p-5",
                i % 2 === 1 && "slide-in-from-right-4",
                i % 2 === 0 && "slide-in-from-left-4"
              )}
              style={{ animationFillMode: "both" }}
            >
              <div
                className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.25em] uppercase"
                style={{ color: accent.primary }}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: accent.primary }}
                />
                {r.team.name} · Goalscorers
              </div>

              {r.goals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No goals recorded.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {r.goals.map((g) => {
                    const photoUrl = resolveMediaUrl(g.player.photo)
                    return (
                      <li
                        key={`${g.player.id}-${g.minute}`}
                        className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-2.5 py-1.5"
                      >
                        <Avatar size="sm" className="size-8 border" style={{ borderColor: accent.primary }}>
                          <AvatarImage src={photoUrl ?? undefined} alt={g.player.name} />
                          <AvatarFallback>
                            <span className="font-display text-xs font-black">
                              {g.player.jersey}
                            </span>
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">
                            {g.player.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase">
                            #{g.player.jersey} · {g.player.position}
                          </div>
                        </div>
                        <span
                          className="shrink-0 rounded px-2 py-1 font-display text-base font-black text-white"
                          style={{ backgroundColor: accent.primary }}
                        >
                          {g.minute}&#39;
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* MVP */}
      <div className="w-full max-w-2xl">
        {mvp ? (
          <div
            className="animate-in zoom-in-95 relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-card/70 p-5 backdrop-blur duration-300 md:p-6"
            style={{
              borderColor: "var(--primary)",
              boxShadow: "0 0 40px -12px var(--primary)",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, transparent), var(--card) 55%)",
            }}
          >
            <span className="absolute -top-6 -left-4 -rotate-12 font-display text-8xl font-black text-primary/10 select-none">
              MVP
            </span>
            <Avatar className="size-20 border-2 border-primary shadow-[0_0_30px_-6px_var(--primary)] md:size-24">
              <AvatarImage
                src={resolveMediaUrl(mvp.photo) ?? undefined}
                alt={mvp.name}
              />
              <AvatarFallback>
                <span className="font-display text-2xl font-black">
                  {mvp.jersey}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="text-[10px] font-black tracking-[0.3em] text-primary uppercase">
                Man of the Match
              </div>
              <div className="mt-1 truncate font-display text-xl font-black uppercase md:text-3xl">
                {mvp.name}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-display font-black text-primary">
                  {topGoals} {topGoals === 1 ? "goal" : "goals"}
                </span>
                <span aria-hidden>·</span>
                <span>
                  #{mvp.jersey} · {mvp.position}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in flex items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/40 px-5 py-4 text-center backdrop-blur">
            <span className="font-display text-lg font-black text-primary">
              MVP
            </span>
            <span className="text-sm text-muted-foreground">
              {tally.size === 0
                ? "No goals scored — no MVP this match."
                : "The goals were shared between players — no single MVP."}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
