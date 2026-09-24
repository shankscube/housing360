/**
 * PROVISIONAL — the real HUD housing-stability scoring algorithm and the real
 * VI-SPDAT-style vulnerability instrument are both flagged as needing their
 * own dedicated design pass (see `assessments-and-coordinated-entry`'s
 * design.md, Decision 2). Everything in this file is a clearly-labeled
 * placeholder: a small fixed-weight tally, not a tuned or clinically
 * validated model. It exists so the Assessment Command Center and
 * Coordinated Entry have real, responsive numbers to render, with the seam
 * already in the right place for the real scoring design to drop into later.
 */

const HUD_YES_CODES = new Set(['1', 'yes', 'true']);

function isYes(value: string | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return HUD_YES_CODES.has(value.toLowerCase());
  return false;
}

export interface AssessmentScoringInput {
  type: 'entry' | 'annual' | 'exit';
  chronicHomelessness?: string | null;
  monthsHomelessPast3Years?: string | null;
  incomeFromAnySource?: string | null;
  disabilityCount?: number;
  domesticViolenceSurvivor?: string | null;
}

export interface AssessmentScoreResult {
  score: number;
  label: string;
}

export interface VulnerabilityScoringInput {
  chronicHomelessness?: boolean;
  monthsHomelessPast3Years?: number | null;
  disablingCondition?: boolean;
  domesticViolenceSurvivor?: boolean;
  veteranStatus?: boolean;
  unaccompaniedYouth?: boolean;
}

export type PriorityTier = 'high' | 'medium' | 'low';

export interface VulnerabilityScoreResult {
  score: number;
  priorityTier: PriorityTier;
}

export interface ScoringService {
  scoreAssessment(input: AssessmentScoringInput): AssessmentScoreResult;
  scoreVulnerability(input: VulnerabilityScoringInput): VulnerabilityScoreResult;
}

/** Bands are placeholders, not clinical cutoffs — see this file's header comment. */
function labelForScore(score: number): string {
  if (score >= 67) return 'At Risk';
  if (score >= 34) return 'Needs Support';
  return 'Strong';
}

function priorityTierForScore(score: number): PriorityTier {
  if (score >= 67) return 'high';
  if (score >= 34) return 'medium';
  return 'low';
}

function clampScore(rawScore: number): number {
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/** PROVISIONAL weighted tally — see this file's header comment. */
function scoreAssessment(input: AssessmentScoringInput): AssessmentScoreResult {
  let points = 0;

  if (isYes(input.chronicHomelessness)) points += 30;

  const monthsHomeless = Number(input.monthsHomelessPast3Years);
  if (Number.isFinite(monthsHomeless)) {
    points += Math.min(monthsHomeless, 24) * 1.25;
  }

  if (!isYes(input.incomeFromAnySource)) points += 20;
  if (isYes(input.domesticViolenceSurvivor)) points += 15;
  points += Math.min(input.disabilityCount ?? 0, 3) * 5;

  const score = clampScore(points);
  return { score, label: labelForScore(score) };
}

/** PROVISIONAL weighted tally — see this file's header comment. */
function scoreVulnerability(input: VulnerabilityScoringInput): VulnerabilityScoreResult {
  let points = 0;

  if (input.chronicHomelessness) points += 25;
  if (input.disablingCondition) points += 20;
  if (input.domesticViolenceSurvivor) points += 20;
  if (input.unaccompaniedYouth) points += 15;
  if (input.veteranStatus) points += 10;

  const monthsHomeless = input.monthsHomelessPast3Years ?? 0;
  points += Math.min(monthsHomeless, 24) * 0.4;

  const score = clampScore(points);
  return { score, priorityTier: priorityTierForScore(score) };
}

export const scoringService: ScoringService = {
  scoreAssessment,
  scoreVulnerability,
};
