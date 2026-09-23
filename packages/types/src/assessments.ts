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

/**
 * The Entry Assessment (`dataCollectionStage = 1`). Steps 4-6 of the intake
 * wizard all write to one record — see design.md's "single Entry Assessment
 * record" decision.
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
  assessmentDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentInput = AssessmentLivingSituation &
  AssessmentIncomeBenefitsInsurance &
  AssessmentHealthDv & {
    clientId: string;
    programEnrollmentId: string;
    caseId: string;
    dataCollectionStage?: number;
  };

export type AssessmentUpdateInput = Partial<
  Omit<AssessmentInput, 'clientId' | 'programEnrollmentId' | 'caseId'>
>;

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
