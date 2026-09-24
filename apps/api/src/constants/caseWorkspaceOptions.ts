import type { HudOption } from './hudOptions';

/**
 * Case Stage/Origin aren't HUD-coded fields (no HMIS data-element number),
 * but follow the same "plain String column, served option list" convention
 * as everything else in this codebase — see `hudOptions.ts`'s own doc
 * comment. Values are a reasonable operational vocabulary for a case
 * workspace; not sourced from a specific HUD data element.
 */
export const CASE_STAGE_OPTIONS: HudOption[] = [
  { value: 'intake', label: 'Intake' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'planning', label: 'Planning' },
  { value: 'active_services', label: 'Active Services' },
  { value: 'stabilization', label: 'Stabilization' },
  { value: 'closing', label: 'Closing' },
];

export const CASE_ORIGIN_OPTIONS: HudOption[] = [
  { value: 'walk_in', label: 'Walk-In' },
  { value: 'referral', label: 'Referral' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'coordinated_entry', label: 'Coordinated Entry' },
  { value: 'other', label: 'Other' },
];

export const CASE_STATUS_OPTIONS: HudOption[] = [
  { value: 'open', label: 'Open' },
  { value: 'active', label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'closed', label: 'Closed' },
];

export const HMIS_DATA_QUALITY_STATUS_OPTIONS: HudOption[] = [
  { value: 'complete', label: 'Complete' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'needs_review', label: 'Needs Review' },
];
