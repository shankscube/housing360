import type {
  ReleaseOfInformation,
  ReleaseOfInformationCreateInput,
  RoiStatusResponse,
} from '@housing360/types';
import {
  createReleaseOfInformation as createReleaseOfInformationRow,
  findActiveReleaseOfInformation,
} from '../models/releaseOfInformation.model';
import { toReleaseOfInformation, toReleaseOfInformationSummary } from '../models/releaseOfInformation.mapper';
import { findClientById } from '../models/client.model';
import { ROI_DEFAULT_VALIDITY_DAYS } from '../constants/roiDisclosureText';
import { AppError } from '../utils/AppError';

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function createReleaseOfInformation(
  input: ReleaseOfInformationCreateInput
): Promise<ReleaseOfInformation> {
  const client = await findClientById(input.clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }
  if (!input.clientSignature || !input.staffSignature) {
    throw new AppError(400, 'Both client and staff signatures are required');
  }

  const now = new Date();
  const expiresOn = input.expiresOn ? new Date(input.expiresOn) : addDays(now, ROI_DEFAULT_VALIDITY_DAYS);

  const row = await createReleaseOfInformationRow({
    clientId: input.clientId,
    recipientOrgName: input.recipientOrgName,
    recipientContactName: input.recipientContactName ?? null,
    recipientContactEmail: input.recipientContactEmail ?? null,
    recipientContactPhone: input.recipientContactPhone ?? null,
    infoCaseManagement: input.infoCaseManagement,
    infoDayToDayActivity: input.infoDayToDayActivity,
    infoMentalHealth: input.infoMentalHealth,
    infoChemicalDependency: input.infoChemicalDependency,
    infoHivAids: input.infoHivAids,
    infoOther: input.infoOther,
    infoOtherSpecify: input.infoOtherSpecify ?? null,
    purpose: input.purpose ?? null,
    clientSignature: input.clientSignature,
    clientSignedAt: now,
    staffSignature: input.staffSignature,
    staffSignedAt: now,
    expiresOn,
  });

  return toReleaseOfInformation(row);
}

/** The one shared "active consent" answer — see design.md Decision 7. */
export async function getRoiStatus(clientId: string): Promise<RoiStatusResponse> {
  const active = await findActiveReleaseOfInformation(clientId);
  return {
    hasActiveConsent: active !== null,
    activeRoi: active ? toReleaseOfInformationSummary(active) : null,
  };
}
