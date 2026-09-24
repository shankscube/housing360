import { Prisma } from '@prisma/client';
import type { AssessmentScoreContributionItem } from '@housing360/types';
import { findActiveScoringRules, type ScoringRuleRow } from '../models/scoringRule.model';

export interface HousingStabilityScoreResult {
  score: number;
  label: string;
  contributions: AssessmentScoreContributionItem[];
}

/** Bands ported unchanged from the deleted placeholder `scoring.service.ts`'s
 * `labelForScore` — still provisional, not clinically validated (design.md's
 * Open Questions), just now driven by a configurable rule table instead of a
 * fixed tally. */
function labelForScore(score: number): string {
  if (score >= 67) return 'At Risk';
  if (score >= 34) return 'Needs Support';
  return 'Strong';
}

function clampScore(rawScore: number): number {
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

/**
 * A rule matches by exact (case-insensitive) string equality against
 * `matchValue`, or — for a numeric field — by falling inside an inclusive
 * [`rangeMin`, `rangeMax`] range (either bound may be open). A rule
 * configured with neither never matches (treated as misconfigured data
 * rather than "always true"). Never both on the same rule — `matchValue`
 * wins if somehow both are set, matching the shape the seed data is
 * documented to produce (design.md Decision 4).
 */
function evaluateRule(
  rule: ScoringRuleRow,
  rawValue: unknown
): { matches: boolean; comparedValue: string | null } {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { matches: false, comparedValue: null };
  }
  const comparedValue = String(rawValue);

  if (rule.matchValue !== null) {
    return { matches: comparedValue.toLowerCase() === rule.matchValue.toLowerCase(), comparedValue };
  }

  const rangeMin = decimalToNumber(rule.rangeMin);
  const rangeMax = decimalToNumber(rule.rangeMax);
  if (rangeMin !== null || rangeMax !== null) {
    const numericValue = Number(rawValue);
    if (!Number.isFinite(numericValue)) {
      return { matches: false, comparedValue };
    }
    const withinMin = rangeMin === null || numericValue >= rangeMin;
    const withinMax = rangeMax === null || numericValue <= rangeMax;
    return { matches: withinMin && withinMax, comparedValue };
  }

  return { matches: false, comparedValue };
}

/**
 * Replaces the deleted placeholder `scoring.service.ts`'s fixed-weight tally
 * with a rule-table-driven, auditable score (design.md Decision 4). Reads
 * every active `ScoringRule` and sums the `contribution` of every one whose
 * `field` matches — `fields` is the assessment's own column values (raw
 * Prisma row shape is fine, e.g. `chronicHomelessness`/
 * `monthsHomelessPast3Years`/etc.), plus the synthetic `disabilityCount`
 * field the caller computes separately (there's no `disabilityCount` column
 * on `Assessment` itself). This function is a pure read+compute — it does
 * NOT persist anything; callers (`assessment.model.ts`'s
 * `applyScoringAndExit`) write the returned `contributions` themselves, in
 * the same transaction as the assessment save, per the "score equals the sum
 * of persisted contributions" spec requirement.
 */
export async function scoreAssessment(
  fields: Record<string, unknown>,
  disabilityCount: number
): Promise<HousingStabilityScoreResult> {
  const rules = await findActiveScoringRules();
  const contributions: AssessmentScoreContributionItem[] = [];
  let total = 0;

  for (const rule of rules) {
    const rawValue = rule.field === 'disabilityCount' ? disabilityCount : fields[rule.field];
    const { matches, comparedValue } = evaluateRule(rule, rawValue);
    if (matches) {
      contributions.push({ field: rule.field, value: comparedValue, contribution: rule.contribution });
      total += rule.contribution;
    }
  }

  const score = clampScore(total);
  return { score, label: labelForScore(score), contributions };
}
