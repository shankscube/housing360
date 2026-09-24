import { useEffect } from 'react';
import type { PriorityQueueItem } from '@housing360/types';
import { DataTable, FilterChipRow, StatusBadge, type DataTableColumn, type FilterChipOption } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPriorityQueue,
  setPriorityQueueFilter,
  setPriorityQueuePage,
  setPriorityQueueSearch,
  type PriorityQueueFilterOption,
} from '../../store/slices/coordinatedEntrySlice';

const QUICK_FILTER_OPTIONS: FilterChipOption[] = [
  { value: 'ALL', label: 'All' },
  { value: 'TOP5', label: 'Top 5 High Priority' },
  { value: 'VETERAN', label: 'Veterans' },
  { value: 'YOUTH', label: 'Unaccompanied Youth' },
  { value: 'SAFETY_ALERT', label: 'Safety Alerts' },
  { value: 'AWAITING_REFERRAL', label: 'Awaiting Referral' },
];

interface PriorityQueueTableRow extends PriorityQueueItem, Record<string, unknown> {}

/**
 * Single-select quick filter (`PriorityQueueFilter`: `TOP5|VETERAN|YOUTH|
 * SAFETY_ALERT|AWAITING_REFERRAL`), combined with `search` — a deliberate
 * break from the old five-independent-toggle-buttons model (design.md
 * Decision 13 / coordinated-entry spec's "Priority Queue Filter Is
 * Single-Select"). Combining two quick filters is no longer possible.
 */
export function PrioritizationList() {
  const dispatch = useAppDispatch();
  const { items, status, filter, search, page, pageSize, total } = useAppSelector(
    (state) => state.coordinatedEntry.priorityQueue
  );

  useEffect(() => {
    dispatch(
      fetchPriorityQueue({
        filter: filter === 'ALL' ? undefined : filter,
        search: search || undefined,
        page,
        pageSize,
      })
    );
  }, [dispatch, filter, search, page, pageSize]);

  const columns: DataTableColumn<PriorityQueueTableRow>[] = [
    { key: 'clientName', header: 'Client' },
    { key: 'totalScore', header: 'Score', numeric: true },
    {
      key: 'bandName',
      header: 'Priority',
      cell: (row) => (row.bandName ? <StatusBadge label={row.bandName} /> : <span>—</span>),
    },
    {
      key: 'flags',
      header: 'Flags',
      cell: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.flags.veteran ? <StatusBadge label="Veteran" tone="navy" /> : null}
          {row.flags.unaccompaniedYouth ? <StatusBadge label="Unaccompanied Youth" tone="navy" /> : null}
          {row.flags.safetyAlert ? <StatusBadge label="Safety Alert" tone="coral" /> : null}
        </div>
      ),
    },
    {
      key: 'isAwaitingReferral',
      header: 'Referral Status',
      cell: (row) =>
        row.isAwaitingReferral ? (
          <StatusBadge label="Awaiting Referral" tone="gold" />
        ) : (
          <StatusBadge label="Referred" tone="teal" />
        ),
    },
    {
      key: 'assessedAt',
      header: 'Assessed',
      cell: (row) => new Date(row.assessedAt).toLocaleDateString(),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
      <div className="flex flex-col gap-5 px-9 py-7">
        <h2 className="font-display text-lg text-ink">Prioritization List</h2>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <FilterChipRow
            options={QUICK_FILTER_OPTIONS}
            activeValue={filter}
            onChange={(value) => dispatch(setPriorityQueueFilter(value as PriorityQueueFilterOption))}
          />
          <input
            type="search"
            value={search}
            onChange={(event) => dispatch(setPriorityQueueSearch(event.target.value))}
            placeholder="Search clients"
            className="w-full max-w-xs rounded-md border border-borderStrong bg-surface px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-ink"
          />
        </div>
      </div>

      <DataTable<PriorityQueueTableRow>
        columns={columns}
        rows={items as PriorityQueueTableRow[]}
        rowKey={(row) => row.ceAssessmentId}
        isLoading={status === 'loading'}
        emptyMessage="No clients match the current filter."
        pagination={
          filter === 'TOP5'
            ? undefined
            : { page, pageSize, total, onPageChange: (nextPage) => dispatch(setPriorityQueuePage(nextPage)) }
        }
      />
    </div>
  );
}
