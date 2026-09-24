import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

/**
 * `md` is the design bundle's page-level button (Home's New Intake / New
 * Referral / New Case group); `sm` is its in-card button (My Clients'
 * table-card New Intake, the referral detail actions).
 */
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const baseClass =
  'whitespace-nowrap rounded-md font-semibold transition-colors disabled:opacity-60';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-surface hover:bg-inkHover',
  secondary: 'bg-teal text-ink hover:bg-tealHover',
  tertiary: 'border border-borderStrong bg-surface text-ink hover:border-ink',
  /** Destructive actions (e.g. `ConfirmDialog`'s `danger` prop) — the bundle's coral, its "urgent/overdue/rejected" tone. */
  danger: 'bg-coral text-surface hover:opacity-90',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  md: 'px-9 py-4.5 text-base',
  sm: 'px-7.5 py-3.5 text-sm',
};

/**
 * The shared action button. Anything needing one of the bundle's button
 * treatments renders this rather than restyling a bare `<button>`, so a
 * `PageHeader` action and a standalone button of the same variant can't drift.
 * `danger` (coral) was added for `ConfirmDialog`'s destructive-confirm case —
 * still the only place button color lives.
 *
 * `type` defaults to `"button"` so a `Button` inside a form doesn't submit by
 * accident; pass `type="submit"` explicitly where that's wanted.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className={[baseClass, VARIANT_CLASS[variant], SIZE_CLASS[size], className]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
