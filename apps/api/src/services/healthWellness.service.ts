import type { HealthWellnessResponse } from '@housing360/types';
import { noopEhrAdapter } from './ehr/noopEhrAdapter';
import { getRoiStatus } from './releaseOfInformation.service';
import { findClientById } from '../models/client.model';
import { AppError } from '../utils/AppError';

const RECENT_ENCOUNTERS_LIMIT = 10;

export async function getHealthWellness(clientId: string): Promise<HealthWellnessResponse> {
  const client = await findClientById(clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  const [clinicalSummary, recentEncounters, roiStatus] = await Promise.all([
    noopEhrAdapter.getClinicalSummary(clientId),
    noopEhrAdapter.listRecentEncounters(clientId, RECENT_ENCOUNTERS_LIMIT),
    getRoiStatus(clientId),
  ]);

  return { clinicalSummary, recentEncounters, roiStatus };
}
