import { MATCH_STATUS } from "@/generated/enums"
import { cn } from "@/lib/utils"

export const MATCH_STATUS_LABELS: Record<MATCH_STATUS, string> = {
  [MATCH_STATUS.SCHEDULED]: "Scheduled",
  [MATCH_STATUS.LIVE]: "Live",
  [MATCH_STATUS.FINISHED]: "Finished",
}

export const MATCH_STATUS_STYLES: Record<MATCH_STATUS, string> = {
  [MATCH_STATUS.SCHEDULED]:
    "bg-muted text-muted-foreground",
  [MATCH_STATUS.LIVE]:
    "bg-live/15 text-live border border-live/30",
  [MATCH_STATUS.FINISHED]:
    "bg-card text-muted-foreground border border-border",
}

export function MatchStatusBadge({
  status,
  className,
}: {
  status: MATCH_STATUS
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
        MATCH_STATUS_STYLES[status],
        className
      )}
    >
      {status === MATCH_STATUS.LIVE && (
        <span className="size-1.5 animate-pulse rounded-full bg-live" />
      )}
      {MATCH_STATUS_LABELS[status]}
    </span>
  )
}
