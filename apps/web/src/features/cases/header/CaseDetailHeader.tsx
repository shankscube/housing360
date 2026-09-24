import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CaseDetail } from '@housing360/types';
import { Button, StatusBadge } from '../../../components/ui';
import { caseOptionLabel, casePriorityLabel, caseStatusLabel } from '../shared/caseLabels';

export interface CaseDetailHeaderProps {
  caseDetail: CaseDetail;
  onEdit: () => void;
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-2xs font-semibold uppercase tracking-wide text-textMuted">{label}</span>
      <span className="text-sm text-ink">{children}</span>
    </div>
  );
}

/**
 * The case detail header — title, case number, and the summary metadata row
 * (Client/Status/Referral/Priority/Stage/Origin). `Client` has no detail
 * route to link to yet (see `my-clients-screen`'s same documented gap for
 * `onViewClient`), so it renders as plain text rather than a fake link.
 */
export function CaseDetailHeader({ caseDetail, onEdit }: CaseDetailHeaderProps) {
  const navigate = useNavigate();
  const priorityLabel = casePriorityLabel(caseDetail.priority);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {caseDetail.subject ?? 'Case'} — {caseDetail.clientName}
          </h1>
          <p className="mt-1 text-sm text-textMuted">Case {caseDetail.caseNumber}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Button variant="tertiary" size="md" onClick={() => navigate('/cases')}>
            Back
          </Button>
          <Button variant="primary" size="md" onClick={onEdit}>
            Edit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-8 rounded-2xl bg-surface px-8 py-6 shadow-card">
        <MetaItem label="Client">{caseDetail.clientName}</MetaItem>
        <MetaItem label="Status">
          <StatusBadge label={caseStatusLabel(caseDetail.status)} />
        </MetaItem>
        <MetaItem label="Referral">{caseDetail.referralId ? 'Linked' : '—'}</MetaItem>
        <MetaItem label="Priority">
          {priorityLabel ? <StatusBadge label={priorityLabel} /> : '—'}
        </MetaItem>
        <MetaItem label="Stage">{caseOptionLabel(caseDetail.stage)}</MetaItem>
        <MetaItem label="Origin">{caseOptionLabel(caseDetail.origin)}</MetaItem>
      </div>
    </div>
  );
}
