import type { Referral } from '@housing360/types';
import { Button, StatusBadge } from '../../../components/ui';
import { caseOptionLabel } from '../shared/caseLabels';

export interface ReferralsListProps {
  referrals: Referral[];
  onEdit: (referral: Referral) => void;
  onAccept: (referral: Referral) => void;
  onDecline: (referral: Referral) => void;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function ReferralsList({ referrals, onEdit, onAccept, onDecline }: ReferralsListProps) {
  if (referrals.length === 0) {
    return <p className="text-sm text-textMuted">No referrals yet for this case.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {referrals.map((referral) => (
        <li key={referral.id} className="rounded-lg border border-borderRow px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-ink">{referral.title}</span>
              <p className="text-xs text-textMuted">
                {formatDate(referral.referralDate)} · {referral.category ? caseOptionLabel(referral.category) : 'No category'}
                {referral.isExternal ? ' · External' : ''}
              </p>
            </div>
            <StatusBadge label={caseOptionLabel(referral.status)} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-textMuted sm:grid-cols-4">
            <span>Client: {referral.clientContact ?? referral.clientName}</span>
            <span>Provider: {referral.providerOrgName ?? referral.providerContact ?? '—'}</span>
            <span>Referrer: {referral.referrerOrgName ?? referral.referrerContact ?? '—'}</span>
            <span>Outcome: {referral.outcome ? caseOptionLabel(referral.outcome) : '—'}</span>
          </div>

          {referral.caseManagerComments ? (
            <p className="mt-3 text-xs text-textMuted">Comments: {referral.caseManagerComments}</p>
          ) : null}

          {referral.status === 'declined' ? (
            <p className="mt-3 text-xs text-coralDeep">
              Declined — {referral.declineReason}
              {referral.declineNotes ? `: ${referral.declineNotes}` : ''}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-3">
            <Button variant="tertiary" size="sm" onClick={() => onEdit(referral)}>
              Edit
            </Button>
            {referral.status === 'pending' ? (
              <>
                <Button variant="tertiary" size="sm" onClick={() => onDecline(referral)}>
                  Decline
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onAccept(referral)}>
                  Accept
                </Button>
              </>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
