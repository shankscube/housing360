## Context

`docs/Housing360 Portal.html` (note: real filename has a space, not an underscore) is a 758 KB self-contained bundle. Its readable source lives in the `__bundler/template` script block — once JSON-unescaped, it is plain markup with **inline `style` attributes**, plus a small JS block defining the design constants. That means every value in this change is directly readable; nothing has to be eyeballed from a screenshot. The relevant constants:

```js
const NAVY='#0E2242', TEAL='#4ACEB4', TEAL_D='#1B6153',
      LBLUE='#B7D1F4', CORAL='#F47668', GOLD='#F2A900';

const badge = (bg, fg) => `…padding:5px 11px;border-radius:9px;font-size:11.5px;font-weight:600;background:${bg};color:${fg}`;
const TONE = {
  teal:  badge('rgba(74,206,180,0.16)', '#1B6153'),
  navy:  badge('rgba(14,34,66,0.07)',   '#0E2242'),
  blue:  badge('rgba(183,209,244,0.42)','#22477A'),
  gold:  badge('rgba(242,169,0,0.16)',  '#6B4E00'),
  coral: badge('rgba(244,118,104,0.15)','#AB4234'),
  quiet: badge('#F0F3F8',               '#55657E'),
};
const chip = (on) => `…padding:8px 15px;border-radius:12px;font-size:12.5px;font-weight:600;background:${on?NAVY:'#F2F5FA'};color:${on?'#fff':'#55657E'};box-shadow:${on?'0 8px 18px -10px rgba(14,34,66,0.7)':'none'}`;
const ICON = { home:'M3 10.5 12 3l9 7.5V21H3z', users:'…', cases:'…', assess:'…', ce:'…', dir:'…', refer:'…', shelter:'…', insight:'…', tools:'…' };
```

Current state in `apps/web`: `src/theme/tokens.ts` carries a placeholder Tailwind-default blue/gray palette with **no** radius, shadow, letter-spacing, font-weight, or second font family; `tailwind.config.ts` extends only `colors`/`spacing`/`fontFamily`/`fontSize`. Components under `src/components/ui` are structurally right but visually generic, and three of them already carry arbitrary values (`min-w-[10rem]` in `KpiTile`, `text-[10px]` in `TopBar`'s badge). The nav rail has no icons at all — labels only, with `«`/`»` as the collapse control. `StatusStepper` is a typed interface returning `null`.

Constraint from the repo's standing rules: all of this stays in `apps/web` — no `packages/ui`. The isolated preview stays the hand-rolled `apps/web/ui-preview/` gallery, not Storybook.

## Goals / Non-Goals

**Goals:**

- One extraction pass over the bundle that lands every color, type, spacing, radius, shadow, and icon value in `apps/web/src/theme/tokens.ts` + `tailwind.config.ts`, so later screen work never re-reads the bundle for a value.
- Visual parity for the shell (`components/layout/`) and every component in `components/ui/` against the bundle.
- A `StatusBadge` that resolves *status words* — the real ones from My Clients, Cases, Assessments, and Coordinated Entry — to tones, so no screen invents a mapping.
- `DataTable` empty and loading states, so screens don't each hand-roll them.
- A preview gallery that makes "does this match?" a side-by-side check rather than a memory exercise.

**Non-Goals:**

- No screen/route content, no new capability, no API or data work.
- No dark mode, no responsive breakpoint system beyond what the bundle's flex/grid wrapping already implies, no animation system beyond the rail's collapse transition.
- No design invention where the bundle is silent (login screen, collapsed rail) — those are re-tokenized only and recorded as open questions.
- No behavior change to `auth`.

## Decisions

### 1. Replace the palette wholesale; name tokens by role, not by hue-number

The existing `primary`/`neutral` ramps are Tailwind stock and wrong for this brand. Keeping them and adding a parallel `brand.*` set would leave two competing palettes and guarantee drift.

Token shape:

```ts
export const colors = {
  ink:        '#0E2242',  // NAVY — primary text, primary button fill, active nav label
  inkHover:   '#16305C',  // navy button hover
  teal:       '#4ACEB4',  // TEAL — secondary action, active step, accent
  tealHover:  '#3FBCA3',
  tealDeep:   '#1B6153',  // TEAL_D — teal-on-tint text, link hover
  blueSoft:   '#B7D1F4',  // LBLUE — chart bars, on-navy body text
  blueDeep:   '#22477A',  // blue-tone badge text
  coral:      '#F47668',  // CORAL
  coralDeep:  '#AB4234',
  gold:       '#F2A900',  // GOLD
  goldDeep:   '#6B4E00',
  surface:        '#FFFFFF',  // cards, nav rail, top-bar controls
  surfaceApp:     '#F4F6FA',  // page background, inset panels
  surfaceMuted:   '#FAFBFD',  // table header band, row hover
  surfaceSubtle:  '#F0F3F8',  // quiet badge fill, inactive chip (#F2F5FA rounds here)
  textMuted:      '#5A6B85',  // the single most-used color in the bundle (85 uses)
  textFaint:      '#8494AC',  // disabled step label, inactive stepper text
  borderSubtle:   '#F1F4F9',  // card section dividers
  borderRow:      '#EDF1F7',  // table row hairlines (#F4F6FA also used — rounds here)
  borderStrong:   '#CBD5E1',  // outlined button border, scrollbar thumb
  borderStep:     '#E1E7EF',  // stepper connectors, inactive step fill (#EEF1F4 rounds here)
};
```

Every name says what it is for. `border-subtle` / `surface-muted` are exactly the naming style the request asked for. Semantic aliases used by the badge map (`statusUrgent` etc.) are deliberately **not** added — the bundle's tone vocabulary is six tones, not four severities (see decision 4), and a second aliasing layer would obscure which tone a screen actually gets.

*Alternative considered*: keep numeric ramps (`navy-50…900`) generated from the brand hues. Rejected — the bundle uses a specific, small, non-generated set; a generated ramp would offer 40 shades of which 8 are real, inviting off-design choices.

**Breaking**: `bg-primary-600`, `text-neutral-500`, `border-neutral-200`, etc. appear across `components/layout/`, `components/ui/`, and `LoginPage.tsx`. All are rewritten in this change; nothing outside `apps/web/src` references them.

### 2. Quantize the fractional type scale; keep one display face

The bundle uses 23 distinct font sizes, several fractional (`10.5`, `11.5`, `12.5`, `12.8`, `13.2`, `13.5`). Reproducing all 23 would be a scale in name only. Decision: quantize to a named ramp in `rem`, rounding each bundle value to the nearest step, and document the mapping in a comment in `tokens.ts`:

| token | rem | px | bundle sources |
|---|---|---|---|
| `2xs` | 0.625 | 10 | 10, 10.5 (uppercase group headers, table column labels) |
| `xs` | 0.6875 | 11 | 11, 11.5 (badges, sub-labels) |
| `sm` | 0.78125 | 12.5 | 12, 12.5, 12.8 (body small, chips, muted sub-lines) |
| `base` | 0.8125 | 13 | 13, 13.2, 13.5 (table cells, nav items, buttons) |
| `md` | 0.875 | 14 | 14, 15 |
| `lg` | 1.0625 | 17 | 16, 17, 18 (card titles) |
| `xl` | 1.3125 | 21 | 19, 21 |
| `2xl` | 1.5 | 24 | 23, 24 |
| `3xl` | 1.6875 | 27 | 27 (page title) |
| `4xl` | 1.875 | 30 | 30 |
| `5xl` | 2.25 | 36 | 36 (KPI numerals) |
| `6xl` | 3.25 | 52 | 52 (hero stat) |

This scale is **base-13px, not base-16px** — that is what the bundle is, and forcing it onto a 16px base would change every screen's density.

Two families: `sans: Inter` (body, controls, everything) and `display: Lora` (page titles only — 41 uses in the bundle, all headings). Weights 400/500/600/700. Letter-spacing tokens: `tight: -0.4px` (page title), `wide: 0.9px`, `wider: 1.2px` (uppercase labels — the bundle uses 0.6/0.9/1/1.2/1.3, quantized to three).

**Fonts are self-hosted via `@fontsource-variable/inter` + `@fontsource/lora`**, imported in `src/index.css`. *Alternative*: Google Fonts `<link>` (what the bundle's preconnect hints imply). Rejected — an external request on every page load, and the bundle itself ends up self-hosting the woff2 files anyway.

### 3. Radius, shadow, and spacing get real ramps

Radius — the bundle uses 12 values (3–20px); quantized to six: `xs:4px` (score bars), `sm:7px` (small buttons), `md:9px` (buttons, badges), `lg:12px` (chips, search card, nav items), `xl:14px` (user card), `2xl:18px` (content cards), `full:9999px` (dots, pill counts, avatars).

Shadow — three named levels, verbatim from the bundle (no quantizing; these are signatures):

```
card:    0 1px 2px rgba(14,34,66,0.05), 0 10px 30px -16px rgba(14,34,66,0.22)
control: 0 1px 2px rgba(14,34,66,0.05), 0 8px 22px -16px rgba(14,34,66,0.30)
lifted:  0 8px 18px -10px rgba(14,34,66,0.70)   // active filter chip
panel:   0 18px 40px -22px rgba(14,34,66,0.55)  // navy alert panel
```

Spacing — the current 6-step `xs…2xl` scale can't express the bundle's padding pairs (`11px 14px`, `13px 20px`, `16px 20px`, `20px 22px`, `26px 32px`). Decision: keep the named steps and **add** a numeric sub-scale in the same units the bundle uses, so `px-5 py-3.5` style utilities resolve to real design values rather than Tailwind defaults. `tailwind.config.ts` currently *replaces* nothing (it uses `extend`), so Tailwind's default numeric spacing is still live and off-design; this change overrides the numeric scale with the bundle's values.

### 4. Six tones, and a separate status-word → tone map

The Phase-1 placeholder `StatusTone = 'urgent'|'warning'|'success'|'neutral'` cannot express the bundle, which distinguishes `navy` (neutral-emphatic: "Entry", "Internal", "Enrolled" referral) from `quiet` (neutral-deemphasized: "Closed", "Exit") and `blue` (informational-active: "Intake started", "In progress", "New") from `gold` (waiting/warning). Collapsing those would lose real signal on the Cases and Assessments tables.

Decision: `StatusTone = 'teal'|'navy'|'blue'|'gold'|'coral'|'quiet'`, with `STATUS_COLOR_MAP` holding the exact fill/text pair per tone, and a **separate** `STATUS_TONE_BY_LABEL: Record<string, StatusTone>` in the same `ui/status/` folder covering every status word used across the batch-1 screens, taken from the bundle's own data:

| tone | status words |
|---|---|
| `teal` | Enrolled *(program)*, Active, Completed, Approved |
| `navy` | Entry, Internal, Enrolled *(referral)* |
| `blue` | Intake started, In progress, Pending review, New |
| `gold` | Awaiting referral, Due today, In Review, Medium |
| `coral` | Overdue, Rejected, High |
| `quiet` | Closed, Exit, Low, Annual → *see note* |

Note the two genuine conflicts the bundle contains: **"Enrolled"** is `teal` on My Clients (program status) and `navy` on Referrals (stage), and **"Annual"** is `blue` while **"Exit"** is `quiet` in the same Assessments column. Decision: `StatusBadge` keeps an explicit `tone` prop that **overrides** the label lookup, and the lookup is the default. Screens with a domain-specific reading pass `tone`; everything else gets the map. This keeps one central map without pretending a word has exactly one meaning app-wide.

Lookup is case-insensitive on a normalized key; an unknown word resolves to `quiet` rather than throwing — a missing badge color must never break a screen.

*Alternative considered*: keep four severity tones and map the bundle's six onto them. Rejected — it discards the navy/quiet and blue/gold distinctions the tables rely on.

**Translucent fills**: the bundle's badge fills are `rgba(...)` over light surfaces. Expressed as Tailwind opacity modifiers on the brand color (`bg-teal/15`, `bg-ink/[0.07]`→`bg-ink/5`… ) the alphas would need rounding and would read as magic numbers at the call site. Decision: put the composited pair in `STATUS_COLOR_MAP` as *token class names* built from colors declared in the theme — i.e. add `statusFill` entries to `colors` (`tealTint`, `navyTint`, `blueTint`, `goldTint`, `coralTint`, plus `surfaceSubtle` for quiet) computed once against the white/`#FAFBFD` surfaces the badges actually sit on. The map stays a flat, reviewable table of `{ background, text }` class pairs, and the "no magic values" check is a straight grep.

### 5. Icons: copy the bundle's path map, no icon library

New `apps/web/src/components/ui/icons/` — a typed `Icon` component plus `iconPaths.ts` transcribed from the bundle's `ICON` map, extended with the handful the shell needs that the bundle draws inline (search, bell, gear, chevron, alert-triangle). `navConfig.ts` gains an `icon: IconName` per item.

*Alternative*: `lucide-react`. Rejected — a new runtime dependency to approximate paths we already have verbatim, and lucide's stroke geometry differs subtly from the bundle's (which matters precisely because this change is about parity).

`Icon` is generic and screen-agnostic, so `components/ui/` is its correct home per the repo's standing rule.

### 6. `DataTable` states as props, not slots

`isLoading?: boolean` and `emptyMessage?: string` (default `"No records found."`). Both render a single `<td colSpan={columnCount}>` row styled as a muted, centered cell; `isLoading` wins when both would apply, because "loading" is the more accurate statement while data is in flight. Row count for the loading state is one shimmer-free row with the message `"Loading…"` — no skeleton system in this change.

*Alternative*: `renderEmpty` / `renderLoading` render props. Rejected as premature; props can widen to slots later without breaking call sites.

### 7. `StatusStepper`: linear chain + terminal branches

The bundle's referral stepper is `New → In Review → Approved → Enrolled` plus a fifth `✕ Rejected` node rendered after the chain, teal when reached, `#E1E7EF`/`#8494AC` when not, coral when it is the active terminal. The Phase-1 interface already has `branches?: StatusStepperStage[]` — keep it as-is (no interface change) and render branches as additional terminal nodes after the linear stages, which is exactly what the bundle does. Connector lines fill teal up to the current stage.

Coordinated Entry's 4-step wizard uses a *different* visual (tab-style, bottom border) and is a screen-level concern, not this component.

### 8. Enforcing "no hardcoded values"

Verified by a grep in the tasks checklist over `apps/web/src/components/ui` and `apps/web/src/components/layout` for `#[0-9a-fA-F]{3,6}`, `\[[0-9.]+(px|rem)\]`, and `-\[#`. Kept as a checklist step rather than a new ESLint rule: `eslint-plugin-tailwindcss`'s arbitrary-value rule would also need per-rule tuning and a new dev dependency, which is disproportionate for a directory this small. If the surface grows, promote it to a lint rule in `packages/config` alongside the existing `boundaries.js`.

### 9. Preview gallery gains reference anchors

Each story gets a short "bundle reference" line naming the screen and section it mirrors (e.g. *"My Clients → table header"*), plus a link that opens `docs/Housing360 Portal.html`. Vite serves the repo root fine via a static alias; if that proves fiddly, the fallback is the path as copyable text — the requirement is that the reviewer knows *which* part of the bundle to compare against, not that the file opens in-frame.

## Risks / Trade-offs

- **Palette rename breaks every existing call site at once** → All affected files are in `apps/web/src` and are being restyled in this change anyway; `npm run build` (`tsc -b`) won't catch a stale Tailwind class, so the tasks checklist includes a grep for the retired `primary-`/`neutral-` prefixes after the sweep.
- **The in-flight `my-clients-screen` change assumes the old `StatusBadge` tone set and two-way `PageHeader` variants** → Land this change first if possible; otherwise its `StatusBadge` call sites need the new tone names. Flagged in the proposal's Impact section.
- **13px base type scale conflicts with Tailwind's 16px defaults** → Any utility not covered by the overridden scale silently falls back to Tailwind's, producing off-design sizes. Mitigated by overriding (not extending) `fontSize`, `borderRadius`, and the numeric `spacing` scale, so an off-design value is a build-visible missing class rather than a plausible-looking wrong one.
- **Quantizing 23 sizes to 12 and 12 radii to 6 will not be pixel-identical** → Accepted deliberately: a real scale beats a transcription. The manual visual pass is the check that no quantization reads as wrong.
- **Two components change shape, not just style** (`DataTable` gains props, `StatusBadge` gains a label map and loses its old tone names) → Both are additive except the tone rename; no consumer outside this change exists yet.
- **Styling `StatusStepper` with no consumer means no real-data validation** → Mitigated by a preview story covering all five stage states including the rejected branch; accepted per the request's reasoning that doing it later against a stale visual memory is worse.

## Migration Plan

Not applicable — no data, API, or persisted state changes. The change is a working-tree reskin; rollback is `git revert`.

## Open Questions

1. **The bundle has no login screen.** Searching it for `login` / `sign in` / `password` returns nothing. The Phase-1 login layout is kept and only re-tokenized (navy submit button, card shadow, Lora heading). Whether the real login gets a branded split-panel/hero treatment is a design decision for someone else to make — flagged, not invented.
2. **The bundle's nav rail does not collapse.** It is a fixed `262px` aside with no toggle, so the collapsed (icon-only) state has no reference. The existing collapse behavior is kept, and the collapsed rail is styled by reducing the expanded rail's own idiom (icons centered, labels hidden, badge dropped). Needs sign-off that this reads correctly.
3. **The bundle's top bar has no notifications bell or settings icon** — it has the search card and an "APR season · 14 days" status pill instead. The `shared-ui` spec requires the bell and settings control, so they stay; they are restyled into the bundle's control idiom (white card, `control` shadow, `lg` radius) with real SVG icons replacing the current emoji. Whether the APR-season pill should also be adopted is left open — it is arguably a real product feature, not a styling detail.
4. **Page subtitles.** The bundle's header renders a title *and* a muted subtitle per screen; `ContentAreaTemplate`/`PageHeader` currently model only a title. A `subtitle?: string` prop is the obvious addition, but it edges toward layout behavior rather than styling — included as a styling-adjacent prop here, callable out if that reads as scope creep.

### Resolved during implementation

- **(1) Login screen** — confirmed: the bundle contains no login markup. The Phase-1 layout was re-tokenized only (Lora heading, card + `card` shadow, uppercase field labels, navy submit). Still open as a design decision.
- **(2) Collapsed rail** — implemented as planned (72px, icons centered, labels/group headers/badge hidden, avatar only, chevron flips). See the new item 6 below for a usability consequence that needs a decision.
- **(3) Top bar** — bell and settings kept per spec, restyled as white `control`-shadow cards with real SVG icons. The bundle's "APR season · 14 days" pill was **not** adopted; it reads as a product feature, not styling.
- **(4) Page subtitle** — `subtitle?: string` added to `PageHeader` and passed through `ContentAreaTemplate`. Kept.

### Raised by the visual pass

5. **The nav rail wordmark is a bundle asset, not type.** The bundle's rail opens with a Housing360 logo image, not a text wordmark. The asset was extracted from the bundle's manifest (a 19 KB PNG) to `apps/web/public/housing360-logo.png` and is rendered at the bundle's 154px width. If there is a canonical brand asset elsewhere (SVG, higher resolution, dark variant), it should replace this one.
6. **Collapsing the rail hides Insights and Tools entirely.** Those two nav entries are group headers with no route of their own, so at icon-only width they disappear along with their children — a user who collapses the rail cannot reach Data Quality, Reports, Data Import or Training at all. This is pre-existing behavior made more visible by the restyle, and the bundle offers no reference (its rail does not collapse). Needs a decision: give group headers a collapsed-state affordance (icon + flyout), or promote them to routable items.
7. **`KpiTile` has no sparkline.** The bundle's KPI tiles carry a small trend sparkline under the sub-line. It is not in the `shared-ui` KpiTile requirement (large number, label, optional muted sub-line) or in this change's task list, so it was left out rather than added unscoped. Worth a follow-up if the tiles are meant to read as the bundle's do.
8. **The nav rail's structure differs from the bundle's.** The bundle renders "Referrals" and "Shelter Management" as uppercase *group headers*, and puts count badges on Assessments and Data Quality. The `shared-ui` spec defines them as routable items with a Referrals badge, and this change does not alter requirements — so the spec's structure was kept. If the bundle is the intended structure, that is a spec change, not a styling one.
