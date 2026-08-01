# Design Tokens — Futsal Pro "Sport Broadcast"

**Philosophy**: Sport Broadcast — the visual language of live sports graphics (score bugs, lower-thirds, lineup reveals) applied as a design system.

**Implementation**: shadcn/ui v4 (base-luma) on Tailwind v4 CSS-first. Tokens live in `app/globals.css` (`:root` = dark default, `.light` = deferred light mode, `.dark` kept for legacy `dark:` utilities) + `@theme inline` maps them to Tailwind utilities.

## Color

Dark default (cool-green-tinted near-black to keep the pitch green cohesive):

| Token | Value (oklch) | Usage |
|---|---|---|
| `--background` | `0.14 0.012 160` | App background (deep pitch-black-green) |
| `--foreground` | `0.96 0.01 160` | Primary text |
| `--card` | `0.19 0.014 160` | Cards, panels |
| `--primary` | `0.72 0.15 160` | **Pitch green** — actions, active states, home identity |
| `--primary-foreground` | `0.16 0.02 160` | Text on primary |
| `--secondary` | `0.27 0.02 160` | Secondary actions |
| `--muted` | `0.25 0.016 160` | Subtle surfaces (inputs, wells) |
| `--muted-foreground` | `0.72 0.02 160` | Subdued text |
| `--accent` | `0.27 0.02 160` | Accent surface |
| `--destructive` | `0.7 0.19 25` | Danger / delete / red card |
| `--border` | `1 0 0 / 12%` | Borders |
| `--input` | `1 0 0 / 14%` | Input borders |
| `--ring` | `0.72 0.15 160` | Focus rings (pitch green) |
| `--sidebar-*` | derived | Control-room sidebar surfaces |

### Signal colors (new)

| Token | Value (oklch) | Meaning |
|---|---|---|
| `--live` | `0.78 0.16 75` | **Amber** — LIVE badge, live score, urgent |
| `--rating` | `0.84 0.17 95` | **Amber-gold** — player ratings |
| `--volt` | `0.88 0.2 125` | **Volt-lime** — action energy, highlights, hover |

Exposed as Tailwind utilities `live`, `rating`, `volt` (via `@theme` `--color-live/rating/volt`).

### Chart tokens
Reduced-saturation sport palette: green, lime, amber, red, blue.

## Typography

| Font | Face | Use |
|---|---|---|
| Body | **Inter** (`--font-sans`) | UI text, labels, paragraphs |
| Display | **Barlow Condensed** 500–900 (`--font-display`) | Scores, jerseys, ratings, brand, headers, lower-thirds |
| Mono | Geist Mono (`--font-mono`) | Code/numbers where tabular |

`--font-heading` now resolves to the display font, so `font-heading` / heading elements get the condensed face. Tailwind utilities: `font-display`, `font-heading`.

## Spacing

Tailwind v4 default scale (4px base), consistent with existing components. Radius base raised to `0.75rem` (`rounded-lg` default); existing `rounded-2xl/3xl/4xl` derive from it.

## Motion

| Token | Value |
|---|---|
| `--duration-instant` | 50ms |
| `--duration-fast` | 150ms |
| `--duration-normal` | 250ms |
| `--duration-slow` | 400ms |
| `--duration-slower` | 600ms |
| `--easing-default` | `cubic-bezier(0.4,0,0.2,1)` |
| `--easing-in` | `cubic-bezier(0.4,0,1,1)` |
| `--easing-out` | `cubic-bezier(0,0,0.2,1)` |
| `--easing-bounce` | `cubic-bezier(0.34,1.56,0.64,1)` |

Existing `tw-animate-css` (`animate-in/out`, `zoom-in-*`, `slide-in-from-*`) + custom `sweep`/`float` keyframes remain.

## Dark / Light

- **Dark is the default** (`class="dark"` on `<html>`; `:root` values ARE the dark palette).
- Light mode tokens are ready in `.light` (green-tinted light surfaces) for a future toggle — not wired yet (out of scope).
- `.dark` class block kept so existing `dark:` utility usages and `@custom-variant dark` still resolve identically.

## Deviations / Notes

- Named `--live`, `--rating`, `--volt` as brand signal tokens rather than generic `--status-*` because "live/rating/volt" are the app's actual semantic needs (futsal match center), and they map directly to broadcast vocabulary.
- Radius increased slightly (0.75rem) to soften the broadcast panels.
- Accent green kept desaturated-cool (`160` hue) so the warm amber/red signals pop against it — the classic broadcast "cool base, warm signal" rule.
