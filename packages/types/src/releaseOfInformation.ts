/** The 6 information types a client can authorize releasing, per the ROI form. */
export interface ReleaseOfInformationTypes {
  infoCaseManagement: boolean;
  infoDayToDayActivity: boolean;
  infoMentalHealth: boolean;
  infoChemicalDependency: boolean;
  infoHivAids: boolean;
  infoOther: boolean;
  infoOtherSpecify?: string | null;
}

export interface ReleaseOfInformation extends ReleaseOfInformationTypes {
  id: string;
  clientId: string;
  recipientOrgName: string;
  recipientContactName: string | null;
  recipientContactEmail: string | null;
  recipientContactPhone: string | null;
  purpose: string | null;
  clientSignature: string | null;
  clientSignedAt: string | null;
  staffSignature: string | null;
  staffSignedAt: string | null;
  expiresOn: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReleaseOfInformationCreateInput extends ReleaseOfInformationTypes {
  clientId: string;
  recipientOrgName: string;
  recipientContactName?: string;
  recipientContactEmail?: string;
  recipientContactPhone?: string;
  purpose?: string;
  clientSignature: string;
  staffSignature: string;
  /** Defaults server-side to `clientSignedAt/now() + 365 days` when omitted. */
  expiresOn?: string;
}

export interface ReleaseOfInformationSummary {
  id: string;
  recipientOrgName: string;
  infoTypes: ReleaseOfInformationTypes;
  expiresOn: string;
}

/** `GET /api/clients/:id/roi-status` — the one shared "active consent" answer (design.md Decision 7). */
export interface RoiStatusResponse {
  hasActiveConsent: boolean;
  activeRoi: ReleaseOfInformationSummary | null;
}

/** `GET /api/reference/roi-text` — config-driven legal copy, never inlined in the form component. */
export interface RoiTextResponse {
  authorizationText: string;
  redisclosureNotice: string;
}
