## Why

Phase 1 (`base-components`) built the shared shell and `apps/web/src/components/ui` against the *structure* of the approved design, but not its *visuals* — the components currently render in Tailwind's stock blue/gray palette with placeholder emoji icons, while `docs/Housing360 Portal.html` specifies a navy/teal brand with an Inter + Lora type pairing, layered card shadows, and a six-tone status badge system. Every screen built from here (My Clients is already proposed) inherits whatever these components look like, so the reskin has to land before screen work compounds the drift — and the token extraction is cheapest to do once, in one pass, with the design bundle open.

> Note: the design bundle's actual filename is `docs/Housing360 Portal.html` (with a space), not `docs/Housing360_Portal.html`. All references below use the real path.

## What Changes

**Token extraction into the theme (single source of truth)**

- Replace the placeholder palette in `apps/web/src/theme/tokens.ts` with the bundle's real values: navy `#0E2242`, teal `#4ACEB4` / deep teal `#1B6153`, light blue `#B7D1F4`, coral `#F47668`, gold `#F2A900`, plus the app background `#F4F6FA` and the grays actually used (`#5A6B85`, `#8494AC`, `#CBD5E1`, `#E1E7EF`, `#EDF1F7`, `#F1F4F9`, `#FAFBFD`, …). **BREAKING** for existing class names: `primary-*` currently resolves to Tailwind blue and is referenced across the shell, `ui/`, and `LoginPage`; those call sites all get rewritten in this change.
- Name values for their role, not their raw value — `border-subtle`, `surface-muted`, `surface-raised`, `text-muted`, `ink` — so no component reads as a hex lookup.
- Add the type scale the bundle actually uses: a second font family (Lora, for page titles), the weight set (400/500/600/700), the fractional-px size ramp, and the uppercase-label letter-spacing treatments.
- Add the radius ramp (3–20px, currently absent from the theme entirely), the three card/elevation shadows, and the spacing values the bundle uses that the current 6-step `xs…2xl` scale can't express.
- Load Inter and Lora as real webfonts (the bundle self-hosts them; `apps/web` currently only names Inter in the font stack without loading it).
- After this change, no file under `apps/web/src/components/ui` carries an inline hex, an arbitrary Tailwind value (`bg-[#…]`, `min-w-[10rem]`, `text-[10px]`), or a magic pixel number. Anything the bundle needs that isn't in the theme gets added to the theme.

**Component styling to visual parity**

- **Nav rail + top bar**: real SVG icon set (the bundle's `ICON` path map — the rail currently has no icons at all), the bundle's active-item treatment (teal-tinted background, navy label, weight shift), uppercase group headers, the pill-shaped Referrals count badge, the bottom org/user card, and an explicit collapse/expand transition. The top bar picks up the Lora page title + muted subtitle, the shadowed search card, and the bundle's icon idiom for the notifications bell and settings control (currently emoji).
- **`KpiTile`**: uppercase tracked label, large numeral, muted sub-line, card radius + layered shadow.
- **`StatusBadge`**: expand the tone vocabulary from the four placeholders (`urgent`/`warning`/`success`/`neutral`) to the bundle's six (`teal`/`navy`/`blue`/`gold`/`coral`/`quiet`), with the bundle's exact translucent-fill + dark-text pairs, and add a status-word → tone map covering every status word used across the batch-1 screens (My Clients, Cases, Assessments, Coordinated Entry) — `Enrolled`, `Awaiting referral`, `Intake started`, `Active`, `Pending review`, `Closed`, `High`, `Medium`, `Low`, `Completed`, `Due today`, `In progress`, `Overdue`, `Entry`, `Annual`, `Exit` — not just the four example categories.
- **`FilterChipRow`**: navy filled + lifted shadow when active, muted gray fill when inactive, plus the hover state.
- **`DataTable`**: tinted header row with uppercase tracked column labels, hairline row borders, row hover tint, tabular-numeric alignment for numeric columns — **plus two new states the component doesn't have today**: an empty-state row and a loading-state row.
- **`PageHeader`**: Lora title typography and the bundle's three-way button distinction (navy primary, teal secondary, outlined tertiary), replacing today's two-way primary/secondary split.
- **`StatusStepper`**: implement and style it now (currently a typed interface returning `null`) against the bundle's referral stepper — numbered nodes, connectors, and the `Rejected` terminal branch — even though no screen consumes it in this batch.
- **Login screen**: reskinned with the new tokens. The bundle has **no login mockup** — confirmed by searching it — so its current layout is kept and only re-tokenized; inventing a login design is explicitly out of scope and recorded as an open item.

**Verification**

- Extend `apps/web/ui-preview/` so each component's story can sit side by side with the matching section of the bundle (a per-story reference link/anchor plus stories for the new states and the full tone set).
- The tasks checklist ends with a manual visual pass against the bundle and a check that no hardcoded hex or pixel values survive in `apps/web/src/components/ui`.

**Explicitly out of scope**

- No new capability, no page-level screens, no route content. No changes to `apps/api`, `packages/*`, Redux slices, or routing.
- No behavior change to the `auth` capability — only the login screen's styling.
- Collapsed-rail styling has no bundle reference (the bundle's rail is a fixed 262px with no toggle); the existing collapse behavior is kept and styled to match the expanded rail's idiom. Recorded as an open item.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `shared-ui`: adds requirements for (1) the `StatusBadge` status-word → tone map covering every status word in use across the batch-1 screens, (2) `DataTable` empty-state and loading-state rows, and (3) the theme file being the only source of color, spacing, radius, shadow, and type values for `apps/web/src/components/ui`. Existing `shared-ui` requirements (nav rail, collapse, badge, top bar, content-area template, `KpiTile`, `FilterChipRow`, `PageHeader`, isolated preview) are unchanged in behavior; the `StatusStepper` requirement is upgraded from an interface reservation to a working, styled component.

_`auth` is not listed: its login screen is restyled, but no `auth` requirement changes._

## Impact

- **Theme**: `apps/web/src/theme/tokens.ts` (rewritten), `apps/web/tailwind.config.ts` (extended with `borderRadius`, `boxShadow`, `letterSpacing`, `fontWeight`, second font family), `apps/web/ui-preview/tailwind.config.ts` (already imports the real tokens — inherits automatically).
- **Fonts**: Inter + Lora added to `apps/web` (self-hosted or `@fontsource`), wired into `src/index.css` or equivalent.
- **Components restyled**: all of `apps/web/src/components/ui/**` and `apps/web/src/components/layout/**`, plus `apps/web/src/routes/pages/LoginPage.tsx`.
- **Components gaining behavior**: `DataTable` (new `isLoading` / `emptyMessage` props), `StatusStepper` (interface → implementation), `StatusBadge` (tone set widened 4 → 6, status-word map added under `ui/status/`), `PageHeader` (action `variant` widened to three), `navConfig.ts` (icon key per item).
- **Preview**: new/updated stories under `apps/web/ui-preview/stories/` and its `App.tsx` gallery.
- **Downstream**: the in-flight `my-clients-screen` change consumes `DataTable`, `FilterChipRow`, `PageHeader`, and `StatusBadge` — its call sites should use the widened `StatusBadge` tone set and the three-way `PageHeader` variants. Worth landing this change first, or reconciling at apply time.
- **No impact**: `apps/api`, `packages/types`, `packages/config`, Prisma schema, Redux slices, routing, auth behavior.
