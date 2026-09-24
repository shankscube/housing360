import type { ClinicalSummary } from '@housing360/types';

export interface ClinicalSummaryCardProps {
  clinicalSummary: ClinicalSummary | null;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function ClinicalSummaryCard({ clinicalSummary }: ClinicalSummaryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Clinical Summary</h2>
      {!clinicalSummary ? (
        <p className="text-sm text-textMuted">No clinical data on file for this client yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-5 text-sm">
          <div>
            <span className="text-xs text-textMuted">Last Visit</span>
            <p className="text-ink">{formatDate(clinicalSummary.lastVisitDate)}</p>
          </div>
          <div>
            <span className="text-xs text-textMuted">Next Appointment</span>
            <p className="text-ink">{formatDate(clinicalSummary.nextAppointmentDate)}</p>
          </div>
          <div>
            <span className="text-xs text-textMuted">Open Follow-Ups</span>
            <p className="text-ink">{clinicalSummary.openFollowUpsCount}</p>
          </div>
        </div>
      )}
    </div>
  );
}
