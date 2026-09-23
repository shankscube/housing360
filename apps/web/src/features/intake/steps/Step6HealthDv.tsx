import { forwardRef, useImperativeHandle } from 'react';
import type { AssessmentInput, AssessmentUpdateInput } from '@housing360/types';
import { GatedField, type GatedFieldRule, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete, saveEntryAssessment } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { useAssessmentDraft } from './assessmentDraft';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

const PREGNANCY_DUE_DATE_RULES: GatedFieldRule[] = [
  { targetField: 'pregnancyDueDate', sourceField: 'pregnancyStatus', enablingValue: '1' },
];

export const Step6HealthDv = forwardRef<StepHandle>(function Step6HealthDv(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const ids = useAppSelector((state) => state.intake.ids);
  const { draft, updateDraft } = useAssessmentDraft();

  const healthStatusOptions = hudOptions?.healthStatus ?? [];
  const pregnancyStatusOptions = hudOptions?.pregnancyStatus ?? [];
  const dvSurvivorOptions = hudOptions?.domesticViolenceSurvivor ?? [];
  const dvWhenOccurredOptions = hudOptions?.dvWhenOccurred ?? [];
  const dvCurrentlyFleeingOptions = hudOptions?.dvCurrentlyFleeing ?? [];

  function handleSurvivorChange(value: string) {
    // Not explicitly required by the spec, but follows the same
    // hide-and-clear idiom step 5 uses for insurance rows: DV follow-up
    // fields only make sense once "survivor" is Yes.
    updateDraft({
      domesticViolenceSurvivor: value || null,
      ...(value !== '1' ? { dvWhenOccurred: null, dvCurrentlyFleeing: null } : {}),
    });
  }

  useImperativeHandle(ref, () => ({
    async save() {
      const { clientId, enrollmentId, caseId, assessmentId } = ids;
      if (!clientId || !enrollmentId || !caseId) {
        showToast('Missing client, enrollment, or case information — go back and complete earlier steps.');
        return false;
      }

      // Steps 4-6 all write into the one shared draft; this is the single
      // save covering all three sections (design.md: "single Entry
      // Assessment record").
      const input = assessmentId
        ? ({ ...draft } as AssessmentUpdateInput)
        : ({ ...draft, clientId, programEnrollmentId: enrollmentId, caseId } as AssessmentInput);

      const result = await dispatch(saveEntryAssessment({ assessmentId, input }));
      if (saveEntryAssessment.fulfilled.match(result)) {
        dispatch(markStepComplete(4));
        dispatch(markStepComplete(5));
        dispatch(markStepComplete(6));
        return true;
      }

      showToast('Failed to save the Entry Assessment. Please try again.');
      return false;
    },
  }));

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Health and Domestic Violence</h2>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
        <label className={fieldWrapClass}>
          <span className={labelClass}>General Health Status</span>
          <select
            value={draft.generalHealthStatus ?? ''}
            onChange={(event) => updateDraft({ generalHealthStatus: event.target.value || null })}
            className={inputClass}
          >
            <option value="">Select an answer</option>
            {healthStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Dental Health Status</span>
          <select
            value={draft.dentalHealthStatus ?? ''}
            onChange={(event) => updateDraft({ dentalHealthStatus: event.target.value || null })}
            className={inputClass}
          >
            <option value="">Select an answer</option>
            {healthStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Mental Health Status</span>
          <select
            value={draft.mentalHealthStatus ?? ''}
            onChange={(event) => updateDraft({ mentalHealthStatus: event.target.value || null })}
            className={inputClass}
          >
            <option value="">Select an answer</option>
            {healthStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Pregnancy Status</span>
          <select
            value={draft.pregnancyStatus ?? ''}
            onChange={(event) =>
              updateDraft({
                pregnancyStatus: event.target.value || null,
                ...(event.target.value !== '1' ? { pregnancyDueDate: null } : {}),
              })
            }
            className={inputClass}
          >
            <option value="">Select an answer</option>
            {pregnancyStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <GatedField
          rules={PREGNANCY_DUE_DATE_RULES}
          values={draft as Record<string, unknown>}
          fieldName="pregnancyDueDate"
          onGateClose={() => updateDraft({ pregnancyDueDate: null })}
        >
          {(disabled) => (
            <label className={fieldWrapClass}>
              <span className={labelClass}>Pregnancy Due Date</span>
              <input
                type="date"
                value={draft.pregnancyDueDate ?? ''}
                disabled={disabled}
                onChange={(event) => updateDraft({ pregnancyDueDate: event.target.value || null })}
                className={inputClass}
              />
            </label>
          )}
        </GatedField>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Domestic Violence Survivor</span>
          <select
            value={draft.domesticViolenceSurvivor ?? ''}
            onChange={(event) => handleSurvivorChange(event.target.value)}
            className={inputClass}
          >
            <option value="">Select an answer</option>
            {dvSurvivorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {draft.domesticViolenceSurvivor === '1' ? (
          <>
            <label className={fieldWrapClass}>
              <span className={labelClass}>When Occurred</span>
              <select
                value={draft.dvWhenOccurred ?? ''}
                onChange={(event) => updateDraft({ dvWhenOccurred: event.target.value || null })}
                className={inputClass}
              >
                <option value="">Select an answer</option>
                {dvWhenOccurredOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>Currently Fleeing</span>
              <select
                value={draft.dvCurrentlyFleeing ?? ''}
                onChange={(event) => updateDraft({ dvCurrentlyFleeing: event.target.value || null })}
                className={inputClass}
              >
                <option value="">Select an answer</option>
                {dvCurrentlyFleeingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}
      </div>
    </div>
  );
});
