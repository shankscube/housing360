import type { AssessmentHealthDv, HudOptionsResponse } from '@housing360/types';
import { GatedField, type GatedFieldRule } from '../GatedField';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

const PREGNANCY_DUE_DATE_RULES: GatedFieldRule[] = [
  { targetField: 'pregnancyDueDate', sourceField: 'pregnancyStatus', enablingValue: '1' },
];

export interface HealthDvSectionProps {
  values: AssessmentHealthDv;
  onChange: (patch: Partial<AssessmentHealthDv>) => void;
  hudOptions: HudOptionsResponse | null;
}

/**
 * HUD 4.11 / R-series Health and Domestic Violence form section — pure,
 * props-driven markup extracted from the intake wizard's
 * `Step6HealthDv.tsx` (now a thin wrapper). No Redux, no direct API calls, no
 * `assessmentDraft.ts` import.
 */
export function HealthDvSection({ values, onChange, hudOptions }: HealthDvSectionProps) {
  const healthStatusOptions = hudOptions?.healthStatus ?? [];
  const pregnancyStatusOptions = hudOptions?.pregnancyStatus ?? [];
  const dvSurvivorOptions = hudOptions?.domesticViolenceSurvivor ?? [];
  const dvWhenOccurredOptions = hudOptions?.dvWhenOccurred ?? [];
  const dvCurrentlyFleeingOptions = hudOptions?.dvCurrentlyFleeing ?? [];

  function handleSurvivorChange(value: string) {
    // Not explicitly required by the spec, but follows the same
    // hide-and-clear idiom the Income & Benefits section uses for insurance
    // rows: DV follow-up fields only make sense once "survivor" is Yes.
    onChange({
      domesticViolenceSurvivor: value || null,
      ...(value !== '1' ? { dvWhenOccurred: null, dvCurrentlyFleeing: null } : {}),
    });
  }

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Health and Domestic Violence</h2>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3">
        <label className={fieldWrapClass}>
          <span className={labelClass}>General Health Status</span>
          <select
            value={values.generalHealthStatus ?? ''}
            onChange={(event) => onChange({ generalHealthStatus: event.target.value || null })}
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
            value={values.dentalHealthStatus ?? ''}
            onChange={(event) => onChange({ dentalHealthStatus: event.target.value || null })}
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
            value={values.mentalHealthStatus ?? ''}
            onChange={(event) => onChange({ mentalHealthStatus: event.target.value || null })}
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
            value={values.pregnancyStatus ?? ''}
            onChange={(event) =>
              onChange({
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
          values={values as Record<string, unknown>}
          fieldName="pregnancyDueDate"
          onGateClose={() => onChange({ pregnancyDueDate: null })}
        >
          {(disabled) => (
            <label className={fieldWrapClass}>
              <span className={labelClass}>Pregnancy Due Date</span>
              <input
                type="date"
                value={values.pregnancyDueDate ?? ''}
                disabled={disabled}
                onChange={(event) => onChange({ pregnancyDueDate: event.target.value || null })}
                className={inputClass}
              />
            </label>
          )}
        </GatedField>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Domestic Violence Survivor</span>
          <select
            value={values.domesticViolenceSurvivor ?? ''}
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

        {values.domesticViolenceSurvivor === '1' ? (
          <>
            <label className={fieldWrapClass}>
              <span className={labelClass}>When Occurred</span>
              <select
                value={values.dvWhenOccurred ?? ''}
                onChange={(event) => onChange({ dvWhenOccurred: event.target.value || null })}
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
                value={values.dvCurrentlyFleeing ?? ''}
                onChange={(event) => onChange({ dvCurrentlyFleeing: event.target.value || null })}
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
}
