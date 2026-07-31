import { CalendarClock } from "lucide-react"

export default function MatchesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <CalendarClock className="size-10 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Matches</h2>
      <p className="text-sm text-muted-foreground">
        Match management is coming soon.
      </p>
    </div>
  )
}
