# Design Brief: Futsal Pro — Full App Redesign

## Problem

The app works but feels like a generic admin template. The public match center — the customer-facing showcase — renders in a flat light theme that doesn't convey the drama of a live futsal fixture. The CMS and public pages share no strong visual identity; team colors are hash-derived accents bolted onto a neutral shell; the scoreboard and broadcast intro are the most exciting parts yet sit in the least exciting skin. There's no "this is a sport" signal in the base UI, and the admin experience offers no hierarchy to help a league operator move fast.

## Solution

Rebrand the entire surface as **"Futsal Pro — Live Match Broadcast"**. Dark-first, pitch-green + volt-lime signal system, condensed display typography for scores/branding, and broadcast-grade motion on the public match center. The CMS inherits the same tokens so admin feels like the control room behind the broadcast, not a separate product. Light mode stays available as a later toggle but is not the default.

## Experience Principles

1. **Broadcast energy over dashboard calm** — the match center should feel like a live show (dark, vivid signals, motion), while the CMS stays efficient but shares the same visual DNA.
2. **Signal color is meaning** — green = home/pitch identity, lime = live/action, amber = ratings/live badges, red = danger. Color carries information, never decoration.
3. **Numbers are the hero** — scores, jerseys, ratings are set in a condensed display face and sized to dominate their card.

## Aesthetic Direction

- **Philosophy**: "Sport Broadcast" — the visual language of live sports graphics (score bug, lower thirds, lineup reveal), applied as a design system.
- **Tone**: Authoritative, energetic, premium. Not playful, not clinical.
- **Reference points**: DAZN / ESPN match center, FIFA/eFootball broadcast intros, broadcast score bugs and lower-thirds, premium streaming dashboards (dark + one vivid accent).
- **Anti-references**: Generic SaaS admin templates, Material Design default, light "enterprise" dashboards, flat monotone neutral-only apps.

## Existing Patterns

- **Typography**: Inter + Geist Sans (body), Geist Mono. No condensed/display face. `--font-heading` is set to `var(--font-sans)` (i.e. not distinct).
- **Colors**: shadcn base-luma, `baseColor: "neutral"` — monochrome near-black `--primary`. Full oklch token set, light `:root` + `.dark` block. Chart tokens neutral.
- **Spacing**: Tailwind v4 default scale; radius tokens 0.625rem base scaling to `rounded-4xl`.
- **Components**: shadcn/ui v4 (Base UI), `components/ui/*` (button, card, dialog, sheet, field, input, sidebar, avatar, skeleton, tooltip, separator). No Tabs/Select/Table primitives (native elements + button groups used instead). Pitch components in `features/cms/components/formation/` (light-adapted green pitch) and public broadcast components in `features/public/components/matches/`.
- **Motion**: `tw-animate-css` (`animate-in/out`, `zoom-in-*`, `slide-in-from-*`) + custom `sweep`/`float` keyframes. No framer-motion.

## Component Inventory

| Component | Status | Notes |
| --------- | ------ | ----- |
| Design tokens (`globals.css`) | Modify | New dark-first sport palette, condensed font, semantic signal colors |
| `components/ui/*` (button, card, field, input, dialog, sheet, sidebar, avatar) | Modify | Re-theme via tokens; dark-first defaults |
| Sidebar / DashboardShell (CMS + user) | Modify | Dark control-room feel, signal accent on active item |
| Login / Register cards | Modify | Re-theme; brand mark + pitch-green energy |
| Public layout / nav (`app/matches/layout.tsx`) | Modify | Dark broadcast header, brand wordmark |
| Match list cards (`match-card.tsx`) | Modify | Scorebug-style header, condensed scores, live pulse |
| Match scoreboard (`app/matches/[matchId]/page.tsx`) | Modify | Broadcast scorebug treatment, condensed score |
| `match-intro-modal.tsx` | Modify | Already broadcast-style; align to new tokens/font |
| `match-lineup-reveal.tsx`, `match-lineup-card.tsx`, `match-pitch-player.tsx` | Modify | New accent system + condensed numbers |
| `match-stats.tsx`, `match-stats-bar.tsx`, `match-player-card.tsx`, `match-recap.tsx` | Modify | Re-theme |
| Pitch canvas (`pitch-canvas.tsx`) | Keep | Green pitch already on-brand |
| CMS team/roster/formation/match pages | Modify | Inherit tokens; hierarchy pass |
| New: theme toggle | New | Optional later; dark default now |

## Key Interactions

- **Live match**: live matches get a pulsing `LIVE` badge (amber/red) and the score renders in condensed display type, large.
- **Broadcast intro**: title → home lineup → away lineup → summary; players pop in staggered; clicking a player opens the player card overlay.
- **Navigation**: active sidebar item gets the signal accent; public nav is minimal (wordmark + Matches + Admin + Sign in).
- **Status transitions** (scheduled → live → finished) visibly change the scoreboard treatment (VS → live score → final).

## Responsive Behavior

- Public match center is mobile-first: scoreboard stacks vertically, lineup cards go single-column, intro is fullscreen at all sizes.
- CMS sidebar collapses to icon rail on mobile (already handled by shadcn Sidebar).
- Score uses `tabular-nums` + condensed font; large score scales down on narrow screens.

## Accessibility Requirements

- WCAG AA contrast for all text on dark surfaces (body ≥ 4.5:1, large text ≥ 3:1).
- Signal colors must not be the only differentiator (paired with icons/labels).
- Keyboard navigable (native elements kept), visible focus rings, `aria-selected`/`aria-disabled` preserved.
- Motion respects `prefers-reduced-motion` (intro can be skipped; animations are decorative).

## Out of Scope

- Light mode toggle implementation (tokens will support it; the toggle is deferred).
- Changing the data model, API routes, or business logic.
- Rebuilding the broadcast intro from scratch — it's re-skinned, not rewritten.
- Adding new pages/features beyond the redesign of existing ones.
- Full dark-mode screenshot QA pass (deferred to Design Review phase).
