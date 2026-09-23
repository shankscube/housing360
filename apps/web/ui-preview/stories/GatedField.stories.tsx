import { useState } from 'react';
import { GatedField, type GatedFieldRule } from '../../src/components/ui';
import type { ComponentPreview } from './types';

/**
 * A slice of step 5's real config: two income sources, each a Yes/No field
 * gating its own Amount field, plus one insurance type gating its own
 * "No reason" field — one flat rule array driving three independent pairs.
 */
const RULES: GatedFieldRule[] = [
  { targetField: 'earnedIncomeAmount', sourceField: 'earnedIncomeYesNo', enablingValue: 'yes' },
  { targetField: 'ssiAmount', sourceField: 'ssiYesNo', enablingValue: 'yes' },
  { targetField: 'medicaidNoReason', sourceField: 'medicaidYesNo', enablingValue: 'no' },
];

function GatedFieldDemo() {
  const [values, setValues] = useState<Record<string, unknown>>({
    earnedIncomeYesNo: 'no',
    ssiYesNo: 'no',
    medicaidYesNo: 'yes',
  });

  function setValue(field: string, value: unknown) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex max-w-formCardWidth flex-col gap-7">
      <IncomeRow
        label="Earned Income"
        yesNoField="earnedIncomeYesNo"
        amountField="earnedIncomeAmount"
        values={values}
        setValue={setValue}
      />
      <IncomeRow
        label="SSI"
        yesNoField="ssiYesNo"
        amountField="ssiAmount"
        values={values}
        setValue={setValue}
      />

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-textMuted">
          Covered by Medicaid?
        </label>
        <select
          value={String(values.medicaidYesNo)}
          onChange={(event) => setValue('medicaidYesNo', event.target.value)}
          className="rounded-lg border border-borderStrong bg-surface px-5 py-3 text-sm text-ink"
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        <GatedField
          rules={RULES}
          values={values}
          fieldName="medicaidNoReason"
          onGateClose={(field) => setValue(field, '')}
        >
          {(disabled) => (
            <div className="mt-3">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-textMuted">
                No reason
              </label>
              <input
                type="text"
                disabled={disabled}
                value={String(values.medicaidNoReason ?? '')}
                onChange={(event) => setValue('medicaidNoReason', event.target.value)}
                placeholder={disabled ? 'Enabled only when Medicaid is No' : 'Reason'}
                className="w-full rounded-lg border border-borderStrong bg-surface px-5 py-3 text-sm text-ink disabled:cursor-not-allowed disabled:bg-surfaceSubtle disabled:text-textFaint"
              />
            </div>
          )}
        </GatedField>
      </div>
    </div>
  );
}

function IncomeRow({
  label,
  yesNoField,
  amountField,
  values,
  setValue,
}: {
  label: string;
  yesNoField: string;
  amountField: string;
  values: Record<string, unknown>;
  setValue: (field: string, value: unknown) => void;
}) {
  return (
    <div className="flex items-end gap-5">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-textMuted">
          {label}
        </label>
        <select
          value={String(values[yesNoField])}
          onChange={(event) => setValue(yesNoField, event.target.value)}
          className="rounded-lg border border-borderStrong bg-surface px-5 py-3 text-sm text-ink"
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>
      <GatedField
        rules={RULES}
        values={values}
        fieldName={amountField}
        onGateClose={(field) => setValue(field, '')}
      >
        {(disabled) => (
          <div className="flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-textMuted">
              Amount
            </label>
            <input
              type="number"
              disabled={disabled}
              value={String(values[amountField] ?? '')}
              onChange={(event) => setValue(amountField, event.target.value)}
              placeholder={disabled ? 'Enabled only when Yes' : '0.00'}
              className="w-full rounded-lg border border-borderStrong bg-surface px-5 py-3 text-sm text-ink disabled:cursor-not-allowed disabled:bg-surfaceSubtle disabled:text-textFaint"
            />
          </div>
        )}
      </GatedField>
    </div>
  );
}

export const gatedFieldPreview: ComponentPreview = {
  name: 'GatedField',
  reference: 'client-intake-wizard → Step 5 (Income & Benefits/Insurance) → Yes/No gates Amount/Reason',
  variants: [
    {
      name: 'Two income Yes/No→Amount pairs plus one insurance Yes/No→Reason pair, one shared rule array',
      element: <GatedFieldDemo />,
    },
  ],
};
