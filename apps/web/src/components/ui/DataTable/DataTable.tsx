import type { ReactNode } from 'react';
import { Icon } from '../icons';

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Defaults to rendering `row[key]` when omitted. */
  cell?: (row: T) => ReactNode;
  /** Renders with tabular figures so digits align down the column. */
  numeric?: boolean;
  /**
   * Emphasized cell treatment (darker, semibold). Defaults to the first
   * column, which is what the bundle does on every one of its tables.
   */
  emphasis?: boolean;
}

export interface DataTableRowAction<T> {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: (row: T) => void;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Icon buttons rendered inline per row for one-click actions without opening the record. */
  rowActions?: DataTableRowAction<T>[];
  /** Renders the loading-state row instead of any data. Wins over the empty state. */
  isLoading?: boolean;
  /** Shown in the empty-state row when there are no rows and nothing is loading. */
  emptyMessage?: string;
  /** Every table backed by paginated data passes this so the footer is never a per-screen build. */
  pagination?: DataTablePagination;
}

const cellClass = 'px-9 py-5.5 text-base';
const stateRowClass = 'px-9 py-14 text-center text-sm text-textMuted';

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  rowActions,
  isLoading = false,
  emptyMessage = 'No records found.',
  pagination,
}: DataTableProps<T>) {
  const hasRowActions = Boolean(rowActions && rowActions.length > 0);
  const columnCount = columns.length + (hasRowActions ? 1 : 0);

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="bg-surfaceMuted">
          {columns.map((column) => (
            <th key={column.key} className={headerClass}>
              {column.header}
            </th>
          ))}
          {hasRowActions ? <th className={headerClass}>Actions</th> : null}
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan={columnCount} className={stateRowClass}>
              Loading…
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td colSpan={columnCount} className={stateRowClass}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-borderRow hover:bg-surfaceMuted">
              {columns.map((column, index) => (
                <td key={column.key} className={dataCellClass(column, index)}>
                  {column.cell ? column.cell(row) : String(row[column.key] ?? '')}
                </td>
              ))}
              {hasRowActions ? (
                <td className={cellClass}>
                  <div className="flex gap-2">
                    {rowActions?.map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        aria-label={action.label}
                        title={action.label}
                        onClick={() => action.onClick(row)}
                        className="rounded-sm p-2 text-textMuted hover:bg-surfaceSubtle hover:text-ink"
                      >
                        {action.icon}
                      </button>
                    ))}
                  </div>
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
      {pagination ? (
        <tfoot>
          <tr>
            <td colSpan={columnCount} className="border-t border-borderRow px-9 py-4.5">
              <PaginationFooter {...pagination} />
            </td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

function PaginationFooter({ page, pageSize, total, onPageChange }: DataTablePagination) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-textMuted">
      <span>
        {total === 0 ? '0 results' : `${rangeStart}–${rangeEnd} of ${total}`}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-sm p-2 text-textMuted transition-colors hover:bg-surfaceSubtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-textMuted"
        >
          <Icon name="chevronLeft" size={14} />
        </button>
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-sm p-2 text-textMuted transition-colors hover:bg-surfaceSubtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-textMuted"
        >
          <Icon name="chevronRight" size={14} />
        </button>
      </div>
    </div>
  );
}

const headerClass =
  'whitespace-nowrap border-b border-borderRow px-9 py-4.5 text-2xs font-semibold uppercase tracking-wide text-textMuted';

function dataCellClass<T>(column: DataTableColumn<T>, index: number) {
  const emphasized = column.emphasis ?? index === 0;
  return [
    cellClass,
    emphasized ? 'font-semibold text-ink' : 'text-textMuted',
    column.numeric ? 'tabular-nums' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
