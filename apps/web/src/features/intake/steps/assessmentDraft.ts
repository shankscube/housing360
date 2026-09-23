import { useSyncExternalStore } from 'react';
import type {
  AssessmentHealthDv,
  AssessmentIncomeBenefitsInsurance,
  AssessmentLivingSituation,
} from '@housing360/types';

/**
 * Steps 4 (Living Situation), 5 (Income & Benefits/Insurance), and 6 (Health &
 * DV) accumulate one flat draft object across three separately-mounted step
 * components, then step 6's "Save & Next" fires exactly one
 * `saveEntryAssessment` call covering all three sections (see design.md's
 * "single Entry Assessment record" decision and the spec's "Steps 4-6 produce
 * exactly one Entry assessment record" scenario).
 *
 * SHARED-STATE APPROACH (read this before wiring the wizard shell):
 * This is a module-level store *outside* React (subscribed to via
 * `useSyncExternalStore`), not a `React.createContext` provider. The wizard
 * shell (`IntakeWizard.tsx`, built separately) is expected to mount only the
 * *active* step's component at a time per the step-config array in
 * design.md — if that's how it works, a context provider would need to wrap
 * steps 4-6 (or the whole wizard) to survive each step unmounting when the
 * case manager navigates away, which would require the shell to know about a
 * steps-4-6-specific implementation detail. A module-level store sidesteps
 * that entirely: it survives any step component unmounting/remounting with
 * zero wiring in `IntakeWizard.tsx`. **No provider needs to wrap anything —
 * this file is fully self-contained.**
 *
 * Freshness across different intakes: since this module survives for the
 * lifetime of the page (not just one wizard "session"), `seedAssessmentDraftOnce`
 * keys its one-time seed on `clientId` — call it from Step 4's mount effect
 * with `state.intake.ids.clientId` and `state.intake.assessment.current`. The
 * first time a given `clientId` is seen this page-load, the draft is reset
 * from the pre-filled/resumed assessment (or emptied, for a brand-new
 * client); revisiting step 4 for the *same* client (e.g. navigating back from
 * step 5/6 without having saved yet) does NOT reseed, so in-progress,
 * unsaved edits to steps 4/5 survive that back-navigation.
 */
export type AssessmentDraft = AssessmentLivingSituation &
  AssessmentIncomeBenefitsInsurance &
  AssessmentHealthDv;

/**
 * There is no dedicated HUD option key for a generic Yes/No/8/9/99 field —
 * `apps/api/src/constants/hudOptions.ts` only exposes that value/label list
 * under names tied to a specific field's meaning (`veteranStatus`,
 * `disablingCondition`, `pregnancyStatus`, `domesticViolenceSurvivor`,
 * `dvCurrentlyFleeing`, `disabilityResponse` — all the same underlying
 * `YES_NO_DISCLOSURE` array server-side). Steps 4-6 have many plain Yes/No
 * fields with no field-specific HUD key of their own (Lease/Own 60-Day,
 * Moved Two or More, each income source's Yes/No, each insurance type's
 * Yes/No, etc.) — per the "never hardcode an option list" rule, these all
 * read from this one *unused-elsewhere-in-steps-4-6* key rather than a
 * hand-written `['0','1','8','9','99']` array. `disablingCondition` was
 * picked because nothing in steps 4-6 uses it for its own literal meaning
 * (unlike `pregnancyStatus`/`domesticViolenceSurvivor`/`dvCurrentlyFleeing`,
 * which steps 6 uses directly). A cleaner fix would be a real generic
 * `yesNoDisclosure` key added server-side — out of scope here (apps/api is
 * off-limits for this task).
 */
export const GENERIC_YES_NO_HUD_KEY = 'disablingCondition';

const emptyDraft: AssessmentDraft = {};

let draft: AssessmentDraft = { ...emptyDraft };
let seededForClientId: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return draft;
}

/** Merges a partial patch into the shared steps 4-6 draft and notifies subscribers. */
export function updateAssessmentDraft(patch: Partial<AssessmentDraft>) {
  draft = { ...draft, ...patch };
  emit();
}

/**
 * One-time-per-client seed of the shared draft from an already-known
 * assessment (e.g. resuming an in-progress Entry Assessment, or editing a
 * complete one). Call this from Step 4's mount effect. A no-op if this
 * `clientId` has already been seeded (so in-progress edits across steps 4-6
 * aren't clobbered by navigating back to step 4).
 */
export function seedAssessmentDraftOnce(clientId: string, initial: Partial<AssessmentDraft> | null | undefined) {
  if (seededForClientId === clientId) return;
  draft = { ...emptyDraft, ...(initial ?? {}) };
  seededForClientId = clientId;
  emit();
}

/** Reads the live shared draft, reactively (re-renders on any `updateAssessmentDraft` call). */
export function useAssessmentDraft() {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { draft: value, updateDraft: updateAssessmentDraft };
}
