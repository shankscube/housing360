import { useEffect, useState } from 'react';
import type { RoiStatusResponse, ServiceGap } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createExternalReferral, fetchPartnerAgencies } from '../../../store/slices/referralsSlice';
import { fetchServiceGaps } from '../../../store/slices/carePlansSlice';
import { apiClient } from '../../../api/client';
import { ReleaseOfInformationForm } from '../roi/ReleaseOfInformationForm';
import { textareaClass } from '../shared/formStyles';

export interface ReferToPartnerAgencyFlowProps {
  caseId: string;
  clientId: string;
  gap: ServiceGap;
  onClose: () => void;
}

type Step = 'agency' | 'consent' | 'notes';

/**
 * Refer a service gap to a partner agency — agency picker (flagging
 * unreachable ones) → ROI consent check → notes → Send Referral. Without
 * active consent, the server stores only the client's initials regardless
 * of what this flow submits (design.md Decision 7) — the "Continue Without
 * ROI" checkbox here is purely a confirmation gate.
 */
export function ReferToPartnerAgencyFlow({ caseId, clientId, gap, onClose }: ReferToPartnerAgencyFlowProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { partnerAgencies } = useAppSelector((state) => state.referrals);

  const [step, setStep] = useState<Step>('agency');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [roiStatus, setRoiStatus] = useState<RoiStatusResponse | null>(null);
  const [continueWithoutRoi, setContinueWithoutRoi] = useState(false);
  const [showRoiForm, setShowRoiForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    dispatch(fetchPartnerAgencies(gap.serviceDomain));
  }, [dispatch, gap.serviceDomain]);

  function fetchRoiStatus() {
    apiClient.get<RoiStatusResponse>(`/api/clients/${clientId}/roi-status`).then((response) => {
      if (response.success) {
        setRoiStatus(response.data);
      }
    });
  }

  function goToConsentStep() {
    if (!selectedAgencyId) {
      showToast('Select a partner agency to continue.');
      return;
    }
    fetchRoiStatus();
    setStep('consent');
  }

  async function handleSend() {
    if (!selectedAgencyId) return;
    if (!roiStatus?.hasActiveConsent && !continueWithoutRoi) {
      showToast(
        'Check the confirmation checkbox to send this referral without full client details, or create a Release of Information first.'
      );
      return;
    }

    setIsSending(true);
    const result = await dispatch(
      createExternalReferral({
        caseId,
        goalAssignmentId: gap.goalAssignmentId,
        providerOrgId: selectedAgencyId,
        notes: notes.trim() || undefined,
      })
    );
    setIsSending(false);

    if (createExternalReferral.fulfilled.match(result)) {
      showToast('Referral sent.', 'success');
      dispatch(fetchServiceGaps(caseId));
      onClose();
    } else {
      showToast('Failed to send the referral. Please try again.');
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Refer to Partner Agency" size="md">
      <div className="flex flex-col gap-6">
        {step === 'agency' ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-textMuted">
              Agencies offering {gap.serviceDomain.replace(/_/g, ' ')}:
            </p>
            {partnerAgencies.length === 0 ? (
              <p className="text-sm text-textMuted">No partner agencies found for this service domain.</p>
            ) : (
              partnerAgencies.map((agency) => (
                <label
                  key={agency.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-3"
                >
                  <span className="flex items-center gap-3 text-sm text-ink">
                    <input
                      type="radio"
                      name="partner-agency"
                      checked={selectedAgencyId === agency.id}
                      onChange={() => setSelectedAgencyId(agency.id)}
                    />
                    {agency.name}
                  </span>
                  {!agency.isReachable ? (
                    <span className="text-xs font-semibold text-coralDeep">can&apos;t be reached yet</span>
                  ) : null}
                </label>
              ))
            )}
            <div className="mt-4 flex justify-end gap-4">
              <Button variant="tertiary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={goToConsentStep}>
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'consent' ? (
          <div className="flex flex-col gap-5">
            {roiStatus?.hasActiveConsent && roiStatus.activeRoi ? (
              <div className="rounded-lg border border-teal bg-tealTint p-5">
                <p className="text-sm font-semibold text-tealDeep">Active consent on file</p>
                <p className="mt-1 text-sm text-ink">
                  Authorized to: {roiStatus.activeRoi.recipientOrgName}, expires{' '}
                  {new Date(roiStatus.activeRoi.expiresOn).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-lg border border-gold bg-goldTint p-5">
                <p className="text-sm text-ink">No active Release of Information is on file for this client.</p>
                <div className="flex gap-4">
                  <Button variant="secondary" size="sm" onClick={() => setShowRoiForm(true)}>
                    Create Release of Information
                  </Button>
                </div>
                <label className="flex items-start gap-3 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={continueWithoutRoi}
                    onChange={(event) => setContinueWithoutRoi(event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-borderStrong"
                  />
                  I understand this referral will be sent without any client details beyond initials.
                </label>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-ink">Notes</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={textareaClass} />
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="tertiary" onClick={onClose} disabled={isSending}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSend} disabled={isSending}>
                Send Referral
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ReleaseOfInformationForm
        isOpen={showRoiForm}
        onClose={() => setShowRoiForm(false)}
        clientId={clientId}
        onSaved={fetchRoiStatus}
      />
    </Modal>
  );
}
