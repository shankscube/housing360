/**
 * Contract every wizard step (1-8) implements via `useImperativeHandle`.
 * The shell calls `save()` when "Save & Next"/"Save & Finish" is clicked,
 * before advancing `currentStep`. A step is responsible for its own
 * validation UI (toast, inline banner, etc.) when `save()` resolves `false`
 * — the shell does not show a generic error on false, it just stays put.
 */
export interface StepHandle {
  /** Validates and (per-step) persists this step's data. Resolves `true` to advance, `false` to stay. */
  save: () => Promise<boolean>;
}
