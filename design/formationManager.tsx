import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FORMATIONS, type Match, type Player, type Team } from "@/lib/futsal-data";
import { useFutsal } from "@/lib/futsal-store";
import { PitchCanvas, PitchPlayer } from "./PitchCanvas";
import { toast } from "sonner";

export function FormationManager({ match }: { match: Match }) {
  const { teams, players, setMatches } = useFutsal();
  const [side, setSide] = useState<"home" | "away">("home");
  const team = teams.find((t) => t.id === (side === "home" ? match.homeId : match.awayId))!;
  const key = side === "home" ? "homeLineup" : "awayLineup";
  const formationKey = side === "home" ? "homeFormation" : "awayFormation";
  const lineup = match[key] ?? {};
  const roster = players.filter((p) => p.teamId === team.id);
  const [pickSlot, setPickSlot] = useState<string | null>(null);

  const updateMatch = (patch: Partial<Match>) => {
    setMatches((prev) => prev.map((m) => (m.id === match.id ? { ...m, ...patch } : m)));
  };

  const applyFormation = (name: string) => {
    const f = FORMATIONS.find((x) => x.name === name);
    if (!f) return;
    const currentIds = Object.values(lineup).map((v) => v.playerId);
    const newLineup: Record<string, { x: number; y: number; playerId: string | null }> = {};
    f.slots.forEach((s, i) => {
      newLineup[s.id] = { x: s.x, y: s.y, playerId: currentIds[i] ?? roster[i]?.id ?? null };
    });
    updateMatch({ [key]: newLineup, [formationKey]: name } as Partial<Match>);
  };

  const movePlayer = (slotId: string, x: number, y: number) => {
    updateMatch({ [key]: { ...lineup, [slotId]: { ...lineup[slotId], x, y } } } as Partial<Match>);
  };

  const setPlayer = (slotId: string, pid: string | null) => {
    updateMatch({ [key]: { ...lineup, [slotId]: { ...lineup[slotId], playerId: pid } } } as Partial<Match>);
    setPickSlot(null);
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" variant={side === "home" ? "default" : "outline"} onClick={() => setSide("home")}>
            Home · {teams.find((t) => t.id === match.homeId)?.short}
          </Button>
          <Button size="sm" variant={side === "away" ? "default" : "outline"} onClick={() => setSide("away")}>
            Away · {teams.find((t) => t.id === match.awayId)?.short}
          </Button>
        </div>
        <div data-pitch className="mx-auto max-w-md">
          <PitchCanvas>
            {Object.entries(lineup).map(([sid, s]) => {
              const p = s.playerId ? roster.find((r) => r.id === s.playerId) ?? null : null;
              return (
                <PitchPlayer
                  key={sid}
                  x={s.x}
                  y={s.y}
                  player={p}
                  team={team}
                  draggable
                  onClick={() => setPickSlot(sid)}
                  onDragEnd={(x, y) => movePlayer(sid, x, y)}
                />
              );
            })}
          </PitchCanvas>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 text-xs font-black uppercase tracking-widest text-primary">
            Preset Formation
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FORMATIONS.map((f) => (
              <Button
                key={f.name}
                size="sm"
                variant={match[formationKey] === f.name ? "default" : "outline"}
                onClick={() => applyFormation(f.name)}
              >
                {f.name}
              </Button>
            ))}
            <Button size="sm" variant="outline" onClick={() => toast.success("Custom free-form: drag players anywhere!")}>
              Custom Free-form
            </Button>
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-black uppercase tracking-widest text-primary">
            Roster ({roster.length})
          </div>
          <div className="space-y-1">
            {roster.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-2 py-1 text-sm"
              >
                <span className="text-white">#{p.jersey} {p.name}</span>
                <span className="text-xs text-primary">{p.position}</span>
              </div>
            ))}
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            toast.success("Formation saved!");
          }}
        >
          Save Formation
        </Button>
      </div>

      <Dialog open={!!pickSlot} onOpenChange={(o) => !o && setPickSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Player</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto">
            <Button variant="outline" size="sm" onClick={() => pickSlot && setPlayer(pickSlot, null)}>
              Clear slot
            </Button>
            {roster.map((p) => (
              <button
                key={p.id}
                onClick={() => pickSlot && setPlayer(pickSlot, p.id)}
                className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-2 text-left transition hover:border-primary hover:bg-primary/10"
              >
                <img src={p.photo} alt="" className="h-10 w-10 rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="font-bold text-white">#{p.jersey} {p.name}</div>
                  <div className="text-xs text-primary">{p.position} · Rating {p.rating}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
