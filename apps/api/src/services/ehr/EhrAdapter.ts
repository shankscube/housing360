import type { ClinicalSummary, ClinicalEncounter } from '@housing360/types';

/**
 * The Health and Wellness tab's clinical read model comes through this
 * interface rather than a direct table read — see design.md Decision 10.
 * Exactly one implementation ships in this change (`noopEhrAdapter`); no
 * vendor name may appear anywhere in `apps/web` copy.
 */
export interface EhrAdapter {
  getClinicalSummary(clientId: string): Promise<ClinicalSummary | null>;
  listRecentEncounters(clientId: string, limit: number): Promise<ClinicalEncounter[]>;
}
