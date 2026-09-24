import { useEffect, useState } from 'react';
import type { Referral } from '@housing360/types';
import { Button } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { acceptReferral, fetchCaseReferrals } from '../../../store/slices/referralsSlice';
import { ReferralsList } from '../referrals/ReferralsList';
import { NewReferralModal } from '../referrals/NewReferralModal';
import { DeclineReferralModal } from '../referrals/DeclineReferralModal';

export interface ReferralsPanelProps {
  caseId: string;
}

export function ReferralsPanel({ caseId }: ReferralsPanelProps) {
  const dispatch = useAppDispatch();
  const { caseReferrals, caseReferralsStatus } = useAppSelector((state) => state.referrals);
  const [showNew, setShowNew] = useState(false);
  const [editReferral, setEditReferral] = useState<Referral | null>(null);
  const [declineReferralTarget, setDeclineReferralTarget] = useState<Referral | null>(null);

  useEffect(() => {
    dispatch(fetchCaseReferrals(caseId));
  }, [dispatch, caseId]);

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Referrals</h2>
        <Button variant="secondary" size="sm" onClick={() => setShowNew(true)}>
          New Referral
        </Button>
      </div>

      {caseReferralsStatus === 'loading' ? <p className="text-sm text-textMuted">Loading…</p> : null}

      <ReferralsList
        referrals={caseReferrals}
        onEdit={setEditReferral}
        onAccept={(referral) => dispatch(acceptReferral(referral.id))}
        onDecline={setDeclineReferralTarget}
      />

      {showNew ? <NewReferralModal isOpen onClose={() => setShowNew(false)} caseId={caseId} /> : null}
      {editReferral ? (
        <NewReferralModal isOpen onClose={() => setEditReferral(null)} caseId={caseId} existingReferral={editReferral} />
      ) : null}
      {declineReferralTarget ? (
        <DeclineReferralModal isOpen onClose={() => setDeclineReferralTarget(null)} referral={declineReferralTarget} />
      ) : null}
    </div>
  );
}
