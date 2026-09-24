/**
 * Recommended-program-type mapping by vulnerability priority tier — a static
 * lookup against the 5 seeded `Program` rows (`prisma/seed.ts`'s `PROGRAMS`),
 * not a scoring model. `Program` has no `type`/category column to match
 * against (out of scope — see design.md Decision 7), so this is this phase's
 * placeholder recommendation logic, served from one config per the repo's
 * "never hardcode an option list on the frontend" convention.
 */
export const RECOMMENDED_PROGRAMS_BY_TIER: Record<'high' | 'medium' | 'low', string[]> = {
  high: ['Permanent Supportive Housing', 'Rapid Re-Housing', 'Emergency Shelter'],
  medium: ['Rapid Re-Housing', 'Homelessness Prevention', 'Emergency Shelter'],
  low: ['Homelessness Prevention', 'Street Outreach'],
};

/** Prioritization List quick filters — independently toggleable, composed as
 * an AND (design.md Decision 5), not a single-select `FilterChipRow` group. */
export type PrioritizationQuickFilter =
  | 'topFive'
  | 'veteran'
  | 'unaccompaniedYouth'
  | 'safetyAlert'
  | 'awaitingReferral';

export const UNACCOMPANIED_YOUTH_MAX_AGE = 25;
