"use client"

import { useEffect, useState } from "react"
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react"

import { resolveMediaUrl } from "@/lib/media"
import type {
  Match,
  MatchEvent,
  MatchTeam,
  Player,
  Team,
} from "@/features/cms/types/cms-types"
import { teamAccent } from "@/features/public/components/matches/team-accent"
import { MatchLineupReveal } from "@/features/public/components/matches/match-lineup-reveal"
import { MatchPlayerCard } from "@/features/public/components/matches/match-player-card"
import { MatchResultSummary } from "@/features/public/components/matches/match-result-summary"
import { Button } from "@/components/ui/button"

const PHASES = ["title", "home", "away", "result"] as const
type Phase = (typeof PHASES)[number]

const PHASE_DURATIONS: Record<Phase, number> = {
  title: 3500,
  home: 7000,
  away: 7000,
  result: 8000,
}

interface MatchIntroModalProps {
  open: boolean
  onClose: () => void
  match: Match
  home: Team
  away: Team
  homePlayers: Player[]
  awayPlayers: Player[]
  events?: MatchEvent[]
}

/**
 * Light-theme port of animation/BroadcastIntroModal.tsx: a fullscreen
 * FIFA-style broadcast intro that auto-advances through title -> home lineup
 * -> away lineup -> result (score, goalscorers, MVP). No framer-motion —
 * phases remount a keyed container so enter animations replay via tw-animate-css.
 */
export function MatchIntroModal({
  open,
  onClose,
  match,
  home,
  away,
  homePlayers,
  awayPlayers,
  events = [],
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
          {/* <Button size="sm" variant="secondary" onClick={() => setPlaying(true)}>
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
          </Button> */}
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
              lineup={homeLineup?.positions ?? []}
              bench={homeLineup?.bench ?? []}
              players={homePlayers}
              title="Home Lineup"
              onPlayer={setSelectedPlayer}
            />
          )}
          {phase === "away" && (
            <MatchLineupReveal
              team={away}
              lineup={awayLineup?.positions ?? []}
              bench={awayLineup?.bench ?? []}
              players={awayPlayers}
              title="Away Lineup"
              reverse
              onPlayer={setSelectedPlayer}
            />
          )}
          {phase === "result" && (
            <MatchResultSummary
              match={match}
              home={home}
              away={away}
              events={events}
            />
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

function findLineup(match: Match, side: "HOME" | "AWAY"): MatchTeam | undefined {
  return match.matchTeams?.find((mt) => mt.side === side)
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
      <div className="flex items-center gap-4 sm:gap-8 md:gap-20">
        <TeamCrest team={home} side="left" />
        <div className="animate-in zoom-in-0 font-display text-5xl font-black text-volt drop-shadow-[0_0_18px_rgba(0,0,0,0.4)] duration-500 sm:text-7xl md:text-9xl">
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
        className="flex h-20 w-20 items-center justify-center rounded-full border-4 sm:h-32 sm:w-32 md:h-40 md:w-40"
        style={{
          borderColor: accent.primary,
          boxShadow: `0 0 60px ${accent.primary}55`,
          backgroundColor: `${accent.primary}22`,
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={team.name} className="h-14 w-14 sm:h-24 sm:w-24 md:h-32 md:w-32" />
        ) : (
          <span className="text-2xl font-black text-white sm:text-4xl md:text-5xl" style={{ textShadow: `0 0 20px ${accent.primary}` }}>
            {initialsText}
          </span>
        )}
      </div>
      <div className="text-center">
        <div className="max-w-28 truncate text-xl font-black tracking-wider uppercase sm:max-w-none sm:text-2xl md:text-3xl">
          {team.name}
        </div>
      </div>
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
