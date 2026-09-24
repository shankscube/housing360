/**
 * `CoordinatedEntryService` (per the task brief's naming — kept in this
 * separate `coordinatedEntryEngine.service.ts` file, distinct from the
 * orchestration file `coordinatedEntry.service.ts`, mirroring how the
 * assessment side splits `AssessmentEligibilityService`/
 * `HousingStabilityScoringService` out of `assessment.service.ts`).
 *
 * Replaces the deleted `scoring.service.ts`'s `scoreVulnerability` placeholder
 * with the configurable question/scoring/override model
 * (assessment-and-ce-workspace design.md Decision 6):
 *   1. Sum the chosen `CeAnswerOption.score` values -> `score`.
 *   2. Find the `CeScoreBand` whose `[minScore, maxScore]` (inclusive both
 *      ends) contains `score` -> `band`, and parse its comma-separated
 *      `recommendedProjectTypeCodes` into the *base* recommended list.
 *   3. Evaluate every `CeFlagOverride` row in a FIXED order — Safety Alert,
 *      then Veteran, then Unaccompanied Youth — applying each one whose
 *      `flag` is set AND (if `triggerQuestionId` is set) whose trigger
 *      question's answered score meets `triggerMinScore`.
 *
 * KNOWN SCHEMA GAP (flagged in this change's report, not guessed around):
 * `CeFlagOverride` has no column holding "this override's own recommended
 * project types." The task brief explicitly says to implement `add` as
 * appending nothing extra (band types only) and flag the gap rather than add
 * a migration-free workaround. The same gap means `replace` has nothing to
 * replace WITH either — it's implemented here as clearing the working list to
 * `[]` (a real, visible effect) rather than silently leaving it unchanged, so
 * "this override applied" is never a no-op lie. Both need a follow-up schema
 * decision (e.g. `CeFlagOverride.recommendedProjectTypeCodes`).
 */

import type { CeAppliedOverride, CeAssessmentFlags, CeFlagOverrideBehavior } from '@housing360/types';
import {
  findAllFlagOverrides,
  findAnswerOptionsByIds,
  findScoreBandContainingScore,
  findScoreBandById,
  type CeFlagOverrideRow,
} from '../models/coordinatedEntry.model';
import { AppError } from '../utils/AppError';

/** Safety Alert, then Veteran, then Unaccompanied Youth (design.md Decision 6). */
const FLAG_EVALUATION_ORDER: (keyof CeAssessmentFlags)[] = ['safetyAlert', 'veteran', 'unaccompaniedYouth'];

export interface CeScoringResponseInput {
  questionId: string;
  answerOptionId: string;
}

export interface CeScoringResponseScore {
  questionId: string;
  answerOptionId: string;
  score: number;
}

export interface CeRecommendationOutcome {
  bandName: string | null;
  recommendedProjectTypes: string[];
  appliedOverrides: CeAppliedOverride[];
  referralSuppressed: boolean;
  externalReferralMessage?: string;
}

export interface CeScoringResult extends CeRecommendationOutcome {
  score: number;
  bandId: string | null;
  responseScores: CeScoringResponseScore[];
}

function parseProjectTypeCodes(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
}

function applyFlagOverrides(
  baseProjectTypes: string[],
  flags: CeAssessmentFlags,
  responseScoresByQuestionId: Map<string, number>,
  overrideRows: CeFlagOverrideRow[]
): {
  recommendedProjectTypes: string[];
  appliedOverrides: CeAppliedOverride[];
  referralSuppressed: boolean;
  externalReferralMessage?: string;
} {
  let recommendedProjectTypes = [...baseProjectTypes];
  const appliedOverrides: CeAppliedOverride[] = [];
  let referralSuppressed = false;
  let externalReferralMessage: string | undefined;

  for (const flagKey of FLAG_EVALUATION_ORDER) {
    if (!flags[flagKey]) continue;

    const matchingRows = overrideRows.filter((row) => row.flag === flagKey);
    for (const row of matchingRows) {
      if (row.triggerQuestionId) {
        const questionScore = responseScoresByQuestionId.get(row.triggerQuestionId);
        const meetsThreshold =
          questionScore !== undefined && row.triggerMinScore !== null && questionScore >= row.triggerMinScore;
        if (!meetsThreshold) continue;
      }

      appliedOverrides.push({ flag: row.flag, behavior: row.behavior as CeFlagOverrideBehavior });

      if (row.behavior === 'replace') {
        // See this file's header comment — no data source for what to
        // replace WITH, so the working list is cleared rather than left
        // stale.
        recommendedProjectTypes = [];
      }
      // 'add' appends nothing today — same schema gap, see header comment.

      if (flagKey === 'safetyAlert') {
        referralSuppressed = true;
        externalReferralMessage = row.externalReferralMessage ?? externalReferralMessage;
      }
    }
  }

  return { recommendedProjectTypes, appliedOverrides, referralSuppressed, externalReferralMessage };
}

/**
 * Fresh scoring for a `POST /api/ce/assessments` submission. Validates that
 * every `answerOptionId` exists and belongs to its paired `questionId`.
 */
export async function score(
  responses: CeScoringResponseInput[],
  flags: CeAssessmentFlags
): Promise<CeScoringResult> {
  if (!responses || responses.length === 0) {
    throw new AppError(400, 'At least one response is required');
  }

  const answerOptions = await findAnswerOptionsByIds(responses.map((r) => r.answerOptionId));
  const answerOptionById = new Map(answerOptions.map((option) => [option.id, option]));

  let total = 0;
  const responseScoresByQuestionId = new Map<string, number>();
  const responseScores: CeScoringResponseScore[] = [];

  for (const response of responses) {
    const option = answerOptionById.get(response.answerOptionId);
    if (!option) {
      throw new AppError(400, `Answer option ${response.answerOptionId} not found`);
    }
    if (option.questionId !== response.questionId) {
      throw new AppError(
        400,
        `Answer option ${response.answerOptionId} does not belong to question ${response.questionId}`
      );
    }
    total += option.score;
    responseScoresByQuestionId.set(response.questionId, option.score);
    responseScores.push({ questionId: response.questionId, answerOptionId: response.answerOptionId, score: option.score });
  }

  const band = await findScoreBandContainingScore(total);
  const baseProjectTypes = parseProjectTypeCodes(band?.recommendedProjectTypeCodes);
  const overrideRows = await findAllFlagOverrides();

  const outcome = applyFlagOverrides(baseProjectTypes, flags, responseScoresByQuestionId, overrideRows);

  return {
    score: total,
    bandId: band?.id ?? null,
    bandName: band?.name ?? null,
    responseScores,
    ...outcome,
  };
}

/**
 * Recomputes the recommendation/overrides for an already-persisted
 * `CeAssessment` — used by the detail and client-recommendation read
 * endpoints, which don't store `appliedOverrides`/`recommendedProjectTypes`
 * as columns (see `coordinatedEntry.mapper.ts`'s `CeAssessmentDetail` doc
 * comment for why: recomputing from `flags` + persisted `CeResponse.score`
 * keeps read-time results always consistent with the current rule
 * configuration, at the cost of one extra query per read).
 */
export async function deriveRecommendation(
  bandId: string | null,
  flags: CeAssessmentFlags,
  responseScores: { questionId: string; score: number }[]
): Promise<CeRecommendationOutcome> {
  const band = bandId ? await findScoreBandById(bandId) : null;
  const baseProjectTypes = parseProjectTypeCodes(band?.recommendedProjectTypeCodes);
  const overrideRows = await findAllFlagOverrides();
  const responseScoresByQuestionId = new Map(responseScores.map((r) => [r.questionId, r.score]));

  const outcome = applyFlagOverrides(baseProjectTypes, flags, responseScoresByQuestionId, overrideRows);
  return { bandName: band?.name ?? null, ...outcome };
}
