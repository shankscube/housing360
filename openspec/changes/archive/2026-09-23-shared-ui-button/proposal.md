## Why

`design-system-implementation` gave `PageHeader`'s action buttons the design bundle's three variants — navy `primary`, teal `secondary`, outlined `tertiary` — but left them as a module-private `ACTION_VARIANT_CLASS` map inside `PageHeader.tsx`. The bundle uses those same three buttons well outside any page header: My Clients puts a teal "New Intake" in the table card's header row, the referral detail screen has an outlined action, and the navy alert panel has its own ghost variant. The first screen to need one — `my-clients-screen`, already proposed — has no way to get it except duplicating three class strings, and so would every screen after it.

This is a small extraction, but it has to happen before screen work starts rather than after, because the duplication is cheapest to prevent and most tedious to unwind.

## What Changes

- Add `apps/web/src/components/ui/Button/` exporting a `Button` component with a typed props interface: `variant` (`primary` | `secondary` | `tertiary`), `size` (`md` | `sm`), plus the standard button attributes (`type`, `onClick`, `disabled`, `aria-*`).
  - `md` is the bundle's page-level button (11px 20px padding, `base` type) — what `PageHeader` renders today.
  - `sm` is its in-card button (9px 17px padding, `sm` type, `sm` radius) — what My Clients' "New Intake" and the referral actions use.
- Move the variant and size class maps out of `PageHeader.tsx` into `Button`, and have `PageHeader` render `Button` instead of a bare `<button>`. `PageHeaderAction`'s public shape does not change, so no `PageHeader` call site moves.
- Add a `Button` entry to the component preview gallery covering all three variants × both sizes, plus disabled, with its bundle reference line.
- Reuse the same disabled treatment the login screen's submit button already uses, so a disabled `Button` and the existing form submit don't drift apart.

Explicitly out of scope:
- No new visual design. Every value comes from `src/theme/tokens.ts` and is already on screen today via `PageHeader` — this change moves code, it does not restyle anything.
- No icon-in-button API, no loading state, no `as`/`href` polymorphism. Add them when a screen actually needs one.
- The bundle's ghost-on-navy button (teal outline on the data-quality panel) is **not** included — it belongs to a panel this app hasn't built yet, and guessing its API now would be inventing.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `shared-ui`: adds a `Button` requirement (the shared three-variant, two-size button, and the rule that shared/screen code uses it rather than restyling a bare `<button>`), and amends the `PageHeader` requirement to state that its actions render through `Button` so the two cannot drift.

## Impact

- **New**: `apps/web/src/components/ui/Button/{Button.tsx,index.ts}`, re-exported from `src/components/ui/index.ts`; `apps/web/ui-preview/stories/Button.stories.tsx`, registered in `ui-preview/App.tsx`.
- **Changed**: `apps/web/src/components/ui/PageHeader/PageHeader.tsx` (renders `Button`; variant/size maps removed). Its exported types are unchanged.
- **Unblocks**: `my-clients-screen`, whose table-card "New Intake" button depends on this. That change should be applied after this one.
- **No changes** to `apps/api`, `packages/*`, the theme, routing, or any Redux slice. No visual change to anything already on screen — `PageHeader` renders identically before and after.
