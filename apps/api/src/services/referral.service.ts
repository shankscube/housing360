import type {
  ExternalReferralInput,
  Referral,
  ReferralDeclineInput,
  ReferralInput,
  ReferralUpdateInput,
} from '@housing360/types';
import {
  createReferral,
  findReferralById,
  findReferralsByCase,
  updateReferral as updateReferralRow,
} from '../models/referral.model';
import { toReferral } from '../models/referral.mapper';
import { getCaseById } from './case.service';
import { findClientById } from '../models/client.model';
import { getRoiStatus } from './releaseOfInformation.service';
import { AppError } from '../utils/AppError';

const DEFAULT_DECLINE_REASON = 'Client declined services';

export async function listReferralsByCase(caseId: string): Promise<Referral[]> {
  const rows = await findReferralsByCase(caseId);
  return rows.map(toReferral);
}

export async function createInternalReferral(input: ReferralInput): Promise<Referral> {
  if (!input.title || !input.title.trim() || !input.clientId) {
    throw new AppError(400, 'Title and Client are required to create a referral');
  }
  const row = await createReferral({
    title: input.title.trim(),
    clientId: input.clientId,
    caseId: input.caseId ?? null,
    programId: input.programId ?? null,
    providerOrgId: input.providerOrgId ?? null,
    referrerOrgId: input.referrerOrgId ?? null,
    referralDate: input.referralDate ? new Date(input.referralDate) : undefined,
    type: input.type ?? null,
    status: input.status ?? 'pending',
    priority: input.priority ?? null,
    category: input.category ?? null,
    description: input.description ?? null,
    comments: input.comments ?? null,
    caseManagerComments: input.caseManagerComments ?? null,
    isExternal: false,
  });
  return toReferral(row);
}

export async function updateReferral(id: string, input: ReferralUpdateInput): Promise<Referral> {
  const existing = await findReferralById(id);
  if (!existing) {
    throw new AppError(404, 'Referral not found');
  }
  if (input.title !== undefined && !input.title.trim()) {
    throw new AppError(400, 'Title is required');
  }
  const row = await updateReferralRow(id, {
    title: input.title,
    programId: input.programId,
    providerOrgId: input.providerOrgId,
    referrerOrgId: input.referrerOrgId,
    referralDate: input.referralDate ? new Date(input.referralDate) : undefined,
    type: input.type,
    status: input.status,
    priority: input.priority,
    category: input.category,
    description: input.description,
    comments: input.comments,
    caseManagerComments: input.caseManagerComments,
  });
  return toReferral(row);
}

export async function acceptReferral(id: string): Promise<Referral> {
  const existing = await findReferralById(id);
  if (!existing) {
    throw new AppError(404, 'Referral not found');
  }
  const row = await updateReferralRow(id, { status: 'accepted' });
  return toReferral(row);
}

export async function declineReferral(id: string, input: ReferralDeclineInput): Promise<Referral> {
  const existing = await findReferralById(id);
  if (!existing) {
    throw new AppError(404, 'Referral not found');
  }
  const row = await updateReferralRow(id, {
    status: 'declined',
    declineReason: input.reason || DEFAULT_DECLINE_REASON,
    declineNotes: input.notes ?? null,
  });
  return toReferral(row);
}

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}.${lastName.charAt(0)}.`.toUpperCase();
}

/**
 * The Plan tab's Refer to Partner Agency flow — server-side consent check,
 * never a client-sent boolean (design.md Decision 7). With active ROI
 * consent, the full client name is stored as `clientContact`; without it,
 * only initials are stored, regardless of what the request body claims.
 */
export async function createExternalReferral(input: ExternalReferralInput): Promise<Referral> {
  const caseDetail = await getCaseById(input.caseId);
  const client = await findClientById(caseDetail.clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  const roiStatus = await getRoiStatus(caseDetail.clientId);
  const clientContact = roiStatus.hasActiveConsent
    ? `${client.firstName} ${client.lastName}`
    : initials(client.firstName, client.lastName);

  const row = await createReferral({
    title: `Partner referral — ${caseDetail.subject ?? caseDetail.caseNumber}`,
    clientId: caseDetail.clientId,
    caseId: input.caseId,
    providerOrgId: input.providerOrgId,
    isExternal: true,
    status: 'pending',
    clientContact,
    caseManagerComments: input.notes ?? null,
  });

  return toReferral(row);
}
