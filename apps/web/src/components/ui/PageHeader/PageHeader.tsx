export type PageHeaderActionVariant = 'primary' | 'secondary' | 'tertiary';

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

const actionBaseClass =
  'whitespace-nowrap rounded-md px-9 py-4.5 text-base font-semibold transition-colors';

const ACTION_VARIANT_CLASS: Record<PageHeaderActionVariant, string> = {
  primary: 'bg-ink text-surface hover:bg-inkHover',
  secondary: 'bg-teal text-ink hover:bg-tealHover',
  tertiary: 'border border-borderStrong bg-surface text-ink hover:border-ink',
};

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
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className={`${actionBaseClass} ${ACTION_VARIANT_CLASS[action.variant ?? 'primary']}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
