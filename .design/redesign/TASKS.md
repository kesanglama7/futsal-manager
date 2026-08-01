# Build Tasks: Futsal Pro — Full App Redesign

Generated from: `.design/redesign/DESIGN_BRIEF.md`
Tokens: `.design/redesign/DESIGN_TOKENS.md` (already applied to `app/globals.css` + `app/layout.tsx`)
Aesthetic philosophy: **Sport Broadcast**

## Foundation (done)
- [x] **Design tokens in globals.css**: dark-first sport palette (green/volt/amber signals), display font mapping, motion tokens. _Reuses: shadcn base-luma structure._
- [x] **Barlow Condensed display font** registered in `app/layout.tsx`, `class="dark"` default.

## Shared Primitives
- [x] **Theme-consistency sweep of `components/ui/*`**: verify button/card/field/input/dialog/sheet/sidebar/avatar render correctly on the dark palette; fix any hardcoded light assumptions. _Modifies: existing ui components._ (Scrims raised to bg-black/50; rest token-driven.)
- [x] **Status badge re-theme** (`features/cms/components/matches/match-status.tsx`): update MATCH_STATUS_STYLES to dark sport palette — LIVE uses `--live` amber, FINISHED muted, SCHEDULED subtle. _Modifies: existing._
- [x] **Public nav/layout re-theme** (`app/matches/layout.tsx`): dark broadcast header, wordmark in `font-display`, active link uses pitch-green. _Modifies: existing._

## Public Showcase (customer-facing)
- [x] **Match card scorebug** (`match-card.tsx`): condensed `font-display` score, LIVE pulse, signal-colored status chip, dark panel. _Modifies: existing._
- [x] **Match scoreboard** (`app/matches/[matchId]/page.tsx` header): broadcast scorebug treatment — large condensed score, home/away crests, venue/date, LIVE pulse when live. _Modifies: existing._
- [x] **Broadcast intro alignment** (`match-intro-modal.tsx`, `match-lineup-reveal.tsx`, `match-pitch-player.tsx`): update VS, crests, lineup rows, jersey chips, lower-third "Starting Six", player markers to the new tokens + `font-display` numbers; keep the sweep/float motion. _Modifies: existing._
- [x] **Public lineups/stats/recap re-theme** (`match-lineup-card.tsx`, `match-stats.tsx`, `match-stats-bar.tsx`, `match-player-card.tsx`, `match-recap.tsx`): dark cards, condensed scores/ratings, accent bars, amber rating badges. _Modifies: existing._
- [x] **Matches list page polish** (`app/matches/page.tsx`): section headings in `font-heading`, Live section emphasis. _Modifies: existing._

## CMS (admin control room)
- [x] **CMS shell re-theme** (`features/cms/components/app-sidebar.tsx` + dashboard shell): control-room feel — sidebar active item in pitch-green, header dark, muted borders. _Modifies: existing._
- [x] **Team management re-theme** (`app/cms/teams/*`, `teams-list.tsx`, `team-form.tsx`): dark cards, logo rendering on dark, condensed counts. _Modifies: existing._
- [x] **Roster re-theme** (`app/cms/teams/[teamId]/page.tsx`, `roster-list.tsx`, `player-form.tsx`): dark rows, amber rating badges, stat inputs on dark. _Modifies: existing._
- [x] **Formation editor re-theme** (`formations/page.tsx`, `formation-editor.tsx`, `player-picker.tsx`): dark pitch surroundings, condensed slot numbers, picker on dark. _Modifies: existing._
- [x] **Match management re-theme** (`app/cms/matches/*`, `matches-list.tsx`, `match-form.tsx`, `match-lineup-editor.tsx`, `match-goals-panel.tsx`): dark cards, scorebug-list, live accent, goals feed on dark. _Modifies: existing._

## Auth
- [x] **Login/register re-theme** (`app/(auth)/*`, `login-form.tsx`, `register-form.tsx`): dark broadcast card, brand wordmark in display font, green primary action. _Modifies: existing._

## Interactions & Polish
- [x] **Live-state treatment**: pulsing LIVE indicator (amber) on match cards + scoreboards; `prefers-reduced-motion` respected. _Modifies: match-card, scoreboard, status badge._
- [x] **Focus/contrast pass**: WCAG AA on dark for body/large text; visible focus rings using `--ring`. _Modifies: as needed._ (Ring token = pitch green; signal colors meet contrast on dark.)

## Review
- [ ] **Design review**: run `/design-review` against the brief (screenshots at 375/768/1280 + dark).
