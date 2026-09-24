import { Prisma } from '@prisma/client';
import type {
  Assessment,
  AssessmentDetail,
  AssessmentInput,
  AssessmentListItem,
  AssessmentType,
} from '@housing360/types';
import type { AssessmentListRow, AssessmentRow } from './assessment.model';

function toAssessmentType(type: string | null): AssessmentType | null {
  return type === 'entry' || type === 'annual' || type === 'exit' ? type : null;
}

/** Every `Decimal? @db.Decimal(10,2)` income-amount column on `Assessment`. */
const AMOUNT_FIELDS = [
  'earnedIncomeAmount',
  'ssiIncomeAmount',
  'ssdiIncomeAmount',
  'unemploymentIncomeAmount',
  'vaServiceConnectedIncomeAmount',
  'vaNonServiceIncomeAmount',
  'privateDisabilityIncomeAmount',
  'workersCompIncomeAmount',
  'tanfIncomeAmount',
  'generalAssistanceIncomeAmount',
  'socialSecurityRetirementIncomeAmount',
  'pensionIncomeAmount',
  'childSupportIncomeAmount',
  'alimonyIncomeAmount',
  'otherIncomeAmount',
] as const;

/** Row (Prisma `Decimal | null` amounts, `Date` timestamps) -> shared `Assessment` type
 * (`number | null` amounts, ISO date strings). Field names are identical between the
 * Prisma model and `packages/types/src/assessments.ts` for everything else, so this is
 * mostly a pass-through plus the Decimal/Date conversions. */
export function toAssessment(row: AssessmentRow): Assessment {
  const amounts = Object.fromEntries(
    AMOUNT_FIELDS.map((field) => [field, row[field]?.toNumber() ?? null])
  ) as Record<(typeof AMOUNT_FIELDS)[number], number | null>;

  return {
    id: row.id,
    clientId: row.clientId,
    programEnrollmentId: row.programEnrollmentId,
    caseId: row.caseId,
    dataCollectionStage: row.dataCollectionStage,
    type: toAssessmentType(row.type),
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    score: row.score,
    scoreLabel: row.scoreLabel,
    cycleNumber: row.cycleNumber,
    assessmentDate: row.assessmentDate.toISOString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),

    situationCategory: row.situationCategory,
    situation: row.situation,
    locationDetails: row.locationDetails,
    leaseOwn60Day: row.leaseOwn60Day,
    leaveSituation14Days: row.leaveSituation14Days,
    monthsHomelessPast3Years: row.monthsHomelessPast3Years,
    movedTwoOrMore: row.movedTwoOrMore,
    resourcesToObtain: row.resourcesToObtain,
    stayLessThan7Nights: row.stayLessThan7Nights,
    subsequentResidence: row.subsequentResidence,
    institutionalStayLessThan90Days: row.institutionalStayLessThan90Days,
    rentalSubsidyType: row.rentalSubsidyType,
    chronicHomelessness: row.chronicHomelessness,
    nightBeforeStreetsEsSh: row.nightBeforeStreetsEsSh,
    timesHomelessPast3Years: row.timesHomelessPast3Years,
    lengthOfStay: row.lengthOfStay,
    verifiedBy: row.verifiedBy,

    incomeFromAnySource: row.incomeFromAnySource,
    earnedIncome: row.earnedIncome,
    earnedIncomeAmount: amounts.earnedIncomeAmount,
    ssiIncome: row.ssiIncome,
    ssiIncomeAmount: amounts.ssiIncomeAmount,
    ssdiIncome: row.ssdiIncome,
    ssdiIncomeAmount: amounts.ssdiIncomeAmount,
    unemploymentIncome: row.unemploymentIncome,
    unemploymentIncomeAmount: amounts.unemploymentIncomeAmount,
    vaServiceConnectedIncome: row.vaServiceConnectedIncome,
    vaServiceConnectedIncomeAmount: amounts.vaServiceConnectedIncomeAmount,
    vaNonServiceIncome: row.vaNonServiceIncome,
    vaNonServiceIncomeAmount: amounts.vaNonServiceIncomeAmount,
    privateDisabilityIncome: row.privateDisabilityIncome,
    privateDisabilityIncomeAmount: amounts.privateDisabilityIncomeAmount,
    workersCompIncome: row.workersCompIncome,
    workersCompIncomeAmount: amounts.workersCompIncomeAmount,
    tanfIncome: row.tanfIncome,
    tanfIncomeAmount: amounts.tanfIncomeAmount,
    generalAssistanceIncome: row.generalAssistanceIncome,
    generalAssistanceIncomeAmount: amounts.generalAssistanceIncomeAmount,
    socialSecurityRetirementIncome: row.socialSecurityRetirementIncome,
    socialSecurityRetirementIncomeAmount: amounts.socialSecurityRetirementIncomeAmount,
    pensionIncome: row.pensionIncome,
    pensionIncomeAmount: amounts.pensionIncomeAmount,
    childSupportIncome: row.childSupportIncome,
    childSupportIncomeAmount: amounts.childSupportIncomeAmount,
    alimonyIncome: row.alimonyIncome,
    alimonyIncomeAmount: amounts.alimonyIncomeAmount,
    otherIncome: row.otherIncome,
    otherIncomeAmount: amounts.otherIncomeAmount,
    otherIncomeSpecify: row.otherIncomeSpecify,

    benefitsFromAnySource: row.benefitsFromAnySource,
    snapBenefit: row.snapBenefit,
    wicBenefit: row.wicBenefit,
    tanfChildCareBenefit: row.tanfChildCareBenefit,
    tanfTransportationBenefit: row.tanfTransportationBenefit,
    otherTanfBenefit: row.otherTanfBenefit,
    soarConnection: row.soarConnection,
    otherBenefitSource: row.otherBenefitSource,
    otherBenefitSourceSpecify: row.otherBenefitSourceSpecify,

    insuranceFromAnySource: row.insuranceFromAnySource,
    coveredByHealthInsurance: row.coveredByHealthInsurance,
    medicaid: row.medicaid,
    medicaidNoReason: row.medicaidNoReason,
    medicare: row.medicare,
    medicareNoReason: row.medicareNoReason,
    schip: row.schip,
    schipNoReason: row.schipNoReason,
    vha: row.vha,
    vhaNoReason: row.vhaNoReason,
    employerInsurance: row.employerInsurance,
    employerInsuranceNoReason: row.employerInsuranceNoReason,
    cobra: row.cobra,
    cobraNoReason: row.cobraNoReason,
    privatePayInsurance: row.privatePayInsurance,
    privatePayInsuranceNoReason: row.privatePayInsuranceNoReason,
    stateInsurance: row.stateInsurance,
    stateInsuranceNoReason: row.stateInsuranceNoReason,
    ihs: row.ihs,
    ihsNoReason: row.ihsNoReason,
    adap: row.adap,
    adapNoReason: row.adapNoReason,
    ryanWhite: row.ryanWhite,
    ryanWhiteNoReason: row.ryanWhiteNoReason,
    otherInsurance: row.otherInsurance,
    otherInsuranceNoReason: row.otherInsuranceNoReason,
    otherInsuranceSpecify: row.otherInsuranceSpecify,

    generalHealthStatus: row.generalHealthStatus,
    dentalHealthStatus: row.dentalHealthStatus,
    mentalHealthStatus: row.mentalHealthStatus,
    pregnancyStatus: row.pregnancyStatus,
    pregnancyDueDate: row.pregnancyDueDate ? row.pregnancyDueDate.toISOString() : null,
    domesticViolenceSurvivor: row.domesticViolenceSurvivor,
    dvWhenOccurred: row.dvWhenOccurred,
    dvCurrentlyFleeing: row.dvCurrentlyFleeing,
  };
}

/** The Living-Situation / Income-Benefits-Insurance / Health-DV section fields shared by
 * both `AssessmentInput` and `AssessmentUpdateInput`, plus the optional `status`
 * passthrough the service accepts on create. `type`/`dueDate`/`cycleNumber` are
 * scheduling fields handled explicitly by the service, same as `dataCollectionStage`
 * — not part of the generic section passthrough. */
type AssessmentSectionFields = Omit<
  AssessmentInput,
  'clientId' | 'programEnrollmentId' | 'caseId' | 'dataCollectionStage' | 'type' | 'dueDate' | 'cycleNumber'
>;

/** Plain-value shape (no Prisma `FieldUpdateOperationsInput` wrappers) that satisfies
 * both `AssessmentUncheckedCreateInput` and `AssessmentUncheckedUpdateInput` for every
 * section field — Prisma accepts a bare `number | null`/`string | null`/`Date` for both
 * create and update, so one return type works for both call sites. */
type AssessmentSectionWriteData = Omit<
  Prisma.AssessmentUncheckedCreateInput,
  | 'id'
  | 'clientId'
  | 'programEnrollmentId'
  | 'caseId'
  | 'dataCollectionStage'
  | 'assessmentDate'
  | 'status'
  | 'type'
  | 'dueDate'
  | 'cycleNumber'
>;

/** Field names line up 1:1 with the Prisma Unchecked create/update input shapes (both
 * accept plain `number | null` for the Decimal columns and plain `string | null`/`Date`
 * for `pregnancyDueDate`), so this is a direct pass-through, not a per-field
 * conversion — the identifying fields (`clientId`, `programEnrollmentId`, `caseId`,
 * `dataCollectionStage`) are handled separately by the service/model. */
export function assessmentSectionFieldsToWriteData(
  input: AssessmentSectionFields | Partial<AssessmentSectionFields>
): AssessmentSectionWriteData {
  return { ...input };
}

/** Global Command Center list + per-enrollment Assessments tab list — both read
 * through `AssessmentListRow` (joined client/programEnrollment names). */
export function toAssessmentListItem(row: AssessmentListRow): AssessmentListItem {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    programEnrollmentId: row.programEnrollmentId,
    programEnrollmentName: row.programEnrollment.name,
    dataCollectionStage: row.dataCollectionStage,
    type: toAssessmentType(row.type),
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    assessmentDate: row.assessmentDate.toISOString(),
    status: row.status,
    score: row.score,
    scoreLabel: row.scoreLabel,
  };
}

/** `GET /api/assessments/:id` — list-row shape plus the fields only the detail view needs. */
export function toAssessmentDetail(row: AssessmentListRow): AssessmentDetail {
  return {
    ...toAssessmentListItem(row),
    caseId: row.caseId,
    cycleNumber: row.cycleNumber,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
