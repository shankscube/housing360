import type { AssessmentLivingSituation, HudOptionsResponse } from '@housing360/types';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

/**
 * There is no dedicated HUD option key for a generic Yes/No/8/9/99 field —
 * `apps/api/src/constants/hudOptions.ts` only exposes that value/label list
 * under names tied to a specific field's meaning. This mirrors
 * `apps/web/src/features/intake/steps/assessmentDraft.ts`'s
 * `GENERIC_YES_NO_HUD_KEY` — kept as a local literal (not imported) so this
 * component stays free of any wizard-specific module. Keep the two in sync
 * until a real generic `yesNoDisclosure` HUD key exists server-side.
 */
const GENERIC_YES_NO_HUD_KEY = 'disablingCondition';

/**
 * Category values (`situationCategory`) map onto `situationType`'s label
 * suffix — every `situationType` option's label ends with its category in
 * parens (e.g. "Emergency shelter (Homeless)"), so filtering by that suffix
 * reliably derives "the Situation options for this category" without a
 * second server-side list. See `apps/api/src/constants/hudOptions.ts`.
 */
const CATEGORY_LABEL_SUFFIX: Record<string, string> = {
  homeless: '(Homeless)',
  institutional: '(Institutional)',
  temporary: '(Temporary)',
  permanent: '(Permanent)',
  other: '(Other)',
};

export interface LivingSituationSectionProps {
  values: AssessmentLivingSituation;
  onChange: (patch: Partial<AssessmentLivingSituation>) => void;
  hudOptions: HudOptionsResponse | null;
}

/**
 * HUD 3.917 Living Situation form section — pure, props-driven markup
 * extracted from the intake wizard's `Step4LivingSituation.tsx` (see that
 * file, now a thin wrapper) so the upcoming Assessment form modal can reuse
 * the exact same fields without duplicating them. No Redux, no direct API
 * calls, no `assessmentDraft.ts` import.
 */
export function LivingSituationSection({ values, onChange, hudOptions }: LivingSituationSectionProps) {
  const genericYesNo = hudOptions?.[GENERIC_YES_NO_HUD_KEY] ?? [];
  const situationCategoryOptions = hudOptions?.situationCategory ?? [];
  const situationTypeOptions = values.situationCategory
    ? (hudOptions?.situationType ?? []).filter((option) =>
        option.label.includes(CATEGORY_LABEL_SUFFIX[values.situationCategory as string] ?? '')
      )
    : [];
  const rentalSubsidyOptions = hudOptions?.rentalSubsidyType ?? [];
  const isPermanent = values.situationCategory === 'permanent';

  function handleCategoryChange(value: string) {
    // Changing category clears both Situation and Rental Subsidy Type — see
    // the "Living Situation Step Gates on Situation Category" requirement.
    onChange({ situationCategory: value || null, situation: null, rentalSubsidyType: null });
  }

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Living Situation</h2>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <label className={fieldWrapClass}>
          <span className={labelClass}>Situation Type Category</span>
          <select
            value={values.situationCategory ?? ''}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className={inputClass}
          >
            <option value="">Select a category</option>
            {situationCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Situation</span>
          <select
            value={values.situation ?? ''}
            onChange={(event) => onChange({ situation: event.target.value || null })}
            disabled={!values.situationCategory}
            className={inputClass}
          >
            <option value="">Select a situation</option>
            {situationTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Location Details</span>
          <input
            type="text"
            value={values.locationDetails ?? ''}
            onChange={(event) => onChange({ locationDetails: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Rental Subsidy Type</span>
          <select
            value={values.rentalSubsidyType ?? ''}
            onChange={(event) => onChange({ rentalSubsidyType: event.target.value || null })}
            disabled={!isPermanent}
            className={inputClass}
          >
            <option value="">Select a subsidy type</option>
            {rentalSubsidyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {(
          [
            ['leaseOwn60Day', 'Lease/Own 60-Day'],
            ['leaveSituation14Days', 'Leave Situation 14 Days'],
            ['movedTwoOrMore', 'Moved Two or More Times'],
            ['resourcesToObtain', 'Resources to Obtain Housing'],
            ['stayLessThan7Nights', 'Stay Less Than 7 Nights'],
            ['institutionalStayLessThan90Days', 'Institutional Stay Less Than 90 Days'],
            ['chronicHomelessness', 'Chronic Homelessness'],
          ] as const
        ).map(([field, label]) => (
          <label key={field} className={fieldWrapClass}>
            <span className={labelClass}>{label}</span>
            <select
              value={(values[field] as string | null) ?? ''}
              onChange={(event) => onChange({ [field]: event.target.value || null })}
              className={inputClass}
            >
              <option value="">Select an answer</option>
              {genericYesNo.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label className={fieldWrapClass}>
          <span className={labelClass}>Months Homeless Past 3 Years</span>
          <input
            type="number"
            min={0}
            value={values.monthsHomelessPast3Years ?? ''}
            onChange={(event) => onChange({ monthsHomelessPast3Years: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Times Homeless Past 3 Years</span>
          <input
            type="number"
            min={0}
            value={values.timesHomelessPast3Years ?? ''}
            onChange={(event) => onChange({ timesHomelessPast3Years: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Subsequent Residence</span>
          <input
            type="text"
            value={values.subsequentResidence ?? ''}
            onChange={(event) => onChange({ subsequentResidence: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Night Before: Streets/ES/SH</span>
          <input
            type="text"
            value={values.nightBeforeStreetsEsSh ?? ''}
            onChange={(event) => onChange({ nightBeforeStreetsEsSh: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Length of Stay</span>
          <input
            type="text"
            value={values.lengthOfStay ?? ''}
            onChange={(event) => onChange({ lengthOfStay: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Verified By</span>
          <input
            type="text"
            value={values.verifiedBy ?? ''}
            onChange={(event) => onChange({ verifiedBy: event.target.value || null })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}
