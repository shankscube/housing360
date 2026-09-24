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
import { insertReferralStatusEvent } from '../models/referralStatusEvent.model';
import { recordActivity } from './recordActivity.service';
import { AppError } from '../utils/AppError';

const DEFAULT_DECLINE_REASON = 'Client declined services';

export async function listReferralsByCase(caseId: string): Promise<Referral[]> {
  const rows = await findReferralsByCase(caseId);
  return rows.map(toReferral);
}

/** `viewed` activity for a single referral — used wherever a referral's own detail is read directly (e.g. notification click-through). */
export async function getReferralById(id: string, requestingUserId: number): Promise<Referral> {
  const row = await findReferralById(id);
  if (!row) {
    throw new AppError(404, 'Referral not found');
  }
  recordActivity(requestingUserId, 'referral', id, 'viewed');
  return toReferral(row);
}

export async function createInternalReferral(input: ReferralInput, requestingUserId: number): Promise<Referral> {
  if (!input.title || !input.title.trim() || !input.clientId) {
    throw new AppError(400, 'Title and Client are required to create a referral');
  }
  const initialStatus = input.status ?? 'pending';
  const row = await createReferral({
    title: input.title.trim(),
    clientId: input.clientId,
    caseId: input.caseId ?? null,
    programId: input.programId ?? null,
    providerOrgId: input.providerOrgId ?? null,
    referrerOrgId: input.referrerOrgId ?? null,
    referralDate: input.referralDate ? new Date(input.referralDate) : undefined,
    type: input.type ?? null,
    status: initialStatus,
    priority: input.priority ?? null,
    category: input.category ?? null,
    description: input.description ?? null,
    comments: input.comments ?? null,
    caseManagerComments: input.caseManagerComments ?? null,
    isExternal: false,
  });
  await insertReferralStatusEvent(row.id, null, initialStatus, requestingUserId);
  recordActivity(requestingUserId, 'referral', row.id, 'modified');
  return toReferral(row);
}

export async function updateReferral(
  id: string,
  input: ReferralUpdateInput,
  requestingUserId: number
): Promise<Referral> {
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
  if (input.status !== undefined && input.status !== existing.status) {
    await insertReferralStatusEvent(id, existing.status, input.status, requestingUserId);
  }
  recordActivity(requestingUserId, 'referral', id, 'modified');
  return toReferral(row);
}

export async function acceptReferral(id: string, requestingUserId: number): Promise<Referral> {
  const existing = await findReferralById(id);
  if (!existing) {
    throw new AppError(404, 'Referral not found');
  }
  const row = await updateReferralRow(id, { status: 'accepted' });
  await insertReferralStatusEvent(id, existing.status, 'accepted', requestingUserId);
  recordActivity(requestingUserId, 'referral', id, 'modified');
  return toReferral(row);
}

export async function declineReferral(
  id: string,
  input: ReferralDeclineInput,
  requestingUserId: number
): Promise<Referral> {
  const existing = await findReferralById(id);
  if (!existing) {
    throw new AppError(404, 'Referral not found');
  }
  const row = await updateReferralRow(id, {
    status: 'declined',
    declineReason: input.reason || DEFAULT_DECLINE_REASON,
    declineNotes: input.notes ?? null,
  });
  await insertReferralStatusEvent(id, existing.status, 'declined', requestingUserId);
  recordActivity(requestingUserId, 'referral', id, 'modified');
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
export async function createExternalReferral(
  input: ExternalReferralInput,
  requestingUserId: number
): Promise<Referral> {
  const caseDetail = await getCaseById(input.caseId);
  const client = await findClientById(caseDetail.clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  const roiStatus = await getRoiStatus(caseDetail.clientId);
  const clientContact = roiStatus.hasActiveConsent
    ? `${client.firstName} ${client.lastName}`
    : initials(client.firstName, client.lastName);

  const initialStatus = 'pending';
  const row = await createReferral({
    title: `Partner referral — ${caseDetail.subject ?? caseDetail.caseNumber}`,
    clientId: caseDetail.clientId,
    caseId: input.caseId,
    providerOrgId: input.providerOrgId,
    isExternal: true,
    status: initialStatus,
    clientContact,
    caseManagerComments: input.notes ?? null,
  });

  await insertReferralStatusEvent(row.id, null, initialStatus, requestingUserId);
  recordActivity(requestingUserId, 'referral', row.id, 'modified');
  return toReferral(row);
}
