import { forwardRef, useImperativeHandle, useMemo } from 'react';
import type { HudOption } from '@housing360/types';
import type { GatedFieldRule } from '../../../components/ui';
import { GatedField } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { markStepComplete } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';
import { GENERIC_YES_NO_HUD_KEY, useAssessmentDraft } from './assessmentDraft';

/** Referentially-stable fallback so `hudOptions?.x ?? EMPTY_OPTIONS` doesn't defeat the `rules` useMemo below every render. */
const EMPTY_OPTIONS: HudOption[] = [];

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';
const rowClass = 'grid grid-cols-1 items-end gap-5 sm:grid-cols-3';

/**
 * `nonCashBenefitSources` (server-side) maps to field names irregularly —
 * see AssessmentIncomeBenefitsInsurance in packages/types/src/assessments.ts.
 */
const BENEFIT_FIELD_MAP: Record<string, string> = {
  snap: 'snapBenefit',
  wic: 'wicBenefit',
  tanfChildCare: 'tanfChildCareBenefit',
  tanfTransportation: 'tanfTransportationBenefit',
  otherTanf: 'otherTanfBenefit',
  soar: 'soarConnection',
};

/** `healthInsuranceTypes` (server-side) -> {yesField, reasonField}, also irregular. */
const INSURANCE_FIELD_MAP: Record<string, { yesField: string; reasonField: string }> = {
  medicaid: { yesField: 'medicaid', reasonField: 'medicaidNoReason' },
  medicare: { yesField: 'medicare', reasonField: 'medicareNoReason' },
  schip: { yesField: 'schip', reasonField: 'schipNoReason' },
  vha: { yesField: 'vha', reasonField: 'vhaNoReason' },
  employer: { yesField: 'employerInsurance', reasonField: 'employerInsuranceNoReason' },
  cobra: { yesField: 'cobra', reasonField: 'cobraNoReason' },
  privatePay: { yesField: 'privatePayInsurance', reasonField: 'privatePayInsuranceNoReason' },
  state: { yesField: 'stateInsurance', reasonField: 'stateInsuranceNoReason' },
  ihs: { yesField: 'ihs', reasonField: 'ihsNoReason' },
  adap: { yesField: 'adap', reasonField: 'adapNoReason' },
  ryanWhite: { yesField: 'ryanWhite', reasonField: 'ryanWhiteNoReason' },
  other: { yesField: 'otherInsurance', reasonField: 'otherInsuranceNoReason' },
};

export const Step5IncomeBenefits = forwardRef<StepHandle>(function Step5IncomeBenefits(_props, ref) {
  const dispatch = useAppDispatch();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const { draft, updateDraft } = useAssessmentDraft();

  const genericYesNo = hudOptions?.[GENERIC_YES_NO_HUD_KEY] ?? EMPTY_OPTIONS;
  const incomeSourceOptions = hudOptions?.incomeSources ?? EMPTY_OPTIONS;
  const nonCashBenefitOptions = (hudOptions?.nonCashBenefitSources ?? EMPTY_OPTIONS).filter(
    (o) => o.value !== 'other'
  );
  const otherBenefitLabel =
    hudOptions?.nonCashBenefitSources?.find((o) => o.value === 'other')?.label ?? 'Other benefit source';
  const healthInsuranceOptions = hudOptions?.healthInsuranceTypes ?? EMPTY_OPTIONS;
  const insuranceReasonOptions = hudOptions?.insuranceReasonCodes ?? EMPTY_OPTIONS;

  /**
   * One flat declarative rule set for the whole step — every "Yes gates an
   * Amount" and "No gates a reason" pair, plus the three section-level
   * toggles (`incomeFromAnySource`/`benefitsFromAnySource`/
   * `insuranceFromAnySource`) disabling (not hiding) their section's rows.
   * Individual insurance-type rows are additionally hidden outright when
   * `coveredByHealthInsurance` isn't Yes — a visibility gate, not a disable
   * gate, per the spec's explicit distinction.
   */
  const rules: GatedFieldRule[] = useMemo(() => {
    const list: GatedFieldRule[] = [];

    for (const option of incomeSourceOptions) {
      const yesField = `${option.value}Income`;
      const amountField = `${option.value}IncomeAmount`;
      list.push({ targetField: yesField, sourceField: 'incomeFromAnySource', enablingValue: '1' });
      list.push({ targetField: amountField, sourceField: yesField, enablingValue: '1' });
    }

    for (const option of nonCashBenefitOptions) {
      const yesField = BENEFIT_FIELD_MAP[option.value] ?? `${option.value}Benefit`;
      list.push({ targetField: yesField, sourceField: 'benefitsFromAnySource', enablingValue: '1' });
    }
    list.push({ targetField: 'otherBenefitSource', sourceField: 'benefitsFromAnySource', enablingValue: '1' });

    list.push({ targetField: 'coveredByHealthInsurance', sourceField: 'insuranceFromAnySource', enablingValue: '1' });
    for (const option of healthInsuranceOptions) {
      const mapping = INSURANCE_FIELD_MAP[option.value];
      if (!mapping) continue;
      list.push({ targetField: mapping.yesField, sourceField: 'coveredByHealthInsurance', enablingValue: '1' });
      list.push({ targetField: mapping.reasonField, sourceField: mapping.yesField, enablingValue: '0' });
    }

    return list;
  }, [incomeSourceOptions, nonCashBenefitOptions, healthInsuranceOptions]);

  const values = draft as Record<string, unknown>;

  function clearField(field: string) {
    updateDraft({ [field]: null });
  }

  useImperativeHandle(ref, () => ({
    async save() {
      // Validate-only per the spec — persisting happens once, at step 6.
      dispatch(markStepComplete(5));
      return true;
    },
  }));

  return (
    <div className="flex flex-col gap-9">
      <h2 className="text-lg font-semibold text-ink">Income, Benefits, and Insurance</h2>

      {/* --- Income --- */}
      <section className="flex flex-col gap-5">
        <h3 className="text-md font-semibold text-ink">Income</h3>
        <label className={fieldWrapClass}>
          <span className={labelClass}>Income From Any Source</span>
          <select
            value={draft.incomeFromAnySource ?? ''}
            onChange={(event) => updateDraft({ incomeFromAnySource: event.target.value || null })}
            className={`${inputClass} max-w-sm`}
          >
            <option value="">Select an answer</option>
            {genericYesNo.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {incomeSourceOptions.map((option) => {
          const yesField = `${option.value}Income`;
          const amountField = `${option.value}IncomeAmount`;
          return (
            <div key={option.value} className={rowClass}>
              <GatedField rules={rules} values={values} fieldName={yesField} onGateClose={clearField}>
                {(disabled) => (
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>{option.label}</span>
                    <select
                      value={(draft as Record<string, unknown>)[yesField] as string ?? ''}
                      disabled={disabled}
                      onChange={(event) => updateDraft({ [yesField]: event.target.value || null })}
                      className={inputClass}
                    >
                      <option value="">Select an answer</option>
                      {genericYesNo.map((yn) => (
                        <option key={yn.value} value={yn.value}>
                          {yn.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </GatedField>
              <GatedField rules={rules} values={values} fieldName={amountField} onGateClose={clearField}>
                {(disabled) => (
                  <label className={fieldWrapClass}>
                    <span className={labelClass}>Amount</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={disabled}
                      value={(draft as Record<string, unknown>)[amountField] as number | string ?? ''}
                      onChange={(event) =>
                        updateDraft({ [amountField]: event.target.value === '' ? null : Number(event.target.value) })
                      }
                      className={inputClass}
                    />
                  </label>
                )}
              </GatedField>
            </div>
          );
        })}

        <div className={rowClass}>
          <label className={fieldWrapClass}>
            <span className={labelClass}>Other Income Specify</span>
            <input
              type="text"
              value={draft.otherIncomeSpecify ?? ''}
              onChange={(event) => updateDraft({ otherIncomeSpecify: event.target.value || null })}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* --- Non-Cash Benefits --- */}
      <section className="flex flex-col gap-5">
        <h3 className="text-md font-semibold text-ink">Non-Cash Benefits</h3>
        <label className={fieldWrapClass}>
          <span className={labelClass}>Benefits From Any Source</span>
          <select
            value={draft.benefitsFromAnySource ?? ''}
            onChange={(event) => updateDraft({ benefitsFromAnySource: event.target.value || null })}
            className={`${inputClass} max-w-sm`}
          >
            <option value="">Select an answer</option>
            {genericYesNo.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {nonCashBenefitOptions.map((option) => {
          const yesField = BENEFIT_FIELD_MAP[option.value] ?? `${option.value}Benefit`;
          return (
            <GatedField key={option.value} rules={rules} values={values} fieldName={yesField} onGateClose={clearField}>
              {(disabled) => (
                <label className={`${fieldWrapClass} max-w-sm`}>
                  <span className={labelClass}>{option.label}</span>
                  <select
                    value={(draft as Record<string, unknown>)[yesField] as string ?? ''}
                    disabled={disabled}
                    onChange={(event) => updateDraft({ [yesField]: event.target.value || null })}
                    className={inputClass}
                  >
                    <option value="">Select an answer</option>
                    {genericYesNo.map((yn) => (
                      <option key={yn.value} value={yn.value}>
                        {yn.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </GatedField>
          );
        })}

        <div className={rowClass}>
          <GatedField rules={rules} values={values} fieldName="otherBenefitSource" onGateClose={clearField}>
            {(disabled) => (
              <label className={fieldWrapClass}>
                <span className={labelClass}>{otherBenefitLabel}</span>
                <select
                  value={draft.otherBenefitSource ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateDraft({ otherBenefitSource: event.target.value || null })}
                  className={inputClass}
                >
                  <option value="">Select an answer</option>
                  {genericYesNo.map((yn) => (
                    <option key={yn.value} value={yn.value}>
                      {yn.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </GatedField>
          <label className={fieldWrapClass}>
            <span className={labelClass}>Other Benefit Source Specify</span>
            <input
              type="text"
              value={draft.otherBenefitSourceSpecify ?? ''}
              onChange={(event) => updateDraft({ otherBenefitSourceSpecify: event.target.value || null })}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      {/* --- Health Insurance --- */}
      <section className="flex flex-col gap-5">
        <h3 className="text-md font-semibold text-ink">Health Insurance</h3>
        <div className={rowClass}>
          <label className={fieldWrapClass}>
            <span className={labelClass}>Insurance From Any Source</span>
            <select
              value={draft.insuranceFromAnySource ?? ''}
              onChange={(event) => updateDraft({ insuranceFromAnySource: event.target.value || null })}
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

          <GatedField rules={rules} values={values} fieldName="coveredByHealthInsurance" onGateClose={clearField}>
            {(disabled) => (
              <label className={fieldWrapClass}>
                <span className={labelClass}>Covered by Health Insurance</span>
                <select
                  value={draft.coveredByHealthInsurance ?? ''}
                  disabled={disabled}
                  onChange={(event) => updateDraft({ coveredByHealthInsurance: event.target.value || null })}
                  className={inputClass}
                >
                  <option value="">Select an answer</option>
                  {genericYesNo.map((yn) => (
                    <option key={yn.value} value={yn.value}>
                      {yn.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </GatedField>
        </div>

        {draft.coveredByHealthInsurance === '1'
          ? healthInsuranceOptions.map((option) => {
              const mapping = INSURANCE_FIELD_MAP[option.value];
              if (!mapping) return null;
              return (
                <div key={option.value} className={rowClass}>
                  <GatedField rules={rules} values={values} fieldName={mapping.yesField} onGateClose={clearField}>
                    {(disabled) => (
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>{option.label}</span>
                        <select
                          value={(draft as Record<string, unknown>)[mapping.yesField] as string ?? ''}
                          disabled={disabled}
                          onChange={(event) => updateDraft({ [mapping.yesField]: event.target.value || null })}
                          className={inputClass}
                        >
                          <option value="">Select an answer</option>
                          {genericYesNo.map((yn) => (
                            <option key={yn.value} value={yn.value}>
                              {yn.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </GatedField>
                  <GatedField rules={rules} values={values} fieldName={mapping.reasonField} onGateClose={clearField}>
                    {(disabled) => (
                      <label className={fieldWrapClass}>
                        <span className={labelClass}>No Reason</span>
                        <select
                          value={(draft as Record<string, unknown>)[mapping.reasonField] as string ?? ''}
                          disabled={disabled}
                          onChange={(event) => updateDraft({ [mapping.reasonField]: event.target.value || null })}
                          className={inputClass}
                        >
                          <option value="">Select a reason</option>
                          {insuranceReasonOptions.map((reason) => (
                            <option key={reason.value} value={reason.value}>
                              {reason.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </GatedField>
                </div>
              );
            })
          : null}

        {draft.coveredByHealthInsurance === '1' ? (
          <div className={rowClass}>
            <label className={fieldWrapClass}>
              <span className={labelClass}>Other Insurance Specify</span>
              <input
                type="text"
                value={draft.otherInsuranceSpecify ?? ''}
                onChange={(event) => updateDraft({ otherInsuranceSpecify: event.target.value || null })}
                className={inputClass}
              />
            </label>
          </div>
        ) : null}
      </section>
    </div>
  );
});
