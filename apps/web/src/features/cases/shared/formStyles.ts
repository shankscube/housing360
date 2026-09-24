/**
 * Shared form-field styling for every modal/form `case-workspace` adds (New
 * Case, Edit Case, Task forms, Interaction Summary form, Care Plan wizard,
 * referral/disbursement/bed forms, the ROI form, …) — one definition instead
 * of each form repeating the same literal classes, matching the
 * `intake`/`IntakeWizard` steps' own `inputClass`/`labelClass` convention.
 */
export const fieldWrapClass = 'flex flex-col gap-2';
export const labelClass = 'text-sm font-semibold text-ink';
export const inputClass =
  'w-full rounded-md border border-borderStrong bg-surface px-5 py-3.5 text-sm text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
export const textareaClass = `${inputClass} min-h-24 resize-y`;
export const errorTextClass = 'text-xs font-medium text-coralDeep';
export const formGridClass = 'grid grid-cols-1 gap-6 sm:grid-cols-2';
export const formActionsClass = 'mt-8 flex justify-end gap-4';
