import { useEffect, useState } from 'react';
import { Button, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPartnerAgencies } from '../../../store/slices/coordinatedEntrySlice';

export interface Step3PartnerAgenciesProps {
  selectedProviderOrgId: string | null;
  onSelectProviderOrg: (providerOrgId: string) => void;
  onComplete: () => void;
}

/** Fixed operational vocabulary, not a HUD data element — see `prisma/seed.ts`'s
 * `SERVICE_DOMAINS` comment; served nowhere as a reference list, so this mirrors
 * the Plan tab's Refer-to-Partner flow's same "not a served option list" call. */
const SERVICE_DOMAINS = [
  'housing',
  'employment',
  'behavioral_health',
  'healthcare',
  'legal',
  'financial',
  'childcare',
  'transportation',
  'food',
];

function domainLabel(domain: string): string {
  return domain
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function Step3PartnerAgencies({
  selectedProviderOrgId,
  onSelectProviderOrg,
  onComplete,
}: Step3PartnerAgenciesProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { data: agencies, status } = useAppSelector((state) => state.coordinatedEntry.partnerAgencies);
  const [domain, setDomain] = useState<string>('');

  useEffect(() => {
    dispatch(fetchPartnerAgencies(domain || undefined));
  }, [dispatch, domain]);

  function handleNext() {
    if (!selectedProviderOrgId) {
      showToast('Select a partner agency to continue.');
      return;
    }
    onComplete();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="max-w-xs">
        <label className="mb-2 block text-sm font-semibold text-ink">Filter by service domain</label>
        <select
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          className="w-full rounded-md border border-borderStrong bg-surface px-5 py-3.5 text-sm text-ink outline-none transition-colors focus:border-ink"
        >
          <option value="">All service domains</option>
          {SERVICE_DOMAINS.map((value) => (
            <option key={value} value={value}>
              {domainLabel(value)}
            </option>
          ))}
        </select>
      </div>

      {status === 'loading' ? (
        <p className="text-sm text-textMuted">Loading partner agencies…</p>
      ) : agencies.length === 0 ? (
        <p className="text-sm text-textMuted">No partner agencies found for this service domain.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {agencies.map((agency) => (
            <label
              key={agency.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-3.5"
            >
              <span className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="radio"
                  name="partner-agency"
                  checked={selectedProviderOrgId === agency.id}
                  onChange={() => onSelectProviderOrg(agency.id)}
                />
                {agency.name}
              </span>
              {!agency.isReachable ? (
                <span className="text-xs font-semibold text-coralDeep">can&apos;t be reached yet</span>
              ) : null}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleNext}>
          Continue to Send Referral
        </Button>
      </div>
    </div>
  );
}
