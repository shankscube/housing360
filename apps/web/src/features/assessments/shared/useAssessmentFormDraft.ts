import { useCallback, useState } from 'react';
import type {
  AssessmentHealthDv,
  AssessmentIncomeBenefitsInsurance,
  AssessmentLivingSituation,
} from '@housing360/types';

/**
 * The same combined shape `features/intake/steps/assessmentDraft.ts` defines
 * for its module-level singleton (`AssessmentDraft`) — Living Situation +
 * Income/Benefits/Insurance + Health & DV all flattened onto one object,
 * since `LivingSituationSection`/`IncomeBenefitsSection`/`HealthDvSection`
 * all read/write a slice of it. Defined independently here (not imported
 * from `assessmentDraft.ts`) so this hook has zero dependency on the wizard's
 * module — see this file's own doc comment for why a second, *local*, draft
 * store is needed instead of reusing that singleton.
 */
export type AssessmentFormDraft = AssessmentLivingSituation &
  AssessmentIncomeBenefitsInsurance &
  AssessmentHealthDv;

export interface UseAssessmentFormDraftResult {
  draft: AssessmentFormDraft;
  /** Merges a partial patch into the draft — same semantics as `assessmentDraft.ts`'s `updateAssessmentDraft`. */
  updateDraft: (patch: Partial<AssessmentFormDraft>) => void;
  /** Replaces the whole draft — for "Carry forward previous answers" and for re-seeding when the modal opens for a different assessment. */
  resetDraft: (next: Partial<AssessmentFormDraft>) => void;
}

/**
 * A small, `useState`-based draft store for the upcoming Assessment form
 * modal (Assessment Command Center + Case detail's Assessments tab) —
 * deliberately NOT `features/intake/steps/assessmentDraft.ts`'s module-level
 * singleton. That singleton is keyed only by `clientId` with no per-instance
 * isolation: if the modal reused it, opening the modal while the intake
 * wizard is also open (or opening two instances of the modal, e.g. Command
 * Center + a Case tab in different tabs) would collide, since both would read
 * and write the exact same module-level object. A plain `useState` scoped to
 * this hook's call site gives every mounted modal instance its own draft with
 * no extra wiring, at the cost of a few more lines than reusing the
 * singleton — see design.md's "New Assessment form modal doesn't reuse the
 * wizard's `assessmentDraft.ts` singleton" trade-off.
 */
export function useAssessmentFormDraft(initial: Partial<AssessmentFormDraft> = {}): UseAssessmentFormDraftResult {
  const [draft, setDraft] = useState<AssessmentFormDraft>(() => ({ ...initial }));

  const updateDraft = useCallback((patch: Partial<AssessmentFormDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const resetDraft = useCallback((next: Partial<AssessmentFormDraft>) => {
    setDraft({ ...next });
  }, []);

  return { draft, updateDraft, resetDraft };
}
