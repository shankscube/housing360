import { DataTable, Icon, StatusBadge } from '../../src/components/ui';
import type { ComponentPreview } from './types';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  ssn: string;
  dob: string;
  program: string;
}

const ROWS: Row[] = [
  {
    id: '1',
    name: 'Marcus Thompson',
    ssn: '•••-••-4471',
    dob: '03/14/1978',
    program: 'Enrolled',
  },
  {
    id: '2',
    name: 'Anthony Whitfield',
    ssn: 'Prefers not to answer',
    dob: '07/29/1965',
    program: 'Awaiting referral',
  },
  {
    id: '3',
    name: 'Ramon Delgado',
    ssn: '•••-••-3364',
    dob: '01/18/2003',
    program: 'Intake started',
  },
];

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'ssn', header: 'SSN', numeric: true },
  { key: 'dob', header: 'Date of birth', numeric: true },
  {
    key: 'program',
    header: 'Program status',
    cell: (row: Row) => <StatusBadge label={row.program} />,
  },
];

const tableShell = (element: React.ReactNode) => (
  <div className="overflow-hidden rounded-2xl bg-surface shadow-card">{element}</div>
);

export const dataTablePreview: ComponentPreview = {
  name: 'DataTable',
  reference: 'My Clients → client table (header band, row hairlines, row hover)',
  variants: [
    {
      name: 'With data and inline row actions',
      element: tableShell(
        <DataTable<Row>
          columns={COLUMNS}
          rows={ROWS}
          rowKey={(row) => row.id}
          rowActions={[
            {
              key: 'view',
              label: 'View',
              icon: <Icon name="search" size={14} strokeWidth={2} />,
              onClick: () => {},
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <Icon name="assess" size={14} strokeWidth={2} />,
              onClick: () => {},
            },
          ]}
        />,
      ),
    },
    {
      name: 'Empty state',
      element: tableShell(<DataTable<Row> columns={COLUMNS} rows={[]} rowKey={(row) => row.id} />),
    },
    {
      name: 'Empty state with a custom message',
      element: tableShell(
        <DataTable<Row>
          columns={COLUMNS}
          rows={[]}
          rowKey={(row) => row.id}
          emptyMessage="No clients match these filters."
        />,
      ),
    },
    {
      name: 'Loading state',
      element: tableShell(
        <DataTable<Row> columns={COLUMNS} rows={[]} rowKey={(row) => row.id} isLoading />,
      ),
    },
    {
      name: 'Loading wins over empty (loading with rows already present)',
      element: tableShell(
        <DataTable<Row> columns={COLUMNS} rows={ROWS} rowKey={(row) => row.id} isLoading />,
      ),
    },
  ],
};
