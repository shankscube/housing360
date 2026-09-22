import { DataTable, StatusBadge } from '../../src/components/ui';
import type { ComponentPreview } from './types';

interface Row {
  id: string;
  name: string;
  status: 'urgent' | 'warning' | 'success' | 'neutral';
}

const ROWS: Row[] = [
  { id: '1', name: 'Alex Rivera', status: 'urgent' },
  { id: '2', name: 'Jordan Lee', status: 'success' },
  { id: '3', name: 'Sam Patel', status: 'neutral' },
];

export const dataTablePreview: ComponentPreview = {
  name: 'DataTable',
  variants: [
    {
      name: 'With inline row actions',
      element: (
        <DataTable<Row>
          columns={[
            { key: 'name', header: 'Client' },
            { key: 'status', header: 'Status', cell: (row) => <StatusBadge label={row.status} tone={row.status} /> },
          ]}
          rows={ROWS}
          rowKey={(row) => row.id}
          rowActions={[
            { key: 'view', label: 'View', icon: <span aria-hidden>👁</span>, onClick: () => {} },
            { key: 'edit', label: 'Edit', icon: <span aria-hidden>✎</span>, onClick: () => {} },
          ]}
        />
      ),
    },
  ],
};
