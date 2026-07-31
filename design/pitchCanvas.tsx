import { motion } from "framer-motion";
import type { Player, Team } from "@/lib/futsal-data";

export function PitchCanvas({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-primary/30 shadow-[0_0_60px_-20px_var(--primary)] ${className}`}
      style={{
        background:
          "repeating-linear-gradient(0deg, #14532d 0 40px, #166534 40px 80px)",
      }}
    >
      {/* Outer boundary */}
      <div className="absolute inset-3 rounded-lg border-2 border-white/70" />
      {/* Center line */}
      <div className="absolute left-3 right-3 top-1/2 h-0.5 -translate-y-1/2 bg-white/70" />
      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      {/* Top goal area */}
      <div className="absolute left-1/2 top-3 h-16 w-40 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-white/70" />
      {/* Bottom goal area */}
      <div className="absolute bottom-3 left-1/2 h-16 w-40 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-white/70" />
      {/* Goals */}
      <div className="absolute left-1/2 top-1 h-2 w-16 -translate-x-1/2 bg-white/80" />
      <div className="absolute bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 bg-white/80" />
      {children}
    </div>
  );
}

export function PitchPlayer({
  x,
  y,
  player,
  team,
  onClick,
  onDragEnd,
  draggable = false,
  delay = 0,
  size = "md",
}: {
  x: number;
  y: number;
  player?: Player | null;
  team?: Team;
  onClick?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  draggable?: boolean;
  delay?: number;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 220, damping: 18 }}
      drag={draggable}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        if (!onDragEnd) return;
        const parent = (info.point && document.elementFromPoint(info.point.x, info.point.y)) as HTMLElement | null;
        const pitch = parent?.closest("[data-pitch]") as HTMLElement | null;
        if (pitch) {
          const rect = pitch.getBoundingClientRect();
          const nx = ((info.point.x - rect.left) / rect.width) * 100;
          const ny = ((info.point.y - rect.top) / rect.height) * 100;
          onDragEnd(Math.max(5, Math.min(95, nx)), Math.max(5, Math.min(95, ny)));
        }
      }}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
    >
      <div
        className={`${dim} rounded-full border-2 flex items-center justify-center font-black text-white shadow-lg`}
        style={{
          backgroundColor: team?.primary ?? "#22c55e",
          borderColor: team?.secondary ?? "#0f172a",
          boxShadow: `0 0 20px ${team?.primary ?? "#22c55e"}80`,
        }}
      >
        {player ? player.jersey : "+"}
      </div>
      {player && (
        <div className="pointer-events-none mt-1 whitespace-nowrap text-center text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {player.name.split(" ").slice(-1)[0]}
        </div>
      )}
    </motion.div>
  );
}
