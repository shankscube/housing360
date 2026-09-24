import type { CaseDetail } from '@housing360/types';
import { caseOptionLabel } from '../shared/caseLabels';

export interface DetailsCardProps {
  caseDetail: CaseDetail;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</span>
      <span className="text-right text-sm text-ink">{value}</span>
    </div>
  );
}

export function DetailsCard({ caseDetail }: DetailsCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-surface p-8 shadow-card">
      <h2 className="mb-2 font-display text-lg font-semibold text-ink">Client &amp; Program</h2>
      <div className="divide-y divide-borderRow">
        <Row label="Client" value={caseDetail.clientName} />
        <Row label="Program" value={caseDetail.programName ?? '—'} />
        <Row label="Enrollment" value={caseDetail.enrollmentName ?? '—'} />
        <Row label="Referral" value={caseDetail.referralId ? 'Linked' : '—'} />
        <Row label="Case Manager" value={caseDetail.assignedCaseManagerName ?? '—'} />
        <Row label="Description" value={caseDetail.description ?? '—'} />
        <Row label="Closed" value={caseDetail.closedAt ? formatDate(caseDetail.closedAt) : 'No'} />
        <Row label="Next HMIS Review Due" value={formatDate(caseDetail.nextHmisReviewDue)} />
        <Row label="HMIS Data Quality Status" value={caseOptionLabel(caseDetail.hmisDataQualityStatus)} />
      </div>
    </div>
  );
}
