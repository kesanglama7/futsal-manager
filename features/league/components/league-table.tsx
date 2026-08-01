import { resolveMediaUrl } from "@/lib/media"
import type { LeagueRow } from "@/lib/league-table"
import { cn } from "@/lib/utils"

interface LeagueTableProps {
  rows: LeagueRow[]
  /** Compact mode for the public page. */
  compact?: boolean
}

export function LeagueTable({ rows, compact = false }: LeagueTableProps) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs tracking-widest text-muted-foreground uppercase">
          <th className="py-2 pr-2 font-semibold">#</th>
          <th className="py-2 pr-2 font-semibold">Team</th>
          <th className="py-2 px-2 text-center font-semibold">P</th>
          <th className="py-2 px-2 text-center font-semibold">W</th>
          <th className="py-2 px-2 text-center font-semibold">D</th>
          <th className="py-2 px-2 text-center font-semibold">L</th>
          {!compact && <th className="py-2 px-2 text-center font-semibold">GD</th>}
          <th className="py-2 pl-2 text-right font-semibold">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const gd = row.goalsFor - row.goalsAgainst
          const logoUrl = resolveMediaUrl(row.logo)
          return (
            <tr
              key={row.teamId}
              className={cn(
                "border-b border-border/40 last:border-0",
                row.position === 1 && "bg-primary/[0.06]"
              )}
            >
              <td className="py-2 pr-2 font-display font-black text-muted-foreground">
                {row.position}
              </td>
              <td className="py-2 pr-2">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="size-6 rounded-md object-cover" />
                  ) : (
                    <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 font-display text-xs font-black text-primary">
                      {row.name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate font-medium">{row.name}</span>
                  {row.position === 1 && (
                    <span className="shrink-0 text-xs text-rating">● Leader</span>
                  )}
                </div>
              </td>
              <td className="py-2 px-2 text-center tabular-nums">{row.played}</td>
              <td className="py-2 px-2 text-center tabular-nums text-emerald-400">{row.wins}</td>
              <td className="py-2 px-2 text-center tabular-nums text-muted-foreground">{row.draws}</td>
              <td className="py-2 px-2 text-center tabular-nums text-destructive">{row.losses}</td>
              {!compact && (
                <td className="py-2 px-2 text-center tabular-nums">
                  {gd > 0 ? `+${gd}` : gd}
                </td>
              )}
              <td className="py-2 pl-2 text-right font-display font-black tabular-nums">
                {row.points}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
