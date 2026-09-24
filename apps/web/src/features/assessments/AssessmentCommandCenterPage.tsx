import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AssessmentFilter, AssessmentListItem, AssessmentTypeFilter } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Button, ConfirmDialog, DataTable, FilterChipRow, Icon, StatusBadge, useToast, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  discardAssessment,
  fetchAssessments,
  setListFilter,
  setListPage,
  setListTypeFilter,
  setSearchTerm,
} from '../../store/slices/assessmentsSlice';
import { AssessmentFormModal, type AssessmentFormLaunchContext } from './AssessmentFormModal';
import { LaunchAssessmentModal, type LaunchAssessmentTarget } from './LaunchAssessmentModal';
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

/** One modal instance covers both the "start a new assessment" and "resume a
 * draft" paths — `viaLaunch` is what tells `AssessmentFormModal` whether to
 * render its "‹ Back" action (only meaningful when this page's own
 * `LaunchAssessmentModal` is what opened it). */
type FormModalState =
  | { mode: 'create'; launchContext: AssessmentFormLaunchContext; viaLaunch: true }
  | { mode: 'edit'; assessmentId: string; viaLaunch: boolean };

export function AssessmentCommandCenterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { items, status, filter, typeFilter, search, page, pageSize, total, kpis } = useAppSelector(
    (state) => state.assessments.list
  );

  const [searchInput, setSearchInput] = useState(search);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [discardTargetId, setDiscardTargetId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(setSearchTerm(searchInput));
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchAssessments({ page, pageSize, filter, typeFilter, search }));
  }, [dispatch, page, pageSize, filter, typeFilter, search]);

  function refetchList() {
    dispatch(fetchAssessments({ page, pageSize, filter, typeFilter, search }));
  }

  function handleLaunch(target: LaunchAssessmentTarget) {
    setShowLaunchModal(false);
    if (target.resumeAssessmentId) {
      setFormModal({ mode: 'edit', assessmentId: target.resumeAssessmentId, viaLaunch: true });
    } else if (target.stage) {
      setFormModal({
        mode: 'create',
        launchContext: {
          clientId: target.clientId,
          clientName: target.clientName,
          enrollment: target.enrollment,
          stage: target.stage,
        },
        viaLaunch: true,
      });
    }
  }

  function handleResumeRow(assessmentId: string) {
    setFormModal({ mode: 'edit', assessmentId, viaLaunch: false });
  }

  async function handleConfirmDiscardRow() {
    if (!discardTargetId) return;
    const result = await dispatch(discardAssessment(discardTargetId));
    setDiscardTargetId(null);
    if (discardAssessment.fulfilled.match(result)) {
      showToast('Draft assessment discarded.', 'success');
      // The slice's own `discardAssessment.fulfilled` reducer already strips
      // the row from `list.items` optimistically; refetch anyway so the KPI
      // tiles (Due Today/In Progress/Completed/Total — not touched by that
      // reducer) stay in sync too, per this task's "Discard ... then
      // refetches list" instruction.
      refetchList();
    } else {
      showToast('Failed to discard the draft assessment.');
    }
  }

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
    {
      key: 'quickActions',
      header: '',
      cell: (row) =>
        row.status === 'in_progress' ? (
          <div className="flex gap-3">
            <Button variant="tertiary" size="sm" onClick={() => handleResumeRow(row.id)}>
              Resume
            </Button>
            <Button variant="tertiary" size="sm" onClick={() => setDiscardTargetId(row.id)}>
              Discard
            </Button>
          </div>
        ) : null,
    },
  ];

  const hasActiveFilterOrSearch = filter !== 'all' || typeFilter !== 'all' || search.trim() !== '';
  const emptyMessage = hasActiveFilterOrSearch ? 'No assessments match these filters.' : 'No assessments yet.';

  const kpiTiles = kpis
    ? [
        { value: kpis.dueToday, label: 'Due Today', subLine: 'Requires immediate completion', tone: 'gold' as const },
        { value: kpis.inProgress, label: 'In Progress', subLine: 'Drafts awaiting completion', tone: 'blue' as const },
        {
          value: kpis.completed,
          label: 'Completed',
          subLine: `${kpis.completedThisMonth} completed this month`,
          tone: 'teal' as const,
        },
        { value: kpis.total, label: 'Total Assessments', subLine: 'Across all programs', tone: 'navy' as const },
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
            <div className="ml-auto">
              <Button variant="secondary" size="sm" onClick={() => setShowLaunchModal(true)}>
                Launch Assessment
              </Button>
            </div>
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

      <LaunchAssessmentModal isOpen={showLaunchModal} onClose={() => setShowLaunchModal(false)} onLaunch={handleLaunch} />

      {formModal ? (
        <AssessmentFormModal
          isOpen
          mode={formModal.mode}
          launchContext={formModal.mode === 'create' ? formModal.launchContext : undefined}
          assessmentId={formModal.mode === 'edit' ? formModal.assessmentId : undefined}
          onBack={
            formModal.viaLaunch
              ? () => {
                  setFormModal(null);
                  setShowLaunchModal(true);
                }
              : undefined
          }
          onClose={() => setFormModal(null)}
          onSaved={() => {
            setFormModal(null);
            refetchList();
          }}
          onDiscarded={() => {
            setFormModal(null);
            refetchList();
          }}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(discardTargetId)}
        onClose={() => setDiscardTargetId(null)}
        onConfirm={handleConfirmDiscardRow}
        title="Discard draft assessment?"
        message="This permanently deletes the draft and its answers. This can't be undone."
        confirmLabel="Discard Draft"
        danger
      />
    </ContentAreaTemplate>
  );
}
