## 1. Capture the baseline

- [x] 1.1 Run `npm run ui-preview` in `apps/web` and capture the current `PageHeader` story (all three action variants) as a before-image — this refactor must produce no visual change, and the comparison is the only thing that proves it.

## 2. Button component

- [x] 2.1 Add `apps/web/src/components/ui/Button/Button.tsx` exporting `Button`, `ButtonProps`, `ButtonVariant` (`primary`/`secondary`/`tertiary`) and `ButtonSize` (`md`/`sm`), with `ButtonProps` extending `ButtonHTMLAttributes<HTMLButtonElement>`
- [x] 2.2 Move the variant class map out of `PageHeader.tsx` verbatim (`bg-ink`/`hover:bg-inkHover`, `bg-teal`/`hover:bg-tealHover`, outlined `border-borderStrong`/`hover:border-ink`) — do not retune any value
- [x] 2.3 Add the size class map: `md` = the bundle's page-level button (current `PageHeader` padding and `base` type), `sm` = its in-card button (`9px 17px` padding, `sm` type) — both expressed in theme tokens, no arbitrary values
- [x] 2.4 Default `variant` to `primary`, `size` to `md`, and `type` to `"button"` so a `Button` inside a form doesn't submit by accident
- [x] 2.5 Own the disabled treatment on `Button` (the `disabled:opacity-60` the login submit uses today), so no call site defines its own
- [x] 2.6 Add `Button/index.ts` and re-export from `apps/web/src/components/ui/index.ts`

## 3. PageHeader uses Button

- [x] 3.1 Rewrite `PageHeader`'s action row to render `<Button variant={action.variant ?? 'primary'} size="md">`, deleting `actionBaseClass` and `ACTION_VARIANT_CLASS`
- [x] 3.2 Alias `PageHeaderActionVariant` to `ButtonVariant` so the two can't diverge; leave `PageHeaderAction`'s shape otherwise unchanged so no call site moves
- [x] 3.3 Optional, and only if it stays styling-only: swap `LoginPage`'s submit button to `<Button type="submit" disabled={…}>`. Do not touch its handler, loading label, or redirect behavior — no `auth` behavior may change. Skip this task entirely if it can't be done without touching behavior.

## 4. Preview

- [x] 4.1 Add `apps/web/ui-preview/stories/Button.stories.tsx` with a `reference` line naming the bundle sections (Home → New Intake / New Referral / New Case group; My Clients → table-card New Intake), covering all three variants × both sizes, plus a disabled row
- [x] 4.2 Register it in `ui-preview/App.tsx`

## 5. Verification

- [x] 5.1 `npm run lint` and `npm run build` pass from the repo root
- [x] 5.2 Grep `apps/web/src/components/ui` for `#[0-9a-fA-F]{3,6}`, `\[[0-9.]+(px|rem)\]` and `-\[#` — confirm zero matches, as `shared-ui` requires
- [x] 5.3 Compare the `PageHeader` story against the 1.1 before-image — confirm it is visually identical; any difference means a value was retuned and must be reverted
- [x] 5.4 Visually confirm the new `Button` story against the named bundle sections
- [x] 5.5 If 3.3 was done, confirm login still works end to end (submit, loading label, error state, redirect) against the running API
- [x] 5.6 Update the repo's `CLAUDE.md`: note `Button` as the shared action button in the `src/components/ui/` list, and that `PageHeader` actions render through it
