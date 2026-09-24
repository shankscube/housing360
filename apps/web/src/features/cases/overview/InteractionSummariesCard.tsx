import { useEffect, useState } from 'react';
import type { InteractionSummary } from '@housing360/types';
import { Button, StatusBadge } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  fetchCaseInteractionSummaries,
  fetchInteractionSummaryDetail,
  setInteractionSummarySearch,
} from '../../../store/slices/casesSlice';
import { caseOptionLabel } from '../shared/caseLabels';

export interface InteractionSummariesCardProps {
  caseId: string;
  onNew: () => void;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function InteractionSummariesCard({ caseId, onNew }: InteractionSummariesCardProps) {
  const dispatch = useAppDispatch();
  const { items, status, search } = useAppSelector((state) => state.cases.detail.interactionSummaries);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const handle = setTimeout(() => dispatch(setInteractionSummarySearch(searchInput)), 300);
    return () => clearTimeout(handle);
  }, [searchInput, dispatch]);

  useEffect(() => {
    dispatch(fetchCaseInteractionSummaries({ caseId, search: search || undefined }));
  }, [dispatch, caseId, search]);

  function handleOpen(summary: InteractionSummary) {
    dispatch(fetchInteractionSummaryDetail(summary.id));
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface p-8 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">Interaction Summaries</h2>
        <Button variant="secondary" size="sm" onClick={onNew}>
          New
        </Button>
      </div>

      <input
        type="search"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder="Search interaction summaries"
        aria-label="Search interaction summaries"
        className="w-full rounded-md border border-borderStrong bg-surface px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-ink"
      />

      {status === 'loading' ? <p className="text-sm text-textMuted">Loading…</p> : null}

      {status !== 'loading' && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-borderRow bg-surfaceMuted px-6 py-8 text-center">
          <p className="text-sm font-semibold text-ink">Don&apos;t forget!</p>
          <p className="mt-1 text-sm text-textMuted">
            Log an interaction summary to keep a record of your contact with this client.
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((summary) => (
            <li key={summary.id}>
              <button
                type="button"
                onClick={() => handleOpen(summary)}
                className="flex w-full flex-col gap-1 rounded-lg border border-borderRow px-5 py-4 text-left transition-colors hover:bg-surfaceHover"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">{summary.title}</span>
                  <StatusBadge label={caseOptionLabel(summary.status)} />
                </div>
                <span className="text-xs text-textMuted">{formatDateTime(summary.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
