"use client"

import { useEffect, useState } from "react"
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react"

import { resolveMediaUrl } from "@/lib/media"
import type {
  Match,
  Player,
  Team,
  FormationSlot,
} from "@/features/cms/types/cms-types"
import type { MatchSummary } from "@/features/public/types/public-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { MatchLineupReveal } from "@/features/public/components/matches/match-lineup-reveal"
import { MatchPlayerCard } from "@/features/public/components/matches/match-player-card"
import { MatchStatsBar } from "@/features/public/components/matches/match-stats-bar"
import { Button } from "@/components/ui/button"

const PHASES = ["title", "home", "away", "summary"] as const
type Phase = (typeof PHASES)[number]

const PHASE_DURATIONS: Record<Phase, number> = {
  title: 3500,
  home: 7000,
  away: 7000,
  summary: 6000,
}

interface MatchIntroModalProps {
  open: boolean
  onClose: () => void
  match: Match
  home: Team
  away: Team
  homePlayers: Player[]
  awayPlayers: Player[]
  summary: MatchSummary | null
}

/**
 * Light-theme port of animation/BroadcastIntroModal.tsx: a fullscreen
 * FIFA-style broadcast intro that auto-advances through title -> home lineup
 * -> away lineup -> head-to-head summary. No framer-motion — phases remount a
 * keyed container so enter animations replay via tw-animate-css.
 */
export function MatchIntroModal({
  open,
  onClose,
  match,
  home,
  away,
  homePlayers,
  awayPlayers,
  summary,
}: MatchIntroModalProps) {
  const [phase, setPhase] = useState<Phase>("title")
  const [playing, setPlaying] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  useEffect(() => {
    if (!open) return
    setPhase("title")
    setPlaying(true)
    setSelectedPlayer(null)
  }, [open])

  useEffect(() => {
    if (!open || !playing) return
    // Respect prefers-reduced-motion: advance through phases almost instantly.
    const reduced = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const duration = reduced ? 150 : PHASE_DURATIONS[phase]
    const t = setTimeout(() => {
      const idx = PHASES.indexOf(phase)
      if (idx < PHASES.length - 1) setPhase(PHASES[idx + 1])
      else setPlaying(false)
    }, duration)
    return () => clearTimeout(t)
  }, [phase, playing, open])

  if (!open) return null

  const homeLineup = findLineup(match, "HOME")
  const awayLineup = findLineup(match, "AWAY")

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-3">
        <div className="text-sm font-black tracking-widest text-primary uppercase">
          ● Live Broadcast Intro
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPlaying(true)}>
            <Play className="size-4" /> Play
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setPlaying(false)}>
            <Pause className="size-4" /> Pause
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setPlaying(true)
              setPhase("home")
            }}
          >
            <SkipForward className="size-4" /> Skip to Lineups
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setPhase("title")
              setPlaying(true)
            }}
          >
            <RotateCcw className="size-4" /> Replay
          </Button>
          <Button size="sm" variant="destructive" onClick={onClose}>
            <X className="size-4" /> Close
          </Button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Keyed container remounts per phase so enter animations replay. */}
        <div key={phase} className="absolute inset-0 animate-in fade-in duration-500">
          {phase === "title" && (
            <TitlePhase match={match} home={home} away={away} />
          )}
          {phase === "home" && (
            <MatchLineupReveal
              team={home}
              lineup={homeLineup}
              players={homePlayers}
              title="Home Lineup"
              onPlayer={setSelectedPlayer}
            />
          )}
          {phase === "away" && (
            <MatchLineupReveal
              team={away}
              lineup={awayLineup}
              players={awayPlayers}
              title="Away Lineup"
              reverse
              onPlayer={setSelectedPlayer}
            />
          )}
          {phase === "summary" && (
            <SummaryPhase home={home} away={away} summary={summary} />
          )}
        </div>

        {selectedPlayer && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/20 backdrop-blur"
            onClick={() => setSelectedPlayer(null)}
          >
            <MatchPlayerCard
              player={selectedPlayer}
              team={selectedPlayer.teamId === home.id ? home : away}
            />
          </div>
        )}
      </div>

      {/* Phase indicator */}
      <div className="flex justify-center gap-2 border-t border-border bg-muted/60 py-3">
        {PHASES.map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            aria-label={`Go to ${p} phase`}
            className={`h-1.5 w-16 rounded-full transition-all ${
              p === phase ? "bg-primary shadow-[0_0_10px_var(--primary)]" : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function findLineup(match: Match, side: "HOME" | "AWAY"): FormationSlot[] {
  return match.matchTeams?.find((mt) => mt.side === side)?.positions ?? []
}

function TitlePhase({
  match,
  home,
  away,
}: {
  match: Match
  home: Team
  away: Team
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
      <FloatingParticles />
      <div className="animate-in slide-in-from-top-4 font-display text-sm font-bold tracking-[0.5em] text-primary uppercase">
        Futsal Pro League · Matchday
      </div>
      <div className="flex items-center gap-8 md:gap-20">
        <TeamCrest team={home} side="left" />
        <div className="animate-in zoom-in-0 font-display text-7xl font-black text-volt drop-shadow-[0_0_18px_rgba(0,0,0,0.4)] duration-500 md:text-9xl">
          VS
        </div>
        <TeamCrest team={away} side="right" />
      </div>
      <div className="animate-in slide-in-from-bottom-4 text-muted-foreground">
        {[match.venue, formatDateTime(match.scheduledAt)].filter(Boolean).join(" · ")}
      </div>
    </div>
  )
}

function TeamCrest({ team, side }: { team: Team; side: "left" | "right" }) {
  const accent = teamAccent(team)
  const logoUrl = resolveMediaUrl(team.logo)
  const initialsText = (team.name ?? "T")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className={`flex flex-col items-center gap-3 animate-in ${
        side === "left" ? "slide-in-from-left-1/2" : "slide-in-from-right-1/2"
      } duration-500`}
    >
      <div
        className="flex h-32 w-32 items-center justify-center rounded-full border-4 md:h-40 md:w-40"
        style={{
          borderColor: accent.primary,
          boxShadow: `0 0 60px ${accent.primary}55`,
          backgroundColor: `${accent.primary}22`,
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={team.name} className="h-24 w-24 md:h-32 md:w-32" />
        ) : (
          <span className="text-4xl font-black text-white md:text-5xl" style={{ textShadow: `0 0 20px ${accent.primary}` }}>
            {initialsText}
          </span>
        )}
      </div>
      <div className="text-center">
        <div className="text-2xl font-black tracking-wider uppercase md:text-3xl">
          {team.name}
        </div>
        <div className="text-xs tracking-widest uppercase" style={{ color: accent.primary }}>
          Futsal Club
        </div>
      </div>
    </div>
  )
}

function SummaryPhase({
  home,
  away,
  summary,
}: {
  home: Team
  away: Team
  summary: MatchSummary | null
}) {
  const homeAccent = teamAccent(home)
  const awayAccent = teamAccent(away)

  const wins = summary ? summary.home.wins : 0
  const awayWins = summary ? summary.away.wins : 0
  const gf = summary ? summary.home.goalsFor : 0
  const awayGf = summary ? summary.away.goalsFor : 0
  const ga = summary ? summary.home.goalsAgainst : 0
  const awayGa = summary ? summary.away.goalsAgainst : 0

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
      <div className="animate-in slide-in-from-top-4 text-xs font-black tracking-[0.5em] text-primary uppercase">
        Head to Head
      </div>

      <div className="grid w-full max-w-3xl grid-cols-3 gap-6">
        <TeamStack team={home} summary={summary?.home} align="left" />
        <div className="animate-in fade-in space-y-4 duration-700">
          <MatchStatsBar
            label="Wins"
            home={wins}
            away={awayWins}
            homeColor={homeAccent.primary}
            awayColor={awayAccent.primary}
          />
          <MatchStatsBar
            label="Goals For"
            home={gf}
            away={awayGf}
            homeColor={homeAccent.primary}
            awayColor={awayAccent.primary}
          />
          <MatchStatsBar
            label="Goals Against"
            home={ga}
            away={awayGa}
            homeColor={homeAccent.primary}
            awayColor={awayAccent.primary}
          />
        </div>
        <TeamStack team={away} summary={summary?.away} align="right" />
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-6">
        <TopScorerCard label="Home Top Scorer" top={summary?.topScorers.home ?? null} />
        <TopScorerCard label="Away Top Scorer" top={summary?.topScorers.away ?? null} />
      </div>
    </div>
  )
}

function TeamStack({
  team,
  summary,
  align,
}: {
  team: Team
  summary?: MatchSummary["home"]
  align: "left" | "right"
}) {
  const accent = teamAccent(team)
  const logoUrl = resolveMediaUrl(team.logo)
  const record = summary
    ? `${summary.wins}W · ${summary.draws}D · ${summary.losses}L`
    : "No finished matches"

  return (
    <div className={`flex flex-col items-center gap-2 ${align === "right" ? "md:items-end" : "md:items-start"}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={team.name} className="h-20 w-20" />
      ) : (
        <span
          className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-black text-white"
          style={{ backgroundColor: accent.primary }}
        >
          {initials(team.name)}
        </span>
      )}
      <div className="text-lg font-black">{team.name}</div>
      <div className="text-xs tracking-widest uppercase" style={{ color: accent.primary }}>
        {record}
      </div>
    </div>
  )
}

function TopScorerCard({
  label,
  top,
}: {
  label: string
  top: { player: Player; goals: number } | null
}) {
  return (
    <div className="rounded-xl border bg-card/60 p-4 backdrop-blur">
      <div className="text-xs tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
      {top ? (
        <>
          <div className="mt-1 text-xl font-black">{top.player.name}</div>
          <div className="text-primary">
            {top.goals} {top.goals === 1 ? "goal" : "goals"}
          </div>
        </>
      ) : (
        <div className="mt-1 text-sm text-muted-foreground">No goals recorded</div>
      )}
    </div>
  )
}

function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          className="absolute size-1 animate-[float_2.4s_ease-in-out_infinite] rounded-full bg-primary"
          style={{
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            boxShadow: "0 0 8px var(--primary)",
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${2 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  )
}

function formatDateTime(date: string): string {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d)
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
