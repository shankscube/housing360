import type {
  CeAppliedOverride,
  CeAssessment,
  CeAssessmentDetail,
  CeAssessmentFlags,
  CeFlagOverride,
  CeQuestion,
  CeRuleChange,
  CeScoreBand,
} from '@housing360/types';
import type {
  CeAssessmentRow,
  CeFlagOverrideRow,
  CeQuestionRow,
  CeRuleChangeRow,
  CeScoreBandRow,
} from './coordinatedEntry.model';

export function toCeQuestion(row: CeQuestionRow): CeQuestion {
  return {
    id: row.id,
    text: row.text,
    clientFacingPrompt: row.clientFacingPrompt,
    sequence: row.sequence,
    isActive: row.isActive,
    weightNote: row.weightNote,
    answerOptions: row.answerOptions.map((option) => ({
      id: option.id,
      questionId: option.questionId,
      text: option.text,
      score: option.score,
    })),
  };
}

export function toCeScoreBand(row: CeScoreBandRow): CeScoreBand {
  return {
    id: row.id,
    name: row.name,
    minScore: row.minScore,
    maxScore: row.maxScore,
    description: row.description,
    badgeColor: row.badgeColor,
    recommendedProjectTypeCodes: row.recommendedProjectTypeCodes,
  };
}

export function toCeFlagOverride(row: CeFlagOverrideRow): CeFlagOverride {
  return {
    id: row.id,
    flag: row.flag,
    triggerQuestionId: row.triggerQuestionId,
    triggerMinScore: row.triggerMinScore,
    behavior: row.behavior as CeFlagOverride['behavior'],
    externalReferralMessage: row.externalReferralMessage,
  };
}

export function toCeRuleChange(row: CeRuleChangeRow): CeRuleChange {
  return {
    id: row.id,
    ruleTable: row.ruleTable,
    ruleId: row.ruleId,
    actorId: row.actorId,
    actorName: `${row.actor.firstName} ${row.actor.lastName}`,
    before: row.before,
    after: row.after,
    changedAt: row.changedAt.toISOString(),
  };
}

export function toCeAssessmentFlags(flags: unknown): CeAssessmentFlags {
  const raw = (flags ?? {}) as Partial<CeAssessmentFlags>;
  return {
    veteran: Boolean(raw.veteran),
    unaccompaniedYouth: Boolean(raw.unaccompaniedYouth),
    safetyAlert: Boolean(raw.safetyAlert),
  };
}

export function toCeAssessment(row: CeAssessmentRow): CeAssessment {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    assessedById: row.assessedById,
    assessedAt: row.assessedAt.toISOString(),
    totalScore: row.totalScore,
    bandId: row.bandId,
    bandName: row.band?.name ?? null,
    flags: toCeAssessmentFlags(row.flags),
    referralId: row.referralId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface CeRecommendationOutcome {
  recommendedProjectTypes: string[];
  appliedOverrides: CeAppliedOverride[];
  referralSuppressed: boolean;
  externalReferralMessage?: string;
  previousAssessments: CeAssessment[];
}

export function toCeAssessmentDetail(row: CeAssessmentRow, outcome: CeRecommendationOutcome): CeAssessmentDetail {
  return {
    ...toCeAssessment(row),
    responses: row.responses.map((response) => ({
      questionId: response.questionId,
      questionText: response.question.text,
      answerOptionId: response.answerOptionId,
      answerText: response.answerOption.text,
      score: response.score,
    })),
    appliedOverrides: outcome.appliedOverrides,
    recommendedProjectTypes: outcome.recommendedProjectTypes,
    referralSuppressed: outcome.referralSuppressed,
    externalReferralMessage: outcome.externalReferralMessage,
    previousAssessments: outcome.previousAssessments,
  };
}
