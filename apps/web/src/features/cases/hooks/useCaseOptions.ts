import { useEffect, useState } from 'react';
import type { CaseOptionsResponse } from '@housing360/types';
import { getCaseOptions } from '../../../api/client';

const EMPTY: CaseOptionsResponse = {
  stage: [],
  origin: [],
  status: [],
  hmisDataQualityStatus: [],
  interactionPurpose: [],
  confidentialityType: [],
};

/**
 * Shared across every form in `case-workspace` that needs Stage/Origin/Status/
 * HMIS Data Quality Status option lists (New Case, Edit Case, …) — fetched
 * once per mounting form rather than hardcoded, per the repo's
 * never-hardcode-a-HUD-style-option-list convention.
 */
export function useCaseOptions(): CaseOptionsResponse {
  const [options, setOptions] = useState<CaseOptionsResponse>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    getCaseOptions().then((response) => {
      if (!cancelled && response.success) {
        setOptions(response.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return options;
}
