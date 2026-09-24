/** Wizard step 4 — HUD 3.917 Living Situation. */
export interface AssessmentLivingSituation {
  situationCategory?: string | null;
  situation?: string | null;
  locationDetails?: string | null;
  leaseOwn60Day?: string | null;
  leaveSituation14Days?: string | null;
  monthsHomelessPast3Years?: string | null;
  movedTwoOrMore?: string | null;
  resourcesToObtain?: string | null;
  stayLessThan7Nights?: string | null;
  subsequentResidence?: string | null;
  institutionalStayLessThan90Days?: string | null;
  rentalSubsidyType?: string | null;
  chronicHomelessness?: string | null;
  nightBeforeStreetsEsSh?: string | null;
  timesHomelessPast3Years?: string | null;
  lengthOfStay?: string | null;
  verifiedBy?: string | null;
}

/** Wizard step 5 — HUD 4.02/4.03/4.04 Income, Non-Cash Benefits, and Health Insurance. */
export interface AssessmentIncomeBenefitsInsurance {
  incomeFromAnySource?: string | null;
  earnedIncome?: string | null;
  earnedIncomeAmount?: number | null;
  ssiIncome?: string | null;
  ssiIncomeAmount?: number | null;
  ssdiIncome?: string | null;
  ssdiIncomeAmount?: number | null;
  unemploymentIncome?: string | null;
  unemploymentIncomeAmount?: number | null;
  vaServiceConnectedIncome?: string | null;
  vaServiceConnectedIncomeAmount?: number | null;
  vaNonServiceIncome?: string | null;
  vaNonServiceIncomeAmount?: number | null;
  privateDisabilityIncome?: string | null;
  privateDisabilityIncomeAmount?: number | null;
  workersCompIncome?: string | null;
  workersCompIncomeAmount?: number | null;
  tanfIncome?: string | null;
  tanfIncomeAmount?: number | null;
  generalAssistanceIncome?: string | null;
  generalAssistanceIncomeAmount?: number | null;
  socialSecurityRetirementIncome?: string | null;
  socialSecurityRetirementIncomeAmount?: number | null;
  pensionIncome?: string | null;
  pensionIncomeAmount?: number | null;
  childSupportIncome?: string | null;
  childSupportIncomeAmount?: number | null;
  alimonyIncome?: string | null;
  alimonyIncomeAmount?: number | null;
  otherIncome?: string | null;
  otherIncomeAmount?: number | null;
  otherIncomeSpecify?: string | null;

  benefitsFromAnySource?: string | null;
  snapBenefit?: string | null;
  wicBenefit?: string | null;
  tanfChildCareBenefit?: string | null;
  tanfTransportationBenefit?: string | null;
  otherTanfBenefit?: string | null;
  soarConnection?: string | null;
  otherBenefitSource?: string | null;
  otherBenefitSourceSpecify?: string | null;

  insuranceFromAnySource?: string | null;
  coveredByHealthInsurance?: string | null;
  medicaid?: string | null;
  medicaidNoReason?: string | null;
  medicare?: string | null;
  medicareNoReason?: string | null;
  schip?: string | null;
  schipNoReason?: string | null;
  vha?: string | null;
  vhaNoReason?: string | null;
  employerInsurance?: string | null;
  employerInsuranceNoReason?: string | null;
  cobra?: string | null;
  cobraNoReason?: string | null;
  privatePayInsurance?: string | null;
  privatePayInsuranceNoReason?: string | null;
  stateInsurance?: string | null;
  stateInsuranceNoReason?: string | null;
  ihs?: string | null;
  ihsNoReason?: string | null;
  adap?: string | null;
  adapNoReason?: string | null;
  ryanWhite?: string | null;
  ryanWhiteNoReason?: string | null;
  otherInsurance?: string | null;
  otherInsuranceNoReason?: string | null;
  otherInsuranceSpecify?: string | null;
}

/** Wizard step 6 — HUD 4.11 / R-series Health and DV. */
export interface AssessmentHealthDv {
  generalHealthStatus?: string | null;
  dentalHealthStatus?: string | null;
  mentalHealthStatus?: string | null;
  pregnancyStatus?: string | null;
  pregnancyDueDate?: string | null;
  domesticViolenceSurvivor?: string | null;
  dvWhenOccurred?: string | null;
  dvCurrentlyFleeing?: string | null;
}

/** `assessments-and-coordinated-entry` — mirrors `dataCollectionStage` (1/2/3), kept in
 * sync server-side by `constants/assessmentTypes.ts` so the two never drift apart. */
export type AssessmentType = 'entry' | 'annual' | 'exit';

/**
 * The Entry Assessment (`dataCollectionStage = 1`). Steps 4-6 of the intake
 * wizard all write to one record — see design.md's "single Entry Assessment
 * record" decision. `type`/`dueDate`/`score`/`scoreLabel`/`cycleNumber` were
 * added by `assessments-and-coordinated-entry` for the Assessment Command
 * Center — see that change's design.md Decision 1.
 */
export interface Assessment
  extends AssessmentLivingSituation,
    AssessmentIncomeBenefitsInsurance,
    AssessmentHealthDv {
  id: string;
  clientId: string;
  programEnrollmentId: string;
  caseId: string;
  dataCollectionStage: number;
  type: AssessmentType | null;
  dueDate: string | null;
  score: number | null;
  scoreLabel: string | null;
  cycleNumber: number;
  assessmentDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The Assessments tab's list-row shape (`case-workspace`), extended by
 * `assessments-and-coordinated-entry` with the Command Center's client/program
 * context and real `score` — no longer a permanent `null` placeholder once an
 * assessment has been scored.
 */
export interface AssessmentListItem {
  id: string;
  clientId: string;
  clientName: string;
  programEnrollmentId: string;
  programEnrollmentName: string;
  dataCollectionStage: number;
  type: AssessmentType | null;
  dueDate: string | null;
  assessmentDate: string;
  status: string;
  score: number | null;
  scoreLabel: string | null;
}

export type AssessmentInput = AssessmentLivingSituation &
  AssessmentIncomeBenefitsInsurance &
  AssessmentHealthDv & {
    clientId: string;
    programEnrollmentId: string;
    caseId: string;
    dataCollectionStage?: number;
    type?: AssessmentType;
    dueDate?: string | null;
    cycleNumber?: number;
  };

export type AssessmentUpdateInput = Partial<
  Omit<AssessmentInput, 'clientId' | 'programEnrollmentId' | 'caseId'>
> & {
  status?: string;
};

/** Assessment Command Center's status filter — computed from `status`/`dueDate`,
 * not a stored column (same "computed, not stored" convention as `Case`'s KPIs). */
export type AssessmentFilter = 'all' | 'overdue' | 'dueToday' | 'inProgress' | 'completed';

export type AssessmentTypeFilter = 'all' | AssessmentType;

export interface AssessmentListQuery {
  page?: number;
  pageSize?: number;
  filter?: AssessmentFilter;
  typeFilter?: AssessmentTypeFilter;
  search?: string;
}

export interface AssessmentKpiCounts {
  dueToday: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface AssessmentListResult {
  items: AssessmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  kpis: AssessmentKpiCounts;
}

/** `GET /api/assessments/:id` — the list-row shape plus the handful of fields
 * only the detail view needs. */
export interface AssessmentDetail extends AssessmentListItem {
  caseId: string;
  cycleNumber: number;
  createdAt: string;
  updatedAt: string;
}

/** Per-enrollment Entry Assessment status, as served by the intake-snapshot endpoint. */
export interface EntryAssessmentStatus {
  exists: boolean;
  status: 'none' | 'in_progress' | 'complete';
  assessmentId: string | null;
  sectionsWithValues: {
    livingSituation: boolean;
    incomeBenefitsInsurance: boolean;
    healthDv: boolean;
  };
}
