"use client"

/**
 * A futsal pitch rendered as a vertical (portrait) green field. Children are
 * absolutely positioned on top using percentage coordinates.
 *
 * Adapted from design/pitchCanvas.tsx and restyled for the app's light theme:
 * the pitch stays a dark green focal element with white linework, but the
 * purple glow/shadow from the reference is dropped.
 */
export function PitchCanvas({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-green-900"
      style={{
        background:
          "repeating-linear-gradient(0deg, #15803d 0 40px, #166534 40px 80px)",
      }}
    >
      {/* Outer boundary */}
      <div className="absolute inset-3 rounded-lg border-2 border-white/70" />
      {/* Center line */}
      <div className="absolute top-1/2 right-3 left-3 h-0.5 -translate-y-1/2 bg-white/70" />
      {/* Center circle */}
      <div className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
      <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      {/* Top goal area */}
      <div className="absolute top-3 left-1/2 h-16 w-40 -translate-x-1/2 rounded-b-full border-2 border-t-0 border-white/70" />
      {/* Bottom goal area */}
      <div className="absolute bottom-3 left-1/2 h-16 w-40 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-white/70" />
      {/* Goals */}
      <div className="absolute top-1 left-1/2 h-2 w-16 -translate-x-1/2 bg-white/80" />
      <div className="absolute bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 bg-white/80" />
      {children}
    </div>
  )
}
