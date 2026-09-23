import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { GENERIC_YES_NO_HUD_KEY, seedAssessmentDraftOnce, useAssessmentDraft } from './assessmentDraft';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

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

export const Step4LivingSituation = forwardRef<StepHandle>(function Step4LivingSituation(_props, ref) {
  const dispatch = useAppDispatch();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const clientId = useAppSelector((state) => state.intake.ids.clientId);
  const assessmentCurrent = useAppSelector((state) => state.intake.assessment.current);
  const { draft, updateDraft } = useAssessmentDraft();

  // Seed the shared steps-4-6 draft once per client from whatever the wizard
  // already knows about this enrollment's Entry Assessment (empty for a
  // brand-new client). See assessmentDraft.ts for why this is keyed on
  // clientId rather than running on every mount.
  useEffect(() => {
    if (clientId) {
      seedAssessmentDraftOnce(clientId, assessmentCurrent ?? undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const genericYesNo = hudOptions?.[GENERIC_YES_NO_HUD_KEY] ?? [];
  const situationCategoryOptions = hudOptions?.situationCategory ?? [];
  const situationTypeOptions = draft.situationCategory
    ? (hudOptions?.situationType ?? []).filter((option) =>
        option.label.includes(CATEGORY_LABEL_SUFFIX[draft.situationCategory as string] ?? '')
      )
    : [];
  const rentalSubsidyOptions = hudOptions?.rentalSubsidyType ?? [];
  const isPermanent = draft.situationCategory === 'permanent';

  function handleCategoryChange(value: string) {
    // Changing category clears both Situation and Rental Subsidy Type — see
    // the "Living Situation Step Gates on Situation Category" requirement.
    updateDraft({ situationCategory: value || null, situation: null, rentalSubsidyType: null });
  }

  useImperativeHandle(ref, () => ({
    async save() {
      // No required-field validation is specified for this step beyond the
      // category-gating behavior itself — persisting happens once, at step
      // 6's save, covering steps 4-6 together.
      dispatch(markStepComplete(4));
      return true;
    },
  }));

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Living Situation</h2>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <label className={fieldWrapClass}>
          <span className={labelClass}>Situation Type Category</span>
          <select
            value={draft.situationCategory ?? ''}
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
            value={draft.situation ?? ''}
            onChange={(event) => updateDraft({ situation: event.target.value || null })}
            disabled={!draft.situationCategory}
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
            value={draft.locationDetails ?? ''}
            onChange={(event) => updateDraft({ locationDetails: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Rental Subsidy Type</span>
          <select
            value={draft.rentalSubsidyType ?? ''}
            onChange={(event) => updateDraft({ rentalSubsidyType: event.target.value || null })}
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
              value={(draft[field] as string | null) ?? ''}
              onChange={(event) => updateDraft({ [field]: event.target.value || null })}
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
            value={draft.monthsHomelessPast3Years ?? ''}
            onChange={(event) => updateDraft({ monthsHomelessPast3Years: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Times Homeless Past 3 Years</span>
          <input
            type="number"
            min={0}
            value={draft.timesHomelessPast3Years ?? ''}
            onChange={(event) => updateDraft({ timesHomelessPast3Years: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Subsequent Residence</span>
          <input
            type="text"
            value={draft.subsequentResidence ?? ''}
            onChange={(event) => updateDraft({ subsequentResidence: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Night Before: Streets/ES/SH</span>
          <input
            type="text"
            value={draft.nightBeforeStreetsEsSh ?? ''}
            onChange={(event) => updateDraft({ nightBeforeStreetsEsSh: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Length of Stay</span>
          <input
            type="text"
            value={draft.lengthOfStay ?? ''}
            onChange={(event) => updateDraft({ lengthOfStay: event.target.value || null })}
            className={inputClass}
          />
        </label>

        <label className={fieldWrapClass}>
          <span className={labelClass}>Verified By</span>
          <input
            type="text"
            value={draft.verifiedBy ?? ''}
            onChange={(event) => updateDraft({ verifiedBy: event.target.value || null })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
});
