import type { HudOption } from './hudOptions';

/** Served from `/api/reference/case-options` alongside Stage/Origin — same "never hardcode on the frontend" convention. */
export const INTERACTION_PURPOSE_OPTIONS: HudOption[] = [
  { value: 'case_management', label: 'Case Management' },
  { value: 'service_referral', label: 'Service Referral' },
  { value: 'crisis_intervention', label: 'Crisis Intervention' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'other', label: 'Other' },
];

export const CONFIDENTIALITY_TYPE_OPTIONS: HudOption[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'dv_confidential', label: 'DV Confidential' },
];
