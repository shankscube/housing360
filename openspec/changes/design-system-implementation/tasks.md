## 1. Extract the design bundle

- [x] 1.1 Unpack `docs/Housing360 Portal.html`'s readable source into a scratch file (JSON-unescape the `<script type="__bundler/template">` block) so the inline-style markup and the `NAVY`/`TEAL`/`TONE`/`chip`/`ICON` constants can be read directly. Do not commit the scratch file.
- [x] 1.2 Record the full value inventory from the unpacked source: distinct hex colors, font sizes, font weights, letter-spacings, border radii, box-shadows, and the padding pairs used by cards, table cells, buttons, chips, and nav items.
- [x] 1.3 Confirm the two font families in use (Inter for everything, Lora for page titles) and which elements use each.

## 2. Theme tokens

- [x] 2.1 Rewrite `apps/web/src/theme/tokens.ts` colors with role-named tokens per design.md §1 (`ink`, `inkHover`, `teal`, `tealHover`, `tealDeep`, `blueSoft`, `blueDeep`, `coral`, `coralDeep`, `gold`, `goldDeep`, `surface`, `surfaceApp`, `surfaceMuted`, `surfaceSubtle`, `textMuted`, `textFaint`, `borderSubtle`, `borderRow`, `borderStrong`, `borderStep`) plus the badge tint colors.
- [x] 2.2 Add the quantized type scale (design.md §2 table), the two font families, the weight set (400/500/600/700), and the three letter-spacing tokens. Include the px→token mapping as a comment so the quantization is auditable.
- [x] 2.3 Add the radius ramp (`xs`/`sm`/`md`/`lg`/`xl`/`2xl`/`full`) and the four named shadows (`card`, `control`, `lifted`, `panel`) verbatim from the bundle.
- [x] 2.4 Replace the numeric spacing scale with the bundle's values (keeping the named `xs…2xl` steps) so Tailwind's 16px-base defaults no longer leak in.
- [x] 2.5 Wire all of the above into `apps/web/tailwind.config.ts` — `colors`, `fontSize`, `fontFamily`, `fontWeight`, `letterSpacing`, `borderRadius`, `boxShadow`, `spacing`. Override rather than extend `fontSize`, `borderRadius`, and numeric `spacing`.
- [x] 2.6 Add `@fontsource-variable/inter` and `@fontsource/lora` to `apps/web/package.json` and import them in `apps/web/src/index.css`; set the app background to `surfaceApp` and the base text color to `ink` in the Tailwind base layer.
- [x] 2.7 Confirm `apps/web/ui-preview/tailwind.config.ts` picks the new tokens up through its existing `../src/theme/tokens` import (no duplicated palette), and that the preview's CSS entry loads the fonts too.

## 3. Icon set

- [x] 3.1 Add `apps/web/src/components/ui/icons/iconPaths.ts` transcribing the bundle's `ICON` map (`home`, `users`, `cases`, `assess`, `ce`, `dir`, `refer`, `shelter`, `insight`, `tools`), plus the inline icons the shell needs: `search`, `bell`, `settings`, `chevronLeft`, `chevronRight`, `alert`.
- [x] 3.2 Add a typed `Icon` component (`name`, `size`, `className`) rendering the stroke-based SVG in the bundle's geometry, and re-export it from `apps/web/src/components/ui/index.ts`.
- [x] 3.3 Add an `icon: IconName` field to each entry in `apps/web/src/components/layout/navConfig.ts`.

## 4. Shell — navigation rail and top bar

- [x] 4.1 Restyle `NavRail.tsx` to the bundle: rail width/background, item spacing and radius, active item (teal-tinted fill, navy label, weight shift), inactive muted label, hover tint, nested/sub-item indentation.
- [x] 4.2 Render the real icon per nav item, and render group headers in the bundle's uppercase tracked micro-label treatment.
- [x] 4.3 Restyle the Referrals count badge as the bundle's teal-tinted pill.
- [x] 4.4 Add the bundle's bottom org/user card (avatar initials, name, org sub-line) to the rail.
- [x] 4.5 Replace the `«`/`»` collapse control with the chevron icon and add an explicit width transition between the collapsed and expanded rail; in the collapsed state center the icons, hide labels and group headers, and drop the count badge. Record in the change's open items that the collapsed state has no bundle reference.
- [x] 4.6 Restyle `TopBar.tsx`: Lora page title with the tight letter-spacing, muted subtitle line, white shadowed search card with the inline search icon, and the notifications bell + settings control restyled into the same control idiom with real SVG icons replacing the emoji. Keep all existing stub behavior and the "Welcome, [First Name]" + logout controls.
- [x] 4.7 Restyle `AppShell.tsx` and `ContentAreaTemplate.tsx` to the bundle's page background, content padding, and title-band spacing; add the optional `subtitle` prop through `ContentAreaTemplate`/`PageHeader` (design.md open question 4 — drop it if it reads as scope creep).

## 5. Shared components

- [x] 5.1 `KpiTile`: card radius + `card` shadow, uppercase tracked label, large numeral in the bundle's size/weight, muted sub-line, bundle padding. Remove the `min-w-[10rem]` arbitrary value in favour of a theme spacing token.
- [x] 5.2 `ui/status/statusColors.ts`: widen `StatusTone` to the six bundle tones and fill `STATUS_COLOR_MAP` with each tone's exact fill/text pair.
- [x] 5.3 Add `STATUS_TONE_BY_LABEL` in the same folder covering every batch-1 status word (design.md §4 table), with case-insensitive normalized lookup and a `quiet` fallback for unknown words.
- [x] 5.4 `StatusBadge`: resolve tone from the label map by default, keep an explicit `tone` prop as an override, and apply the bundle's badge padding, radius, size, and weight.
- [x] 5.5 `FilterChipRow`: navy fill + white label + `lifted` shadow when active, muted fill + muted label when inactive, plus the hover state, at the bundle's padding/radius/size.
- [x] 5.6 `DataTable`: tinted header band with uppercase tracked column labels, hairline row borders, row hover tint, bundle cell padding and type size, and tabular-numeric alignment for numeric columns.
- [x] 5.7 `DataTable`: add `isLoading?: boolean` and `emptyMessage?: string`, rendering a single full-width muted row for each; loading wins when both apply.
- [x] 5.8 `PageHeader`: Lora title typography, and widen the action `variant` to `primary` (navy fill) / `secondary` (teal fill, navy label) / `tertiary` (outlined) with the bundle's button padding, radius, size, weight, and hover states.
- [x] 5.9 `StatusStepper`: implement against the existing props interface — numbered circular nodes, connector lines filled up to the current stage, completed/active/inactive treatments, and terminal branch nodes rendered after the linear sequence in their own treatment.

## 6. Login screen

- [x] 6.1 Re-tokenize `apps/web/src/routes/pages/LoginPage.tsx` — page background, card radius + `card` shadow, Lora heading, input borders/radius, navy submit button, coral error text — keeping its current layout unchanged.
- [x] 6.2 Confirm no `auth` behavior changed (submit handler, redirect, loading/error states untouched).

## 7. Preview gallery

- [x] 7.1 Add a bundle-reference line to every story in `apps/web/ui-preview/stories/` naming the screen and section it mirrors, plus a pointer to `docs/Housing360 Portal.html`.
- [x] 7.2 Extend `StatusBadge.stories.tsx` to show all six tones and every word in `STATUS_TONE_BY_LABEL`.
- [x] 7.3 Extend `DataTable.stories.tsx` with empty-state and loading-state entries.
- [x] 7.4 Extend `StatusStepper.stories.tsx` to cover each stage position and the terminal-branch (rejected) state.
- [x] 7.5 Add a story or gallery section for the `Icon` set and for `PageHeader`'s three action variants.
- [x] 7.6 Update `apps/web/ui-preview/App.tsx` so the new entries are reachable in the gallery.

## 8. Verification

- [x] 8.1 `npm run lint` and `npm run build` pass from the repo root.
- [x] 8.2 Grep `apps/web/src/components/ui` and `apps/web/src/components/layout` for `#[0-9a-fA-F]{3,6}`, `\[[0-9.]+(px|rem)\]`, and `-\[#` — confirm zero matches.
- [x] 8.3 Grep the whole of `apps/web/src` for the retired `primary-` and `neutral-` Tailwind class prefixes — confirm zero matches (Tailwind class typos are invisible to `tsc`).
- [x] 8.4 Manual visual pass: open `npm run ui-preview` (port 6006) alongside `docs/Housing360 Portal.html` and confirm each of `Icon`, `KpiTile`, `StatusBadge` (all six tones), `FilterChipRow`, `DataTable` (data, empty, loading), `PageHeader` (all three variants), and `StatusStepper` matches its named bundle section.
- [x] 8.5 Manual visual pass on the running app: nav rail (expanded, collapsed, active item, group headers, referrals badge, user card), top bar, content-area template, and the login screen.
- [x] 8.6 Update the change's open items with anything the visual pass surfaced — at minimum the three known gaps (no login mockup in the bundle, no collapsed-rail reference, no bell/settings in the bundle's top bar).
- [x] 8.7 Update the repo's `CLAUDE.md` frontend conventions section: the new token names and scales, the six-tone status system and label map, the icon set's location, `DataTable`'s new states, and the fact that `StatusStepper` is now implemented rather than reserved.
