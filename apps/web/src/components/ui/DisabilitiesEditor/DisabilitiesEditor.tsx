import { forwardRef, useImperativeHandle, useState } from 'react';
import type { DisabilityInput, HudOptionsResponse } from '@housing360/types';
import { Button } from '../Button';
import { useToast } from '../Toast';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

/**
 * See the identical constant/comment in `LivingSituationSection.tsx` and
 * `features/intake/steps/assessmentDraft.ts`'s `GENERIC_YES_NO_HUD_KEY`. Kept
 * as a local literal so this component imports nothing wizard-specific.
 */
const GENERIC_YES_NO_HUD_KEY = 'disablingCondition';

/** The HUD code for HIV/AIDS in the `disabilityType` list — see hudOptions.ts. */
const HIV_AIDS_TYPE_VALUE = 'hivAids';
/** The "Yes" code shared by every YES_NO_DISCLOSURE-backed list, including `disabilityResponse`. */
const YES_VALUE = '1';

/**
 * A disability row with no `assessmentId` of its own — this component is
 * Redux/API-free and doesn't know which assessment it belongs to (the same
 * reason the wizard's own `addDisability` thunk already splits its args into
 * `{ assessmentId, input: Omit<DisabilityInput, 'assessmentId'> }`, and the
 * original `Step7Disabilities.tsx`'s own add-row form state was typed this
 * way). A future bulk-save consumer supplies `assessmentId` itself, once, at
 * the `PUT /api/assessments/:id/disabilities` call site.
 */
export type DisabilityRowInput = Omit<DisabilityInput, 'assessmentId'>;

const EMPTY_FORM: DisabilityRowInput = {
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

export interface DisabilitiesEditorProps {
  /** The full current list of disability rows — fully controlled, no internal copy. */
  value: DisabilityRowInput[];
  /** Fires with the whole next list whenever a row is added or removed. */
  onChange: (next: DisabilityRowInput[]) => void;
  hudOptions: HudOptionsResponse | null;
}

/**
 * Imperative escape hatch for a host that needs to flush the in-progress
 * "add a disability" row before persisting/advancing — e.g. the intake
 * wizard's "a partially filled form is saved, then the wizard advances"
 * behavior on Step 7. `getPendingRow` never mutates state or calls
 * `onChange` itself; the caller decides whether/how to append it (the
 * wizard needs to `dispatch` an API call and check the result before
 * clearing, which this component — being Redux/API-free — can't do itself).
 */
export interface DisabilitiesEditorHandle {
  /** The current add-row form, if a disability type has been selected; otherwise `null`. */
  getPendingRow: () => DisabilityRowInput | null;
  /** Resets the add-row form to empty — call after the caller has successfully persisted `getPendingRow()`'s result. */
  clearPendingRow: () => void;
}

/**
 * Pure add/remove editor for a client's disability records (child rows of an
 * Entry/Annual/Exit Assessment) — extracted from the intake wizard's
 * `Step7Disabilities.tsx` (now a thin wrapper) so the upcoming Assessment
 * form modal can reuse the exact same fields/HIV-conditional markup. The
 * list itself is fully controlled via `value`/`onChange`; only the
 * currently-being-added row's form fields are local state. No Redux, no
 * direct API calls — a host that needs per-row persistence (like the wizard)
 * diffs `value`/the list it passed in to decide what changed; a future
 * bulk-save consumer can just persist the whole `value` on its own save.
 */
export const DisabilitiesEditor = forwardRef<DisabilitiesEditorHandle, DisabilitiesEditorProps>(
  function DisabilitiesEditor({ value, onChange, hudOptions }, ref) {
    const { showToast } = useToast();
    const [form, setForm] = useState<DisabilityRowInput>(EMPTY_FORM);

    const genericYesNo = hudOptions?.[GENERIC_YES_NO_HUD_KEY] ?? [];
    const disabilityTypeOptions = hudOptions?.disabilityType ?? [];
    const disabilityResponseOptions = hudOptions?.disabilityResponse ?? [];
    const tCellSourceOptions = hudOptions?.tCellSource ?? [];
    const viralLoadSourceOptions = hudOptions?.viralLoadSource ?? [];

    const showHivFields = form.disabilityType === HIV_AIDS_TYPE_VALUE && form.response === YES_VALUE;

    function patchForm(patch: Partial<DisabilityRowInput>) {
      setForm((current) => ({ ...current, ...patch }));
    }

    function handleAddAnother() {
      if (!form.disabilityType || !form.response) {
        showToast('Select a disability type and response before adding.');
        return;
      }
      onChange([...value, form]);
      setForm(EMPTY_FORM);
    }

    function handleRemove(index: number) {
      onChange(value.filter((_, i) => i !== index));
    }

    useImperativeHandle(ref, () => ({
      getPendingRow: () => (form.disabilityType ? form : null),
      clearPendingRow: () => setForm(EMPTY_FORM),
    }));

    return (
      <div className="flex flex-col gap-7">
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

        {value.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {value.map((item, index) => (
              <li
                 
                key={index}
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
                <Button variant="tertiary" size="sm" onClick={() => handleRemove(index)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
);
