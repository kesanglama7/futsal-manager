/**
 * Light-theme port of animation/StatsBar.tsx. Compares a home vs away stat
 * with proportional segment widths in each team's accent color.
 */
export function MatchStatsBar({
  label,
  home,
  away,
  homeColor = "#059669",
  awayColor = "#dc2626",
}: {
  label: string
  home: number
  away: number
  homeColor?: string
  awayColor?: string
}) {
  const total = home + away || 1
  const homePct = (home / total) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="font-display text-base font-black text-foreground">{home}</span>
        <span className="uppercase tracking-widest">{label}</span>
        <span className="font-display text-base font-black text-foreground">{away}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div
          style={{ width: `${homePct}%`, background: homeColor }}
          className="h-full transition-all"
        />
        <div
          style={{ width: `${100 - homePct}%`, background: awayColor }}
          className="h-full transition-all"
        />
      </div>
    </div>
  )
}
