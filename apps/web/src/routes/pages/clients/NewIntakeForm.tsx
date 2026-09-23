import { useEffect, useState, type FormEvent } from 'react';
import type {
  ClientIntakeInput,
  DisclosureField,
  DisclosureStatus,
  Sex,
} from '@housing360/types';
import { Button } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createClient, resetIntakeForm } from '../../../store/slices/clientsSlice';

export interface NewIntakeFormProps {
  /** Called once the client has actually been created (status `'created'`). */
  onCreated: () => void;
  /** Called when the user backs out of the form without creating anything. */
  onCancel: () => void;
}

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

type HouseholdMode = 'new' | 'existing';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

/**
 * Intake form for a new client. Presented inline (expand/collapse under the
 * My Clients "New Intake" button) rather than in a modal — there is no shared
 * Modal component in this codebase yet, and this screen isn't the place to
 * build one (see the standing rule on not inlining new shared components).
 */
export function NewIntakeForm({ onCreated, onCancel }: NewIntakeFormProps) {
  const dispatch = useAppDispatch();
  const { status, candidates, error } = useAppSelector((state) => state.clients.intakeForm);

  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('female');
  const [raceEthnicity, setRaceEthnicity] = useState('');

  const [householdMode, setHouseholdMode] = useState<HouseholdMode>('new');
  const [householdId, setHouseholdId] = useState('');
  const [isHeadOfHousehold, setIsHeadOfHousehold] = useState(true);

  const [ssnStatus, setSsnStatus] = useState<DisclosureStatus>('provided');
  const [ssnValue, setSsnValue] = useState('');
  const [dobStatus, setDobStatus] = useState<DisclosureStatus>('provided');
  const [dobValue, setDobValue] = useState('');

  const [lastInput, setLastInput] = useState<ClientIntakeInput | null>(null);

  useEffect(() => {
    if (status === 'succeeded') {
      onCreated();
      dispatch(resetIntakeForm());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function buildInput(): ClientIntakeInput {
    const ssn: DisclosureField<string> =
      ssnStatus === 'provided' ? { status: 'provided', value: ssnValue } : { status: ssnStatus, value: null };
    const dob: DisclosureField<string> =
      dobStatus === 'provided' ? { status: 'provided', value: dobValue } : { status: dobStatus, value: null };

    return {
      name,
      sex,
      raceEthnicity,
      ssn,
      dob,
      isHeadOfHousehold,
      ...(householdMode === 'existing' && householdId ? { householdId } : {}),
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = buildInput();
    setLastInput(input);
    dispatch(createClient(input));
  }

  function handleCreateAnyway() {
    if (!lastInput) return;
    dispatch(createClient({ ...lastInput, confirmDuplicate: true }));
  }

  function handleCancel() {
    dispatch(resetIntakeForm());
    onCancel();
  }

  const isSubmitting = status === 'submitting';
  const showDuplicates = status === 'duplicates_found';

  return (
    <div className="border-t border-borderSubtle bg-surfaceMuted px-9 py-9">
      <h2 className="text-lg font-semibold text-ink">New Intake</h2>

      {showDuplicates ? (
        <div className="mt-6 rounded-lg border border-borderStrong bg-surface p-7">
          <p className="text-sm font-semibold text-ink">
            Possible duplicate client{candidates.length > 1 ? 's' : ''} found
          </p>
          <p className="mt-1 text-sm text-textMuted">
            These existing records match on name, date of birth, and SSN. Review before creating a
            new record.
          </p>
          <ul className="mt-5 flex flex-col gap-3">
            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="rounded-md border border-borderRow bg-surfaceMuted px-6 py-4 text-sm text-ink"
              >
                {/*
                  Candidates are `ClientListItem` — SSN/DOB are omitted from
                  this shape by design (see the My Clients table masking
                  note), so only name, sex, and race/ethnicity are shown here.
                */}
                <span className="font-semibold">{candidate.name}</span>
                <span className="ml-3 text-textMuted">
                  {candidate.sex} · {candidate.raceEthnicity}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-4">
            <Button variant="primary" size="sm" onClick={handleCreateAnyway} disabled={isSubmitting}>
              Create anyway
            </Button>
            <Button variant="tertiary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-7">
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
            <label className={fieldWrapClass}>
              <span className={labelClass}>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className={inputClass}
              />
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>Sex</span>
              <select
                value={sex}
                onChange={(event) => setSex(event.target.value as Sex)}
                className={inputClass}
              >
                {SEX_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>Race and Ethnicity</span>
              <input
                type="text"
                value={raceEthnicity}
                onChange={(event) => setRaceEthnicity(event.target.value)}
                required
                className={inputClass}
              />
            </label>

            <div className={fieldWrapClass}>
              <span className={labelClass}>Household</span>
              <div className="mt-2 flex gap-5 text-sm text-ink">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="householdMode"
                    checked={householdMode === 'new'}
                    onChange={() => setHouseholdMode('new')}
                  />
                  Start a new household
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="householdMode"
                    checked={householdMode === 'existing'}
                    onChange={() => setHouseholdMode('existing')}
                  />
                  Join an existing household
                </label>
              </div>
              {householdMode === 'existing' ? (
                <input
                  type="text"
                  value={householdId}
                  onChange={(event) => setHouseholdId(event.target.value)}
                  placeholder="Household ID"
                  required
                  className={inputClass}
                />
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={isHeadOfHousehold}
                onChange={(event) => setIsHeadOfHousehold(event.target.checked)}
              />
              Head of household
            </label>
          </div>

          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
            <div className={fieldWrapClass}>
              <span className={labelClass}>SSN</span>
              <div className="mt-2 flex gap-4">
                <input
                  type="text"
                  value={ssnValue}
                  onChange={(event) => setSsnValue(event.target.value)}
                  disabled={ssnStatus !== 'provided'}
                  placeholder="XXX-XX-XXXX"
                  className={`${inputClass} mt-0 flex-1`}
                />
                <select
                  value={ssnStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as DisclosureStatus;
                    setSsnStatus(nextStatus);
                    if (nextStatus !== 'provided') setSsnValue('');
                  }}
                  className={`${inputClass} mt-0 w-56`}
                >
                  {DISCLOSURE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={fieldWrapClass}>
              <span className={labelClass}>Date of Birth</span>
              <div className="mt-2 flex gap-4">
                <input
                  type="date"
                  value={dobValue}
                  onChange={(event) => setDobValue(event.target.value)}
                  disabled={dobStatus !== 'provided'}
                  className={`${inputClass} mt-0 flex-1`}
                />
                <select
                  value={dobStatus}
                  onChange={(event) => {
                    const nextStatus = event.target.value as DisclosureStatus;
                    setDobStatus(nextStatus);
                    if (nextStatus !== 'provided') setDobValue('');
                  }}
                  className={`${inputClass} mt-0 w-56`}
                >
                  {DISCLOSURE_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-coralDeep">{error}</p> : null}

          <div className="flex gap-4">
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Create Client'}
            </Button>
            <Button type="button" variant="tertiary" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
