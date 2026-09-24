import type { ClinicalEncounter } from '@housing360/types';
import { StatusBadge } from '../../../components/ui';
import { caseOptionLabel } from '../shared/caseLabels';

export interface RecentVisitsListProps {
  encounters: ClinicalEncounter[];
}

export function RecentVisitsList({ encounters }: RecentVisitsListProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Recent Visits</h2>
      {encounters.length === 0 ? (
        <p className="text-sm text-textMuted">No clinical data on file for this client yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {encounters.map((encounter) => (
            <li
              key={encounter.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-3"
            >
              <span className="text-sm text-ink">{encounter.encounterNumber}</span>
              <span className="text-xs text-textMuted">{new Date(encounter.encounterDate).toLocaleDateString()}</span>
              <span className="text-xs text-textMuted">{encounter.type}</span>
              <span className="text-xs text-textMuted">{encounter.location ?? '—'}</span>
              <span className="text-xs text-textMuted">{encounter.provider ?? '—'}</span>
              <StatusBadge label={caseOptionLabel(encounter.status)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
