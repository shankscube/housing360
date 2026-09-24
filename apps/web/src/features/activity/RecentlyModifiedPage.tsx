import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RecentActivityFilter, RecentActivityItem } from '@housing360/types';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Button, Icon, type IconName } from '../../components/ui';
import { FilterChipRow } from '../../components/ui/FilterChipRow';
import { ListCard } from '../../components/ui/ListCard';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRecentActivity, setFilter, setPage } from '../../store/slices/recentActivitySlice';

const FILTER_OPTIONS: { value: RecentActivityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cases', label: 'Cases' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'clients', label: 'Clients' },
  { value: 'assessments', label: 'Assessments' },
];

interface ActivityRow extends RecentActivityItem {
  id: string;
}

export function RecentlyModifiedPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, total, page, pageSize, filter, status } = useAppSelector((state) => state.recentActivity);

  useEffect(() => {
    dispatch(fetchRecentActivity({ type: filter, page, pageSize }));
  }, [dispatch, filter, page, pageSize]);

  function handleFilterChange(value: string) {
    dispatch(setFilter(value as RecentActivityFilter));
  }

  function handleRefresh() {
    dispatch(fetchRecentActivity({ type: filter, page, pageSize }));
  }

  function handleRowClick(item: RecentActivityItem) {
    if (item.recordType === 'case') {
      navigate(`/cases/${item.recordId}`);
    } else if (item.recordType === 'assessment') {
      navigate(`/assessments/${item.recordId}`);
    }
    // referral and client rows have no detail route yet — non-navigating.
  }

  const rows: ActivityRow[] = items.map((item) => ({
    ...item,
    id: `${item.recordType}-${item.recordId}`,
  }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ContentAreaTemplate
      title="Recently Modified"
      subtitle="Cases, referrals, clients, and assessments from your own caseload, newest first."
    >
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-8 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <FilterChipRow options={FILTER_OPTIONS} activeValue={filter} onChange={handleFilterChange} />
          <Button variant="tertiary" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>

        <ListCard<ActivityRow>
          title="Activity"
          items={rows}
          isLoading={status === 'loading'}
          emptyMessage="Nothing found for this filter."
          renderItem={(item) => {
            const clickable = item.recordType === 'case' || item.recordType === 'assessment';
            return (
              <div
                onClick={clickable ? () => handleRowClick(item) : undefined}
                className={`flex items-center gap-4 rounded-lg border border-borderRow px-5 py-4 ${
                  clickable ? 'cursor-pointer transition-colors hover:bg-surfaceSubtle' : ''
                }`}
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surfaceSubtle text-ink">
                  <Icon name={item.icon as IconName} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                  <p className="truncate text-xs text-textMuted">{item.subtitle}</p>
                </div>
                <span className="flex-none text-xs text-textMuted">
                  {new Date(item.at).toLocaleString()}
                </span>
              </div>
            );
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-textMuted">
          <span>
            {total === 0
              ? '0 results'
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-3">
            <Button
              variant="tertiary"
              size="sm"
              disabled={page <= 1}
              onClick={() => dispatch(setPage(page - 1))}
            >
              ‹ Prev
            </Button>
            <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="tertiary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => dispatch(setPage(page + 1))}
            >
              Next ›
            </Button>
          </div>
        </div>
      </div>
    </ContentAreaTemplate>
  );
}
