import type { ReleaseOfInformation, ReleaseOfInformationSummary } from '@housing360/types';
import type { ReleaseOfInformationRow } from './releaseOfInformation.model';

export function toReleaseOfInformation(row: ReleaseOfInformationRow): ReleaseOfInformation {
  return {
    id: row.id,
    clientId: row.clientId,
    recipientOrgName: row.recipientOrgName,
    recipientContactName: row.recipientContactName,
    recipientContactEmail: row.recipientContactEmail,
    recipientContactPhone: row.recipientContactPhone,
    infoCaseManagement: row.infoCaseManagement,
    infoDayToDayActivity: row.infoDayToDayActivity,
    infoMentalHealth: row.infoMentalHealth,
    infoChemicalDependency: row.infoChemicalDependency,
    infoHivAids: row.infoHivAids,
    infoOther: row.infoOther,
    infoOtherSpecify: row.infoOtherSpecify,
    purpose: row.purpose,
    clientSignature: row.clientSignature,
    clientSignedAt: row.clientSignedAt ? row.clientSignedAt.toISOString() : null,
    staffSignature: row.staffSignature,
    staffSignedAt: row.staffSignedAt ? row.staffSignedAt.toISOString() : null,
    expiresOn: row.expiresOn.toISOString(),
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toReleaseOfInformationSummary(row: ReleaseOfInformationRow): ReleaseOfInformationSummary {
  return {
    id: row.id,
    recipientOrgName: row.recipientOrgName,
    infoTypes: {
      infoCaseManagement: row.infoCaseManagement,
      infoDayToDayActivity: row.infoDayToDayActivity,
      infoMentalHealth: row.infoMentalHealth,
      infoChemicalDependency: row.infoChemicalDependency,
      infoHivAids: row.infoHivAids,
      infoOther: row.infoOther,
      infoOtherSpecify: row.infoOtherSpecify,
    },
    expiresOn: row.expiresOn.toISOString(),
  };
}
