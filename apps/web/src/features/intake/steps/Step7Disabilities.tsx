import { forwardRef, useImperativeHandle, useState } from 'react';
import type { DisabilityInput } from '@housing360/types';
import { Button, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addDisability, markStepComplete, removeDisability } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { GENERIC_YES_NO_HUD_KEY } from './assessmentDraft';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

type DisabilityFormState = Omit<DisabilityInput, 'assessmentId'>;

const EMPTY_FORM: DisabilityFormState = {
  disabilityType: '',
  response: '',
  indefiniteAndImpairs: null,
  antiRetroviral: null,
  tCellAvailable: null,
  tCellCount: null,
  tCellSource: null,
  viralLoadAvailable: null,
  viralLoad: null,
  viralLoadSource: null,
};

/** The HUD code for HIV/AIDS in the `disabilityType` list — see hudOptions.ts. */
const HIV_AIDS_TYPE_VALUE = 'hivAids';
/** The "Yes" code shared by every YES_NO_DISCLOSURE-backed list, including `disabilityResponse`. */
const YES_VALUE = '1';

export const Step7Disabilities = forwardRef<StepHandle>(function Step7Disabilities(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const assessmentId = useAppSelector((state) => state.intake.ids.assessmentId);
  const items = useAppSelector((state) => state.intake.disabilities.items);

  const [form, setForm] = useState<DisabilityFormState>(EMPTY_FORM);
  const [noneChecked, setNoneChecked] = useState(false);

  const genericYesNo = hudOptions?.[GENERIC_YES_NO_HUD_KEY] ?? [];
  const disabilityTypeOptions = hudOptions?.disabilityType ?? [];
  const disabilityResponseOptions = hudOptions?.disabilityResponse ?? [];
  const tCellSourceOptions = hudOptions?.tCellSource ?? [];
  const viralLoadSourceOptions = hudOptions?.viralLoadSource ?? [];

  const showHivFields = form.disabilityType === HIV_AIDS_TYPE_VALUE && form.response === YES_VALUE;

  function patchForm(patch: Partial<DisabilityFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  async function submitCurrentForm(): Promise<boolean> {
    if (!assessmentId) {
      showToast('Missing assessment — go back and complete the Health & DV step.');
      return false;
    }
    const result = await dispatch(addDisability({ assessmentId, input: form }));
    if (addDisability.fulfilled.match(result)) {
      setForm(EMPTY_FORM);
      return true;
    }
    showToast('Failed to save the disability record. Please try again.');
    return false;
  }

  async function handleAddAnother() {
    if (!form.disabilityType || !form.response) {
      showToast('Select a disability type and response before adding.');
      return;
    }
    await submitCurrentForm();
  }

  function handleRemove(id: string) {
    dispatch(removeDisability(id));
  }

  useImperativeHandle(ref, () => ({
    async save() {
      let itemCount = items.length;

      // "A partially filled form is saved, then the wizard advances" — an
      // in-progress form with a Type already selected is submitted for the
      // case manager rather than silently discarded.
      if (form.disabilityType) {
        const submitted = await submitCurrentForm();
        if (!submitted) return false;
        itemCount += 1;
      }

      if (itemCount === 0 && !noneChecked) {
        showToast("Add at least one disability record, or check 'No known disabilities to record' to continue.");
        return false;
      }

      dispatch(markStepComplete(7));
      return true;
    },
  }));

  return (
    <div className="flex flex-col gap-7">
      <h2 className="text-lg font-semibold text-ink">Disabilities</h2>

      <div className="rounded-lg border border-borderStrong bg-surface p-7">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
          <label className={fieldWrapClass}>
            <span className={labelClass}>Type</span>
            <select
              value={form.disabilityType}
              onChange={(event) => patchForm({ disabilityType: event.target.value })}
              className={inputClass}
            >
              <option value="">Select a type</option>
              {disabilityTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Response</span>
            <select
              value={form.response}
              onChange={(event) => patchForm({ response: event.target.value })}
              className={inputClass}
            >
              <option value="">Select an answer</option>
              {disabilityResponseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Indefinite and Impairs</span>
            <select
              value={form.indefiniteAndImpairs ?? ''}
              onChange={(event) => patchForm({ indefiniteAndImpairs: event.target.value || null })}
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

          {showHivFields ? (
            <>
              <label className={fieldWrapClass}>
                <span className={labelClass}>Anti-Retroviral</span>
                <select
                  value={form.antiRetroviral ?? ''}
                  onChange={(event) => patchForm({ antiRetroviral: event.target.value || null })}
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

              <label className={fieldWrapClass}>
                <span className={labelClass}>T-Cell Available</span>
                <select
                  value={form.tCellAvailable ?? ''}
                  onChange={(event) =>
                    patchForm({
                      tCellAvailable: event.target.value || null,
                      ...(event.target.value !== YES_VALUE ? { tCellCount: null, tCellSource: null } : {}),
                    })
                  }
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

              {form.tCellAvailable === YES_VALUE ? (
                <>
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>T-Cell Count</span>
                    <input
                      type="number"
                      min={0}
                      value={form.tCellCount ?? ''}
                      onChange={(event) =>
                        patchForm({ tCellCount: event.target.value === '' ? null : Number(event.target.value) })
                      }
                      className={inputClass}
                    />
                  </label>
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>T-Cell Source</span>
                    <select
                      value={form.tCellSource ?? ''}
                      onChange={(event) => patchForm({ tCellSource: event.target.value || null })}
                      className={inputClass}
                    >
                      <option value="">Select a source</option>
                      {tCellSourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}

              <label className={fieldWrapClass}>
                <span className={labelClass}>Viral Load Available</span>
                <select
                  value={form.viralLoadAvailable ?? ''}
                  onChange={(event) =>
                    patchForm({
                      viralLoadAvailable: event.target.value || null,
                      ...(event.target.value !== YES_VALUE ? { viralLoad: null, viralLoadSource: null } : {}),
                    })
                  }
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

              {form.viralLoadAvailable === YES_VALUE ? (
                <>
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Viral Load</span>
                    <input
                      type="text"
                      value={form.viralLoad ?? ''}
                      onChange={(event) => patchForm({ viralLoad: event.target.value || null })}
                      className={inputClass}
                    />
                  </label>
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Viral Load Source</span>
                    <select
                      value={form.viralLoadSource ?? ''}
                      onChange={(event) => patchForm({ viralLoadSource: event.target.value || null })}
                      className={inputClass}
                    >
                      <option value="">Select a source</option>
                      {viralLoadSourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="mt-7">
          <Button variant="secondary" size="sm" onClick={handleAddAnother}>
            + Add Another Disability
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={noneChecked}
            onChange={(event) => setNoneChecked(event.target.checked)}
          />
          No known disabilities to record
        </label>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-md border border-borderRow bg-surfaceMuted px-6 py-4 text-sm text-ink"
            >
              <span>
                <span className="font-semibold">
                  {disabilityTypeOptions.find((option) => option.value === item.disabilityType)?.label ??
                    item.disabilityType}
                </span>
                <span className="ml-3 text-textMuted">
                  {disabilityResponseOptions.find((option) => option.value === item.response)?.label ?? item.response}
                </span>
              </span>
              <Button variant="tertiary" size="sm" onClick={() => handleRemove(item.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
