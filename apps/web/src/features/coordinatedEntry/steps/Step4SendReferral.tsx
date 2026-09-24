import { useState } from 'react';
import type { CeAssessmentDetail, ClientSearchResultItem, Referral, RecommendedProgram } from '@housing360/types';
import { Button, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { sendCeReferral } from '../../../store/slices/coordinatedEntrySlice';

export interface Step4SendReferralProps {
  client: ClientSearchResultItem;
  assessment: CeAssessmentDetail;
  program: RecommendedProgram | null;
  sentReferral: Referral | null;
  onStartOver: () => void;
}

const inputClass =
  'w-full rounded-md border border-borderStrong bg-surface px-5 py-3.5 text-sm text-ink outline-none transition-colors focus:border-ink';

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-wide text-textMuted">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

/**
 * `CeReferralInput` (packages/types/src/coordinatedEntry.ts) only accepts
 * `ceAssessmentId`/`programId`/`providerOrgId`/`providerContact` — there is
 * no `description`/`comments`/`priority`/`category`/`referrerContact` field
 * on this endpoint's payload (those exist on the general `Referral`/
 * `ReferralInput` shape used elsewhere, not on `POST /api/ce/referrals`).
 * The review panel below still surfaces Priority/Referral Date/Status/
 * Referral Type/Category/Referrer Case Manager as informational, display-only
 * values (derived from the assessment/current user, not submitted) rather
 * than adding editable fields the backend would silently drop. The one real
 * input is "Provider Case Manager", which maps to `providerContact`.
 */
export function Step4SendReferral({ client, assessment, program, sentReferral, onStartOver }: Step4SendReferralProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const status = useAppSelector((state) => state.coordinatedEntry.referral.status);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [providerContact, setProviderContact] = useState('');

  if (assessment.referralSuppressed) {
    return (
      <div className="rounded-lg border border-coral bg-coralTint p-6">
        <p className="text-sm font-semibold text-coralDeep">Safety Alert — Referral Suppressed</p>
        <p className="mt-1 text-sm text-ink">
          {assessment.externalReferralMessage ??
            'Referral to an external partner is suppressed for this client. Follow internal safety protocol instead.'}
        </p>
      </div>
    );
  }

  async function handleSend() {
    if (!program) {
      showToast('Complete the earlier steps before sending a referral.');
      return;
    }
    const action = await dispatch(
      sendCeReferral({
        ceAssessmentId: assessment.id,
        programId: program.id,
        providerOrgId: program.operatingOrganization?.id,
        providerContact: providerContact.trim() || undefined,
      })
    );
    if (sendCeReferral.fulfilled.match(action)) {
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
            {program?.name ?? 'Recommended program'} at {program?.operatingOrganization?.name ?? 'partner agency'}{' '}
            — status: {sentReferral.status}
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
    <div className="flex flex-col gap-6">
      <p className="text-sm text-textMuted">Review and send this referral:</p>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-borderRow p-6 sm:grid-cols-2">
        <ReviewField label="Client" value={`${client.firstName} ${client.lastName}`} />
        <ReviewField label="Program" value={program?.name ?? '—'} />
        <ReviewField label="Organization" value={program?.operatingOrganization?.name ?? '—'} />
        <ReviewField label="Priority" value={assessment.bandName ?? '—'} />
        <ReviewField label="Referral Date" value={new Date().toLocaleDateString()} />
        <ReviewField label="Status" value="New" />
        <ReviewField label="Referral Type" value="External" />
        <ReviewField label="Category" value="Coordinated Entry" />
        <ReviewField
          label="Referrer Case Manager"
          value={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '—'}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink">Provider Case Manager</label>
        <input
          type="text"
          value={providerContact}
          onChange={(event) => setProviderContact(event.target.value)}
          placeholder="Name of the receiving program's case manager (optional)"
          className={inputClass}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSend} disabled={status === 'loading'}>
          Send Referral
        </Button>
      </div>
    </div>
  );
}
