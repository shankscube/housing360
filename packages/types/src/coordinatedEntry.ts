/**
 * assessment-and-ce-workspace: replaces the old fixed-shape
 * `VulnerabilityAssessmentInput`/`VulnerabilityAssessment`/
 * `CoordinatedEntryReferralInput`/`PrioritizationListItem`/
 * `PrioritizationListQuery` types with a configurable question/scoring/
 * override rule model (`CeQuestion`/`CeAnswerOption`/`CeScoreBand`/
 * `CeFlagOverride`/`CeRuleChange`/`CeAssessment`/`CeResponse`, backing
 * `VulnerabilityAssessment` was dropped from the schema entirely — see that
 * change's design.md Decision 6, deliberately BREAKING).
 */

// ---- Question bank (client-facing + admin CRUD) ----

export interface CeAnswerOption {
  id: string;
  questionId: string;
  text: string;
  score: number;
}

export interface CeQuestion {
  id: string;
  text: string;
  clientFacingPrompt: string | null;
  sequence: number;
  isActive: boolean;
  weightNote: string | null;
  answerOptions: CeAnswerOption[];
}

export interface CeAnswerOptionInput {
  text: string;
  score: number;
}

export interface CeQuestionInput {
  text: string;
  clientFacingPrompt?: string;
  sequence?: number;
  isActive?: boolean;
  weightNote?: string;
  answerOptions: CeAnswerOptionInput[];
}

export type CeQuestionUpdateInput = Partial<Omit<CeQuestionInput, 'answerOptions'>>;
export type CeAnswerOptionUpdateInput = Partial<CeAnswerOptionInput>;

// ---- Score bands ----

export interface CeScoreBand {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  description: string | null;
  badgeColor: string | null;
  /** Comma-separated HUD project-type codes, matched against `Program.projectTypeCode`. */
  recommendedProjectTypeCodes: string;
}

export interface CeScoreBandInput {
  name: string;
  minScore: number;
  maxScore: number;
  description?: string;
  badgeColor?: string;
  recommendedProjectTypeCodes: string;
}

export type CeScoreBandUpdateInput = Partial<CeScoreBandInput>;

// ---- Flag overrides ----

/** The 3 fixed intake flags an assessment can carry — also the convention
 * `CeFlagOverride.flag` values must match (see `CoordinatedEntryService`'s
 * fixed evaluation order: Safety Alert, then Veteran, then Unaccompanied
 * Youth). */
export type CeFlag = 'veteran' | 'unaccompaniedYouth' | 'safetyAlert';

export type CeFlagOverrideBehavior = 'replace' | 'add';

export interface CeFlagOverride {
  id: string;
  flag: string;
  triggerQuestionId: string | null;
  triggerMinScore: number | null;
  behavior: CeFlagOverrideBehavior;
  externalReferralMessage: string | null;
}

export interface CeFlagOverrideInput {
  flag: CeFlag | string;
  triggerQuestionId?: string;
  triggerMinScore?: number;
  behavior: CeFlagOverrideBehavior;
  externalReferralMessage?: string;
}

export type CeFlagOverrideUpdateInput = Partial<CeFlagOverrideInput>;

// ---- Rule change audit ----

export interface CeRuleChange {
  id: string;
  ruleTable: string;
  ruleId: string;
  actorId: number;
  actorName: string;
  before: unknown;
  after: unknown;
  changedAt: string;
}

// ---- CE Assessment (submission + detail) ----

export interface CeAssessmentFlags {
  veteran: boolean;
  unaccompaniedYouth: boolean;
  safetyAlert: boolean;
}

export interface CeResponseInput {
  questionId: string;
  answerOptionId: string;
}

export interface CeAssessmentInput {
  clientId: string;
  responses: CeResponseInput[];
  flags: CeAssessmentFlags;
}

export interface CeAppliedOverride {
  flag: string;
  behavior: CeFlagOverrideBehavior;
}

export interface CeAssessment {
  id: string;
  clientId: string;
  clientName: string;
  assessedById: number;
  assessedAt: string;
  totalScore: number;
  bandId: string | null;
  bandName: string | null;
  flags: CeAssessmentFlags;
  referralId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CeAssessmentResponseDetail {
  questionId: string;
  questionText: string;
  answerOptionId: string;
  answerText: string;
  score: number;
}

/**
 * `appliedOverrides`/`recommendedProjectTypes`/`referralSuppressed`/
 * `externalReferralMessage` are recomputed at read time from the persisted
 * `flags` + `CeResponse.score` values rather than stored as columns — see
 * `apps/api/src/services/coordinatedEntryEngine.service.ts`'s header comment.
 */
export interface CeAssessmentDetail extends CeAssessment {
  responses: CeAssessmentResponseDetail[];
  appliedOverrides: CeAppliedOverride[];
  recommendedProjectTypes: string[];
  referralSuppressed: boolean;
  externalReferralMessage?: string;
  /** This client's prior CE assessments, newest first, excluding this one. */
  previousAssessments: CeAssessment[];
}

// ---- Priority queue ----

/** Single-select — a deliberate break from the old composable-AND quick
 * filters (design.md Decision 13 / coordinated-entry spec's "Priority Queue
 * Filter Is Single-Select"). */
export type PriorityQueueFilter = 'TOP5' | 'VETERAN' | 'YOUTH' | 'SAFETY_ALERT' | 'AWAITING_REFERRAL';

export interface PriorityQueueQuery {
  filter?: PriorityQueueFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PriorityQueueItem {
  ceAssessmentId: string;
  clientId: string;
  clientName: string;
  totalScore: number;
  bandId: string | null;
  bandName: string | null;
  flags: CeAssessmentFlags;
  /** `true` when this client's latest `CeAssessment` has no linked `referralId`. */
  isAwaitingReferral: boolean;
  assessedAt: string;
}

export interface PriorityQueueResult {
  items: PriorityQueueItem[];
  total: number;
  page: number;
  pageSize: number;
}

// ---- Recommendation / recommended programs ----

export interface ClientRecommendation {
  ceAssessmentId: string;
  totalScore: number;
  bandId: string | null;
  bandName: string | null;
  recommendedProjectTypes: string[];
  appliedOverrides: CeAppliedOverride[];
  referralSuppressed: boolean;
  externalReferralMessage?: string;
}

export interface RecommendedProgram {
  id: string;
  name: string;
  projectTypeCode: string | null;
  operatingOrganization: { id: string; name: string; address: string | null } | null;
  /** A simple live count of currently-unassigned beds — see `bed.model.ts`'s
   * `countAvailableBeds` for the (deliberately simplified, no date/shift
   * filter) definition. */
  availableBedCount: number;
}

// ---- Send Referral (step 4 / Plan tab reuse) ----

/** Creates a row in the shared `Referral` table (`isExternal: true`), same as
 * every other referral path, and links it back via `CeAssessment.referralId`
 * so `AWAITING_REFERRAL` filtering on the priority queue reflects it. */
export interface CeReferralInput {
  ceAssessmentId: string;
  programId?: string;
  providerOrgId?: string;
  /** Free-text "provider case manager" contact — there's no FK for this
   * concept anywhere else in the schema either (see `Referral.providerContact`). */
  providerContact?: string;
}
