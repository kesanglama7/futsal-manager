/**
 * Team accent colors. The Team model has no color fields, so we derive a
 * stable accent per team from a hash of its name — used for crest rings,
 * banner gradients, jersey chips, pitch markers and stat bars on the public
 * match pages. Decorative only; collisions across the 12-entry palette are
 * acceptable.
 */

export interface TeamAccent {
  primary: string
  secondary: string
}

// Hardcoded { primary, secondary } pairs (secondary is a darker twin).
const PALETTE: TeamAccent[] = [
  { primary: "#dc2626", secondary: "#7f1d1d" },
  { primary: "#ea580c", secondary: "#7c2d12" },
  { primary: "#ca8a04", secondary: "#713f12" },
  { primary: "#16a34a", secondary: "#14532d" },
  { primary: "#0891b2", secondary: "#164e63" },
  { primary: "#2563eb", secondary: "#1e3a8a" },
  { primary: "#7c3aed", secondary: "#4c1d95" },
  { primary: "#c026d3", secondary: "#701a75" },
  { primary: "#db2777", secondary: "#831843" },
  { primary: "#65a30d", secondary: "#3f6212" },
  { primary: "#0d9488", secondary: "#134e4a" },
  { primary: "#4338ca", secondary: "#312e81" },
]

const DEFAULT_ACCENT: TeamAccent = { primary: "#059669", secondary: "#065f46" }

/** FNV-1a 32-bit hash — deterministic, fast, stable across requests. */
function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function teamAccent(team: { id: number; name: string }): TeamAccent {
  const source = (team?.name ?? "").trim().toLowerCase()
  const key = source.length > 0 ? source : String(team?.id ?? 0)
  return PALETTE[hash(key) % PALETTE.length] ?? DEFAULT_ACCENT
}
