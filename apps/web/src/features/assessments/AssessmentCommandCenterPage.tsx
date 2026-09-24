import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssessmentFilter, AssessmentListItem, AssessmentTypeFilter } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { DataTable, FilterChipRow, Icon, StatusBadge, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAssessments, setListFilter, setListPage, setListTypeFilter, setSearchTerm } from '../../store/slices/assessmentsSlice';
import { assessmentDisplayStatus, assessmentTypeLabel, hudStageLabel } from './assessmentLabels';

const STATUS_FILTER_OPTIONS: { value: AssessmentFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'dueToday', label: 'Due Today' },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const TYPE_FILTER_OPTIONS: { value: AssessmentTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'entry', label: 'Entry' },
  { value: 'annual', label: 'Annual' },
  { value: 'exit', label: 'Exit' },
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

interface AssessmentTableRow extends AssessmentListItem, Record<string, unknown> {}

export function AssessmentCommandCenterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status, filter, typeFilter, search, page, pageSize, total, kpis } = useAppSelector(
    (state) => state.assessments.list
  );

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(setSearchTerm(searchInput));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchAssessments({ page, pageSize, filter, typeFilter, search }));
  }, [dispatch, page, pageSize, filter, typeFilter, search]);

  const columns: DataTableColumn<AssessmentTableRow>[] = [
    {
      key: 'assessment',
      header: 'Assessment',
      cell: (row) => `${assessmentTypeLabel(row.type)} Assessment`,
    },
    { key: 'client', header: 'Client', cell: (row) => row.clientName },
    { key: 'programEnrollment', header: 'Program Enrollment', cell: (row) => row.programEnrollmentName },
    {
      key: 'hudStage',
      header: 'HUD Stage',
      cell: (row) => <StatusBadge label={assessmentTypeLabel(row.type) || hudStageLabel(row.dataCollectionStage)} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <StatusBadge label={assessmentDisplayStatus(row)} />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      numeric: true,
      cell: (row) => formatDate(row.dueDate),
    },
  ];

  const hasActiveFilterOrSearch = filter !== 'all' || typeFilter !== 'all' || search.trim() !== '';
  const emptyMessage = hasActiveFilterOrSearch ? 'No assessments match these filters.' : 'No assessments yet.';

  const kpiTiles = kpis
    ? [
        { value: kpis.dueToday, label: 'Due Today', tone: 'gold' as const },
        { value: kpis.inProgress, label: 'In Progress', tone: 'blue' as const },
        { value: kpis.completed, label: 'Completed', tone: 'teal' as const },
        { value: kpis.total, label: 'Total Assessments', tone: 'navy' as const },
      ]
    : [];

  return (
    <ContentAreaTemplate
      title="Assessment Command Center"
      subtitle="Track every HUD assessment across your caseload — due dates, status, and provisional scores."
      kpiTiles={kpiTiles}
    >
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        <div className="flex flex-col gap-5 px-9 py-7">
          <div className="flex flex-wrap items-center gap-6">
            <FilterChipRow
              options={STATUS_FILTER_OPTIONS}
              activeValue={filter}
              onChange={(value) => dispatch(setListFilter(value as AssessmentFilter))}
            />
            <div className="h-6 w-px bg-borderStep" aria-hidden />
            <FilterChipRow
              options={TYPE_FILTER_OPTIONS}
              activeValue={typeFilter}
              onChange={(value) => dispatch(setListTypeFilter(value as AssessmentTypeFilter))}
            />
          </div>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search assessments by client name"
            aria-label="Search assessments"
            className="w-full rounded-md border border-borderStrong bg-surface px-7 py-4 text-base text-ink outline-none transition-colors focus:border-ink"
          />
        </div>

        <DataTable<AssessmentTableRow>
          columns={columns}
          rows={items as AssessmentTableRow[]}
          rowKey={(row) => row.id}
          isLoading={status === 'loading'}
          emptyMessage={emptyMessage}
          rowActions={[
            {
              key: 'view',
              label: 'Open assessment',
              icon: <Icon name="chevronRight" size={14} />,
              onClick: (row) => navigate(`/assessments/${row.id}`),
            },
          ]}
          pagination={{ page, pageSize, total, onPageChange: (nextPage) => dispatch(setListPage(nextPage)) }}
        />
      </div>
    </ContentAreaTemplate>
  );
}
