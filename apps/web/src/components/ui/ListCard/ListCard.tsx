import type { ReactNode } from 'react';
import { Button } from '../Button';

export interface ListCardHeaderAction {
  label: string;
  onClick: () => void;
}

export interface ListCardProps<T extends { id: string }> {
  title: string;
  headerAction?: ListCardHeaderAction;
  items: T[];
  renderItem: (item: T) => ReactNode;
  /** Loading takes precedence over `items`/`emptyMessage` when both apply. */
  isLoading?: boolean;
  emptyMessage: string;
}

/**
 * The shared "titled card containing a list of rows" shell — generalized
 * from the shape `TasksCard`/`InteractionSummariesCard` (Case detail's
 * Overview tab) already hand-roll independently. Purely presentational: it
 * owns the card/header/loading/empty states and delegates each row's markup
 * to `renderItem`, so it has no idea what kind of item it's listing.
 */
export function ListCard<T extends { id: string }>({
  title,
  headerAction,
  items,
  renderItem,
  isLoading = false,
  emptyMessage,
}: ListCardProps<T>) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface p-8 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {headerAction ? (
          <Button variant="secondary" size="sm" onClick={headerAction.onClick}>
            {headerAction.label}
          </Button>
        ) : null}
      </div>

      {isLoading ? <p className="text-sm text-textMuted">Loading…</p> : null}

      {!isLoading && items.length === 0 ? <p className="text-sm text-textMuted">{emptyMessage}</p> : null}

      {!isLoading && items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>{renderItem(item)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
