import { useEffect } from 'react';
import type { PrioritizationListItem, PrioritizationListQuery } from '@housing360/types';
import { DataTable, StatusBadge, type DataTableColumn } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPrioritizationList, togglePrioritizationFilter } from '../../store/slices/coordinatedEntrySlice';

const QUICK_FILTERS: { key: keyof PrioritizationListQuery; label: string }[] = [
  { key: 'topFive', label: 'Top 5 High Priority' },
  { key: 'veteran', label: 'Veterans' },
  { key: 'unaccompaniedYouth', label: 'Unaccompanied Youth' },
  { key: 'safetyAlert', label: 'Safety Alerts' },
  { key: 'awaitingReferral', label: 'Awaiting Referral' },
];

const chipBaseClass = 'whitespace-nowrap rounded-lg px-6.5 py-3 text-sm font-semibold transition-colors';

interface PrioritizationTableRow extends PrioritizationListItem, Record<string, unknown> {}

/**
 * Every quick filter here is an independent toggle, composed as an AND — not
 * a single-select `FilterChipRow` group (design.md Decision 5). "Top 5 High
 * Priority" is a sort truncation applied after the others, so it composes
 * with them rather than excluding them (e.g. "Top 5" + "Veterans" = the 5
 * highest-priority veterans).
 */
export function PrioritizationList() {
  const dispatch = useAppDispatch();
  const { items, status, filters } = useAppSelector((state) => state.coordinatedEntry.prioritizationList);

  useEffect(() => {
    dispatch(fetchPrioritizationList(filters));
  }, [dispatch, filters]);

  const columns: DataTableColumn<PrioritizationTableRow>[] = [
    { key: 'clientName', header: 'Client' },
    { key: 'score', header: 'Score', numeric: true },
    {
      key: 'priorityTier',
      header: 'Priority',
      cell: (row) => <StatusBadge label={row.priorityTier} />,
    },
    {
      key: 'flags',
      header: 'Flags',
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.isVeteran ? <StatusBadge label="Veteran" tone="navy" /> : null}
          {row.isUnaccompaniedYouth ? <StatusBadge label="Unaccompanied Youth" tone="navy" /> : null}
          {row.safetyAlert ? <StatusBadge label="Safety Alert" tone="coral" /> : null}
          {row.isAwaitingReferral ? <StatusBadge label="Awaiting Referral" tone="gold" /> : null}
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
      <div className="flex flex-col gap-5 px-9 py-7">
        <h2 className="font-display text-lg text-ink">Prioritization List</h2>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Prioritization quick filters">
          {QUICK_FILTERS.map((quickFilter) => {
            const isActive = Boolean(filters[quickFilter.key]);
            return (
              <button
                key={quickFilter.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => dispatch(togglePrioritizationFilter(quickFilter.key))}
                className={
                  isActive
                    ? `${chipBaseClass} bg-ink text-surface shadow-lifted hover:bg-inkHover`
                    : `${chipBaseClass} bg-surfaceSubtle text-textQuiet hover:bg-borderStep hover:text-ink`
                }
              >
                {quickFilter.label}
              </button>
            );
          })}
        </div>
      </div>

      <DataTable<PrioritizationTableRow>
        columns={columns}
        rows={items as PrioritizationTableRow[]}
        rowKey={(row) => row.vulnerabilityAssessmentId}
        isLoading={status === 'loading'}
        emptyMessage="No clients match the current filters."
      />
    </div>
  );
}
