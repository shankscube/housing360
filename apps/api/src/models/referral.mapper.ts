import type { Referral } from '@housing360/types';
import type { ReferralRow } from './referral.model';

export function toReferral(row: ReferralRow): Referral {
  return {
    id: row.id,
    title: row.title,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    caseId: row.caseId,
    programId: row.programId,
    programName: row.program?.name ?? null,
    providerOrgId: row.providerOrgId,
    providerOrgName: row.providerOrg?.name ?? null,
    referrerOrgId: row.referrerOrgId,
    referrerOrgName: row.referrerOrg?.name ?? null,
    referralDate: row.referralDate.toISOString(),
    type: row.type,
    status: row.status,
    priority: row.priority,
    category: row.category,
    outcome: row.outcome,
    description: row.description,
    comments: row.comments,
    clientContact: row.clientContact,
    providerContact: row.providerContact,
    referrerContact: row.referrerContact,
    caseManagerComments: row.caseManagerComments,
    declineReason: row.declineReason,
    declineNotes: row.declineNotes,
    isExternal: row.isExternal,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
