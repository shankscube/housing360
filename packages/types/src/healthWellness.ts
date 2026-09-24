import type { RoiStatusResponse } from './releaseOfInformation';

export interface ClinicalSummary {
  lastVisitDate: string | null;
  nextAppointmentDate: string | null;
  openFollowUpsCount: number;
}

export interface ClinicalEncounter {
  id: string;
  encounterNumber: string;
  encounterDate: string;
  type: string;
  location: string | null;
  provider: string | null;
  status: string;
}

/** `GET /api/clients/:id/health-wellness` — composes the (no-op today) EHR adapter's read model with ROI status. */
export interface HealthWellnessResponse {
  clinicalSummary: ClinicalSummary | null;
  recentEncounters: ClinicalEncounter[];
  roiStatus: RoiStatusResponse;
}
