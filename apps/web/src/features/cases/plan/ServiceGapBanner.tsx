import { useEffect, useState } from 'react';
import type { ServiceGap } from '@housing360/types';
import { Button } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchServiceGaps } from '../../../store/slices/carePlansSlice';
import { caseOptionLabel } from '../shared/caseLabels';
import { ReferToPartnerAgencyFlow } from './ReferToPartnerAgencyFlow';

export interface ServiceGapBannerProps {
  caseId: string;
  clientId: string;
}

/**
 * One banner per goal whose service domain has no in-house benefit — see
 * `care-planning` spec's "Service Gap Detection" requirement. Each gets its
 * own "Refer to Partner" action, opening the flow scoped to that goal.
 */
export function ServiceGapBanner({ caseId, clientId }: ServiceGapBannerProps) {
  const dispatch = useAppDispatch();
  const { serviceGaps, serviceGapsStatus } = useAppSelector((state) => state.carePlans);
  const [referGap, setReferGap] = useState<ServiceGap | null>(null);

  useEffect(() => {
    dispatch(fetchServiceGaps(caseId));
  }, [dispatch, caseId]);

  if (serviceGapsStatus !== 'succeeded' || serviceGaps.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {serviceGaps.map((gap) => (
        <div
          key={gap.goalAssignmentId}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold bg-goldTint px-6 py-4"
        >
          <p className="text-sm text-ink">
            {caseOptionLabel(gap.serviceDomain)} isn&apos;t offered in-house.{' '}
            <span className="text-textMuted">({gap.goalName})</span>
          </p>
          <Button variant="secondary" size="sm" onClick={() => setReferGap(gap)}>
            Refer to Partner
          </Button>
        </div>
      ))}

      {referGap ? (
        <ReferToPartnerAgencyFlow
          caseId={caseId}
          clientId={clientId}
          gap={referGap}
          onClose={() => setReferGap(null)}
        />
      ) : null}
    </div>
  );
}
