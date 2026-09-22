export interface PageHeaderAction {
  key: string;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface PageHeaderProps {
  title: string;
  actions?: PageHeaderAction[];
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      {actions && actions.length > 0 ? (
        <div className="flex gap-sm">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              className={
                action.variant === 'secondary'
                  ? 'rounded-md border border-neutral-300 px-md py-xs text-sm font-medium text-neutral-700'
                  : 'rounded-md bg-primary-600 px-md py-xs text-sm font-medium text-white'
              }
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
