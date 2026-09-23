## Context

`PageHeader.tsx` currently holds the only implementation of the design bundle's button treatments:

```tsx
const actionBaseClass =
  'whitespace-nowrap rounded-md px-9 py-4.5 text-base font-semibold transition-colors';

const ACTION_VARIANT_CLASS: Record<PageHeaderActionVariant, string> = {
  primary: 'bg-ink text-surface hover:bg-inkHover',
  secondary: 'bg-teal text-ink hover:bg-tealHover',
  tertiary: 'border border-borderStrong bg-surface text-ink hover:border-ink',
};
```

Both constants are module-private. The bundle uses the same three treatments in two sizes:

| | padding | type | radius | where in the bundle |
|---|---|---|---|---|
| `md` | `11px 20px` | 13px | 9px | Home's New Intake / New Referral / New Case group |
| `sm` | `9px 17px` | 12.5px | 8px | My Clients' table-card New Intake; referral detail actions |

In the current theme those map to `px-9 py-4.5` / `text-base` / `rounded-md` and `px-7.5 py-3.5` / `text-sm` / `rounded-md` respectively. The bundle's 8px vs 9px radius difference falls inside the radius ramp's single `md` step (9px), which `design-system-implementation` already established as an accepted quantization.

## Goals / Non-Goals

**Goals:**
- One place that knows what a Housing360 button looks like.
- `PageHeader` keeps its exact current public API and renders pixel-identically.
- `my-clients-screen` can render a teal in-card button without duplicating class strings.

**Non-Goals:**
- Any visual change. If a screenshot differs after this change, the change is wrong.
- Widening the API beyond what a screen needs today (no icons, loading state, link polymorphism, or a fourth variant).

## Decisions

### 1. `Button` takes `variant` + `size`, and extends native button props

```tsx
export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; // default 'primary'
  size?: ButtonSize;       // default 'md'
}
```

Extending `ButtonHTMLAttributes` rather than enumerating props means `type`, `disabled`, `onClick`, `aria-*` and `form` all work without this component re-declaring them, and `type` can still be defaulted to `"button"` so a `Button` inside a form doesn't submit by accident.

*Alternative considered*: a closed prop list (`label`, `onClick`, `variant`). Rejected — the login screen's submit button needs `type="submit"` and `disabled`, and a closed list would force a second component or a prop-by-prop widening for each new need.

### 2. `PageHeader` renders `Button`; `PageHeaderAction` is unchanged

`PageHeaderAction` keeps `{ key, label, onClick, variant? }`. `PageHeader` maps each action onto `<Button variant={action.variant ?? 'primary'} size="md">`. No `PageHeader` call site changes, and `PageHeaderActionVariant` becomes an alias of `ButtonVariant` so the two can't diverge.

*Alternative considered*: delete `PageHeaderActionVariant` and have call sites import `ButtonVariant`. Rejected — it churns call sites for no benefit; an alias keeps both names working.

### 3. Disabled state is defined once, on `Button`

The login screen's submit currently carries `disabled:opacity-60` inline. `Button` owns that treatment so every disabled button matches. The bundle has no disabled-button reference, so this keeps what the app already does rather than inventing one — worth noting as a known gap rather than a decision.

Whether `LoginPage` is migrated onto `Button` in this change is deliberately left to implementation: it is a one-line swap and clearly in the spirit of the change, but `LoginPage` belongs to the `auth` capability's screen and this change must not alter `auth` behavior. Migrating its styling only is safe; see Risks.

### 4. Size naming follows the theme, not the bundle's pixel values

`md`/`sm` rather than `page`/`card`, because the same size shows up in contexts that aren't cards (the referral detail action row). Naming by scale keeps it usable; naming by location would be wrong the first time it's used somewhere else.

## Risks / Trade-offs

- **A refactor that is supposed to change nothing visually can still change something** → the preview gallery's `PageHeader` story and the app's Home/Cases screens are the check; the tasks list a before/after comparison of the `PageHeader` story rather than trusting the diff.
- **Touching `LoginPage` edges into the `auth` capability** → only its `className` changes; the submit handler, `type="submit"`, `disabled` binding and loading label stay exactly as they are. No `auth` requirement is altered, so `auth` stays off the modified-capabilities list. If that reads as too close to the line, skip the `LoginPage` swap — nothing else depends on it.
- **Two sizes may turn out to be three** → the bundle also has an 11.5px ghost button on the navy alert panel. Deliberately excluded (see proposal); adding it later is additive.

## Migration Plan

Pure refactor plus one new component. No data, API, or persisted state. Rollback is `git revert`.

## Open Questions

1. **No disabled-state reference in the bundle.** `disabled:opacity-60` is carried over from the existing login button. If the design has a real disabled treatment, it should replace this.
2. **Should `tertiary` gain a hover fill?** The bundle only changes its border color on hover (`border-color:#0E2242`), which is subtle for a button that reads as the least prominent of the three. Kept as the bundle has it; flagged in case it tests poorly.
