import { useCallback, useEffect, useState } from 'react';
import type { HealthWellnessResponse } from '@housing360/types';
import { apiClient } from '../../../api/client';
import { ClinicalSummaryCard } from '../healthWellness/ClinicalSummaryCard';
import { RoiStatusCard } from '../healthWellness/RoiStatusCard';
import { RecentVisitsList } from '../healthWellness/RecentVisitsList';

export interface HealthWellnessPanelProps {
  clientId: string;
}

/**
 * No vendor name appears anywhere here — the tab reads through a no-op EHR
 * adapter server-side (see design.md Decision 10), so every client shows the
 * same "No clinical data on file for this client yet." copy today.
 */
export function HealthWellnessPanel({ clientId }: HealthWellnessPanelProps) {
  const [data, setData] = useState<HealthWellnessResponse | null>(null);

  const load = useCallback(() => {
    apiClient.get<HealthWellnessResponse>(`/api/clients/${clientId}/health-wellness`).then((response) => {
      if (response.success) {
        setData(response.data);
      }
    });
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return <p className="px-9 py-14 text-center text-sm text-textMuted">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      <ClinicalSummaryCard clinicalSummary={data.clinicalSummary} />
      <RoiStatusCard clientId={clientId} roiStatus={data.roiStatus} onSaved={load} />
      <RecentVisitsList encounters={data.recentEncounters} />
    </div>
  );
}
