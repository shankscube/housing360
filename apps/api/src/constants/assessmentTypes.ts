/**
 * Maps the Assessment Command Center's friendly `type` to the HUD
 * `dataCollectionStage` numeric code, so the two columns on `Assessment` can
 * never drift apart. The numbering (1/2/3) is this phase's simplification of
 * HUD 3.917's real data-collection-stage codes (which distinguish "Update"
 * from "Annual assessment") — see design.md's Open Questions. Nothing
 * downstream reads the raw numeric code today, so the simplification is
 * contained to this one mapping.
 */
export type AssessmentType = 'entry' | 'annual' | 'exit';

const TYPE_TO_STAGE: Record<AssessmentType, number> = {
  entry: 1,
  annual: 2,
  exit: 3,
};

const STAGE_TO_TYPE: Record<number, AssessmentType> = {
  1: 'entry',
  2: 'annual',
  3: 'exit',
};

export function assessmentTypeToStage(type: AssessmentType): number {
  return TYPE_TO_STAGE[type];
}

export function stageToAssessmentType(stage: number): AssessmentType {
  return STAGE_TO_TYPE[stage] ?? 'entry';
}
