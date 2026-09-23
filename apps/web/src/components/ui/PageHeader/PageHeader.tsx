import { Button, type ButtonVariant } from '../Button';

/** Alias of `ButtonVariant` — the two must never diverge. */
export type PageHeaderActionVariant = ButtonVariant;

export interface PageHeaderAction {
  key: string;
  label: string;
  onClick: () => void;
  /** Defaults to `primary`. */
  variant?: PageHeaderActionVariant;
}

export interface PageHeaderProps {
  title: string;
  /** Muted line under the title — the bundle carries one on every screen. */
  subtitle?: string;
  actions?: PageHeaderAction[];
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-7">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-textMuted">{subtitle}</p> : null}
      </div>
      {actions && actions.length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant ?? 'primary'}
              size="md"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
