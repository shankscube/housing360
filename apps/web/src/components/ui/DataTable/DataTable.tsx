import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Defaults to rendering `row[key]` when omitted. */
  cell?: (row: T) => ReactNode;
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
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  rowActions,
}: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-neutral-500">
          {columns.map((column) => (
            <th key={column.key} className="px-md py-sm font-medium">
              {column.header}
            </th>
          ))}
          {rowActions && rowActions.length > 0 ? (
            <th className="px-md py-sm font-medium">Actions</th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)} className="border-b border-neutral-100">
            {columns.map((column) => (
              <td key={column.key} className="px-md py-sm text-neutral-900">
                {column.cell ? column.cell(row) : String(row[column.key] ?? '')}
              </td>
            ))}
            {rowActions && rowActions.length > 0 ? (
              <td className="px-md py-sm">
                <div className="flex gap-xs">
                  {rowActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      aria-label={action.label}
                      title={action.label}
                      onClick={() => action.onClick(row)}
                      className="rounded p-xs text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      {action.icon}
                    </button>
                  ))}
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
