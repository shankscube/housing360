import { Button, useToast } from '../../../components/ui';
import type { Referral } from '@housing360/types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { sendCoordinatedEntryReferral } from '../../../store/slices/coordinatedEntrySlice';

export interface Step4SendReferralProps {
  clientId: string;
  vulnerabilityAssessmentId: string | null;
  programId: string | null;
  providerOrgId: string | null;
  sentReferral: Referral | null;
  onStartOver: () => void;
}

export function Step4SendReferral({
  clientId,
  vulnerabilityAssessmentId,
  programId,
  providerOrgId,
  sentReferral,
  onStartOver,
}: Step4SendReferralProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const status = useAppSelector((state) => state.coordinatedEntry.referral.status);
  const recommendedPrograms = useAppSelector((state) => state.coordinatedEntry.recommendedPrograms.data);
  const partnerAgencies = useAppSelector((state) => state.coordinatedEntry.partnerAgencies.data);

  const programName = recommendedPrograms.find((program) => program.id === programId)?.name;
  const providerName = partnerAgencies.find((agency) => agency.id === providerOrgId)?.name;

  async function handleSend() {
    if (!vulnerabilityAssessmentId || !programId || !providerOrgId) {
      showToast('Complete the earlier steps before sending a referral.');
      return;
    }
    const action = await dispatch(
      sendCoordinatedEntryReferral({ clientId, vulnerabilityAssessmentId, programId, providerOrgId })
    );
    if (sendCoordinatedEntryReferral.fulfilled.match(action)) {
      showToast('Referral sent.', 'success');
    } else {
      showToast('Failed to send the referral. Please try again.');
    }
  }

  if (sentReferral) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-teal bg-tealTint p-6">
          <p className="text-sm font-semibold text-tealDeep">Referral sent</p>
          <p className="mt-1 text-sm text-ink">
            {programName ?? 'Recommended program'} at {providerName ?? 'partner agency'} — status:{' '}
            {sentReferral.status}
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onStartOver}>
            Start New Coordinated Entry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-textMuted">Review and send this referral:</p>
      <div className="flex flex-col gap-2 rounded-lg border border-borderRow p-5 text-sm text-ink">
        <div>
          <span className="font-semibold">Program: </span>
          {programName ?? '—'}
        </div>
        <div>
          <span className="font-semibold">Partner agency: </span>
          {providerName ?? '—'}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSend} disabled={status === 'loading'}>
          Send Referral
        </Button>
      </div>
    </div>
  );
}
