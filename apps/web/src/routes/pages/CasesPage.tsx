import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CaseFilter, CaseListItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { DataTable, FilterChipRow, Icon, StatusBadge, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCases, setListFilter, setListPage, setSearchTerm } from '../../store/slices/casesSlice';

const FILTER_OPTIONS: { value: CaseFilter; label: string }[] = [
  { value: 'all', label: 'All Cases' },
  { value: 'myCaseload', label: 'My Caseload' },
  { value: 'highRisk', label: 'High Risk' },
  { value: 'dueToday', label: 'Due Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'recentlyUpdated', label: 'Recently Updated' },
];

const COLUMN_LABELS = {
  caseNumber: 'Case Number',
  clientName: 'Client Name',
  subject: 'Subject',
  status: 'Status',
  priority: 'Priority',
  lastContact: 'Last Contact',
  caseManager: 'Case Manager',
} as const;

/** `open` (the default `cases/ensure` assigns) reads as "Active" until a case manager explicitly moves it along — see this change's design.md. */
function caseStatusLabel(status: string): string {
  if (status === 'open' || status === 'active') return 'Active';
  if (status === 'pending_review') return 'Pending Review';
  if (status === 'closed') return 'Closed';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function casePriorityLabel(priority: string | null): string | null {
  if (!priority) return null;
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

interface CaseTableRow extends CaseListItem, Record<string, unknown> {}

export function CasesPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status, filter, search, page, pageSize, total, kpis } = useAppSelector(
    (state) => state.cases.list
  );

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(setSearchTerm(searchInput));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchCases({ page, pageSize, filter, search }));
  }, [dispatch, page, pageSize, filter, search]);

  function handleFilterChange(value: string) {
    dispatch(setListFilter(value as CaseFilter));
  }

  function handleViewCase(row: CaseTableRow) {
    navigate(`/cases/${row.id}`);
  }

  const columns: DataTableColumn<CaseTableRow>[] = [
    { key: 'caseNumber', header: COLUMN_LABELS.caseNumber },
    { key: 'clientName', header: COLUMN_LABELS.clientName },
    { key: 'subject', header: COLUMN_LABELS.subject, cell: (row) => row.subject ?? '—' },
    {
      key: 'status',
      header: COLUMN_LABELS.status,
      cell: (row) => <StatusBadge label={caseStatusLabel(row.status)} />,
    },
    {
      key: 'priority',
      header: COLUMN_LABELS.priority,
      cell: (row) => {
        const label = casePriorityLabel(row.priority);
        return label ? <StatusBadge label={label} /> : '—';
      },
    },
    {
      key: 'lastContact',
      header: COLUMN_LABELS.lastContact,
      numeric: true,
      cell: (row) => formatDate(row.lastContactDate),
    },
    {
      key: 'caseManager',
      header: COLUMN_LABELS.caseManager,
      cell: (row) => row.assignedCaseManagerName ?? '—',
    },
  ];

  const hasActiveFilterOrSearch = filter !== 'all' || search.trim() !== '';
  const emptyMessage = hasActiveFilterOrSearch ? 'No cases match these filters.' : 'No cases yet.';

  const kpiTiles = kpis
    ? [
        { value: kpis.activeCases, label: 'Active Cases', tone: 'teal' as const },
        { value: kpis.highRisk, label: 'High Risk', tone: 'coral' as const },
        { value: kpis.dueToday, label: 'Due Today', tone: 'gold' as const },
        { value: kpis.closedCases, label: 'Closed Cases', tone: 'quiet' as const },
      ]
    : [];

  return (
    <ContentAreaTemplate
      title="Cases"
      subtitle="Track case status, priority, and follow-up across your caseload."
      kpiTiles={kpiTiles}
    >
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="flex flex-col gap-5 px-9 py-7">
          <FilterChipRow options={FILTER_OPTIONS} activeValue={filter} onChange={handleFilterChange} />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search cases by case number, subject, or client name"
            aria-label="Search cases"
            className="w-full rounded-md border border-borderStrong bg-surface px-7 py-4 text-base text-ink outline-none transition-colors focus:border-ink"
          />
        </div>

        <DataTable<CaseTableRow>
          columns={columns}
          rows={items as CaseTableRow[]}
          rowKey={(row) => row.id}
          isLoading={status === 'loading'}
          emptyMessage={emptyMessage}
          rowActions={[
            {
              key: 'view',
              label: 'Open case',
              icon: <Icon name="chevronRight" size={14} />,
              onClick: handleViewCase,
            },
          ]}
          pagination={{ page, pageSize, total, onPageChange: (nextPage) => dispatch(setListPage(nextPage)) }}
        />
      </div>
    </ContentAreaTemplate>
  );
}
