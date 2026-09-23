import { forwardRef, useImperativeHandle, useState } from 'react';
import type { DisclosureStatus, FamilyMemberInput, HouseholdMemberSummary, Sex } from '@housing360/types';
import { Button, DualListbox, Icon } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { store } from '../../../store';
import { addHouseholdMembers, markStepComplete } from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const DISCLOSURE_STATUS_OPTIONS: { value: DisclosureStatus; label: string }[] = [
  { value: 'provided', label: 'Provided' },
  { value: 'client_doesnt_know', label: "Client doesn't know" },
  { value: 'prefers_not_to_answer', label: 'Prefers not to answer' },
  { value: 'data_not_collected', label: 'Data not collected' },
];

interface DraftRow {
  _localId: string;
  firstName: string;
  lastName: string;
  sex: Sex;
  raceEthnicity: string[];
  relationshipToHoh: string;
  mobile: string;
  email: string;
  ssnStatus: DisclosureStatus;
  ssnValue: string;
  dobStatus: DisclosureStatus;
  dobValue: string;
}

const inputClass =
  'w-full rounded-md border border-borderStrong bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const cellClass = 'align-top px-4 py-4';
const headerCellClass =
  'whitespace-nowrap border-b border-borderRow px-4 py-3.5 text-left text-2xs font-semibold uppercase tracking-wide text-textMuted';

function makeLocalId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function blankRow(): DraftRow {
  return {
    _localId: makeLocalId(),
    firstName: '',
    lastName: '',
    sex: 'other',
    raceEthnicity: [],
    relationshipToHoh: '',
    mobile: '',
    email: '',
    ssnStatus: 'data_not_collected',
    ssnValue: '',
    dobStatus: 'data_not_collected',
    dobValue: '',
  };
}

function toFamilyMemberInput(row: DraftRow): FamilyMemberInput {
  return {
    firstName: row.firstName.trim(),
    lastName: row.lastName.trim(),
    ssn:
      row.ssnStatus === 'provided'
        ? { status: 'provided', value: row.ssnValue }
        : { status: row.ssnStatus, value: null },
    dob:
      row.dobStatus === 'provided'
        ? { status: 'provided', value: row.dobValue }
        : { status: row.dobStatus, value: null },
    sex: row.sex,
    raceEthnicity: row.raceEthnicity,
    relationshipToHoh: row.relationshipToHoh,
    mobile: row.mobile.trim() || undefined,
    email: row.email.trim() || undefined,
  };
}

function optionLabel(options: { value: string; label: string }[] | undefined, value: string | null): string {
  if (!value) return '—';
  return options?.find((option) => option.value === value)?.label ?? value;
}

function capitalize(value: string): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Step 2 — Family Members. Already-saved household members (from the loaded
 * intake snapshot) render read-only above the editable draft rows; only the
 * draft rows are local `useState`, since they're unsaved until "Save & Next"
 * bulk-creates them in one request.
 */
const Step2FamilyMembers = forwardRef<StepHandle>(function Step2FamilyMembers(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const savedMembers: HouseholdMemberSummary[] = useAppSelector(
    (state) => state.intake.snapshot.data?.householdMembers ?? []
  );

  const [rows, setRows] = useState<DraftRow[]>([]);

  function addRow() {
    setRows((prev) => [...prev, blankRow()]);
  }

  function removeRow(localId: string) {
    setRows((prev) => prev.filter((row) => row._localId !== localId));
  }

  function updateRow(localId: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((row) => (row._localId === localId ? { ...row, ...patch } : row)));
  }

  useImperativeHandle(ref, () => ({
    async save() {
      if (rows.length === 0) {
        dispatch(markStepComplete(2));
        return true;
      }

      const toSubmit: FamilyMemberInput[] = [];
      for (const row of rows) {
        const hasFirst = row.firstName.trim() !== '';
        const hasLast = row.lastName.trim() !== '';
        if (!hasFirst && !hasLast) {
          continue; // fully blank draft row — not real content, skip silently
        }
        if (hasFirst !== hasLast) {
          showToast('Each family member needs at least a first and last name.');
          return false;
        }
        toSubmit.push(toFamilyMemberInput(row));
      }

      if (toSubmit.length === 0) {
        dispatch(markStepComplete(2));
        return true;
      }

      const householdId = store.getState().intake.ids.householdId;
      if (!householdId) {
        showToast('Household not found — please complete Client Basic Information first.');
        return false;
      }

      const result = await dispatch(addHouseholdMembers({ householdId, members: toSubmit }));
      if (addHouseholdMembers.fulfilled.match(result)) {
        setRows([]);
        dispatch(markStepComplete(2));
        return true;
      }

      showToast('Failed to save family members. Please try again.');
      return false;
    },
  }));

  const raceOptions = hudOptions?.raceEthnicity ?? [];
  const relationshipOptions = hudOptions?.relationshipToHoh ?? [];

  return (
    <div className="rounded-lg border border-borderStrong bg-surface p-9">
      <h2 className="font-display text-xl text-ink">Family Members</h2>
      <p className="mt-1 text-sm text-textMuted">
        Already-saved household members are read-only. Add rows for anyone new to this household.
      </p>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="bg-surfaceMuted">
              <th className={headerCellClass}>First</th>
              <th className={headerCellClass}>Last</th>
              <th className={headerCellClass}>SSN</th>
              <th className={headerCellClass}>Birthdate</th>
              <th className={headerCellClass}>Sex</th>
              <th className={headerCellClass}>Race</th>
              <th className={headerCellClass}>Relationship to HoH</th>
              <th className={headerCellClass}>Mobile</th>
              <th className={headerCellClass}>Email</th>
              <th className={headerCellClass} />
            </tr>
          </thead>
          <tbody>
            {savedMembers.map((member) => (
              <tr key={member.id} className="border-b border-borderRow">
                <td className={`${cellClass} font-semibold text-ink`}>{member.firstName}</td>
                <td className={`${cellClass} text-ink`}>{member.lastName}</td>
                <td className={`${cellClass} text-textMuted`}>
                  {member.ssnLast4 ? `••${member.ssnLast4}` : '—'}
                </td>
                <td className={`${cellClass} text-textMuted`}>{member.dob ?? '—'}</td>
                <td className={`${cellClass} text-textMuted`}>{capitalize(member.sex)}</td>
                <td className={`${cellClass} text-textMuted`}>
                  {member.raceEthnicity.length > 0
                    ? member.raceEthnicity.map((code) => optionLabel(raceOptions, code)).join(', ')
                    : '—'}
                </td>
                <td className={`${cellClass} text-textMuted`}>
                  {optionLabel(relationshipOptions, member.relationshipToHoh)}
                </td>
                <td className={`${cellClass} text-textMuted`}>{member.mobile ?? '—'}</td>
                <td className={`${cellClass} text-textMuted`}>{member.email ?? '—'}</td>
                <td className={cellClass} />
              </tr>
            ))}

            {rows.map((row) => (
              <tr key={row._localId} className="border-b border-borderRow bg-surfaceMuted/40">
                <td className={cellClass}>
                  <input
                    type="text"
                    value={row.firstName}
                    onChange={(event) => updateRow(row._localId, { firstName: event.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className={cellClass}>
                  <input
                    type="text"
                    value={row.lastName}
                    onChange={(event) => updateRow(row._localId, { lastName: event.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className={cellClass}>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={row.ssnValue}
                      onChange={(event) => updateRow(row._localId, { ssnValue: event.target.value })}
                      disabled={row.ssnStatus !== 'provided'}
                      placeholder="XXX-XX-XXXX"
                      className={inputClass}
                    />
                    <select
                      value={row.ssnStatus}
                      onChange={(event) => {
                        const next = event.target.value as DisclosureStatus;
                        updateRow(row._localId, {
                          ssnStatus: next,
                          ssnValue: next === 'provided' ? row.ssnValue : '',
                        });
                      }}
                      className={inputClass}
                    >
                      {DISCLOSURE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className={cellClass}>
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={row.dobValue}
                      onChange={(event) => updateRow(row._localId, { dobValue: event.target.value })}
                      disabled={row.dobStatus !== 'provided'}
                      className={inputClass}
                    />
                    <select
                      value={row.dobStatus}
                      onChange={(event) => {
                        const next = event.target.value as DisclosureStatus;
                        updateRow(row._localId, {
                          dobStatus: next,
                          dobValue: next === 'provided' ? row.dobValue : '',
                        });
                      }}
                      className={inputClass}
                    >
                      {DISCLOSURE_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className={cellClass}>
                  <select
                    value={row.sex}
                    onChange={(event) => updateRow(row._localId, { sex: event.target.value as Sex })}
                    className={inputClass}
                  >
                    {SEX_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={`${cellClass} min-w-[320px]`}>
                  <DualListbox
                    options={raceOptions}
                    selected={row.raceEthnicity}
                    onChange={(next) => updateRow(row._localId, { raceEthnicity: next })}
                    availableLabel="Available"
                    selectedLabel="Selected"
                  />
                </td>
                <td className={cellClass}>
                  <select
                    value={row.relationshipToHoh}
                    onChange={(event) => updateRow(row._localId, { relationshipToHoh: event.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {relationshipOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={cellClass}>
                  <input
                    type="text"
                    value={row.mobile}
                    onChange={(event) => updateRow(row._localId, { mobile: event.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className={cellClass}>
                  <input
                    type="email"
                    value={row.email}
                    onChange={(event) => updateRow(row._localId, { email: event.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className={cellClass}>
                  <button
                    type="button"
                    aria-label="Remove row"
                    title="Remove"
                    onClick={() => removeRow(row._localId)}
                    className="rounded-sm p-2 text-textMuted hover:bg-surfaceSubtle hover:text-coralDeep"
                  >
                    <Icon name="close" size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {savedMembers.length === 0 && rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-9 text-center text-sm text-textMuted">
                  No family members yet. Use &ldquo;+ Add Family Member&rdquo; below to add one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Button variant="secondary" size="sm" onClick={addRow}>
          + Add Family Member
        </Button>
      </div>
    </div>
  );
});

export default Step2FamilyMembers;
