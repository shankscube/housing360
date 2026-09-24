import type { CaseDetail } from '@housing360/types';

export interface SystemInformationCardProps {
  caseDetail: CaseDetail;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function SystemInformationCard({ caseDetail }: SystemInformationCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface p-8 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">System Information</h2>
      <p className="text-sm text-textMuted">
        Created by {caseDetail.createdByName ?? 'System'} on {formatDateTime(caseDetail.createdAt)}
      </p>
      <p className="text-sm text-textMuted">
        Last modified by {caseDetail.updatedByName ?? 'System'} on {formatDateTime(caseDetail.updatedAt)}
      </p>
    </div>
  );
}
