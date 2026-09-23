import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type {
  ClientIntakeInput,
  DisclosureField,
  DisclosureStatus,
  Sex,
} from '@housing360/types';
import { Button, DualListbox } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { store } from '../../../store';
import {
  createHousehold,
  markStepComplete,
  saveClientBasicInfo,
  setCurrentStep,
} from '../../../store/slices/intakeSlice';
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

/**
 * HUD `YES_NO_DISCLOSURE` code for "Yes" (see `apps/api/src/constants/hudOptions.ts`)
 * — this is the value that reveals the Veteran Details section.
 */
const VETERAN_YES_VALUE = '1';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink disabled:bg-surfaceSubtle disabled:text-textFaint';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

function fieldBorder(invalidFields: Set<string>, field: string): string {
  return invalidFields.has(field) ? 'border-coral' : '';
}

/**
 * Step 1 of the intake wizard — Client Basic Information. Owns its own local
 * form state; on `save()` it validates the required fields, then dispatches
 * `saveClientBasicInfo` (create or update, depending on whether an existing
 * client was already selected in the search phase).
 *
 * Pre-fills from `state.intake.snapshot.data.client` (the full `Client`
 * record, added to `ClientIntakeSnapshot` alongside this step) the first time
 * a snapshot for a given client id becomes available — seeded once per
 * client id so it never clobbers in-progress edits on a later re-render.
 */
const Step1ClientBasicInfo = forwardRef<StepHandle>(function Step1ClientBasicInfo(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const clientSave = useAppSelector((state) => state.intake.clientSave);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [nameDataQuality, setNameDataQuality] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [relationshipToHoh, setRelationshipToHoh] = useState('');
  const [raceEthnicity, setRaceEthnicity] = useState<string[]>([]);

  const [ssnStatus, setSsnStatus] = useState<DisclosureStatus>('data_not_collected');
  const [ssnValue, setSsnValue] = useState('');
  const [ssnDataQuality, setSsnDataQuality] = useState('');

  const [dobStatus, setDobStatus] = useState<DisclosureStatus>('provided');
  const [dobValue, setDobValue] = useState('');
  const [dobDataQuality, setDobDataQuality] = useState('');

  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  const [veteranStatus, setVeteranStatus] = useState('');
  const [militaryBranch, setMilitaryBranch] = useState('');
  const [yearEnteredService, setYearEnteredService] = useState('');
  const [dischargeStatus, setDischargeStatus] = useState('');
  const [ww2, setWw2] = useState(false);
  const [koreanWar, setKoreanWar] = useState(false);
  const [vietnamWar, setVietnamWar] = useState(false);
  const [otherTheater, setOtherTheater] = useState(false);

  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const isVeteran = veteranStatus === VETERAN_YES_VALUE;
  const veteranSectionRef = useRef<HTMLDivElement>(null);
  const showDuplicateBanner = clientSave.status === 'duplicates_found' && !bannerDismissed;

  useEffect(() => {
    if (isVeteran) {
      veteranSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isVeteran]);

  const snapshotClient = useAppSelector((state) => state.intake.snapshot.data?.client);
  const seededClientIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!snapshotClient || seededClientIdRef.current === snapshotClient.id) {
      return;
    }
    seededClientIdRef.current = snapshotClient.id;

    setFirstName(snapshotClient.firstName);
    setLastName(snapshotClient.lastName);
    setTitle(snapshotClient.title ?? '');
    setNameDataQuality(snapshotClient.nameDataQuality ?? '');
    setSex(snapshotClient.sex);
    setRelationshipToHoh(snapshotClient.relationshipToHoh ?? '');
    setRaceEthnicity(snapshotClient.raceEthnicity);
    setSsnStatus(snapshotClient.ssn.status);
    setSsnValue(snapshotClient.ssn.value ?? '');
    setSsnDataQuality(snapshotClient.ssnDataQuality ?? '');
    setDobStatus(snapshotClient.dob.status);
    setDobValue(snapshotClient.dob.value ?? '');
    setDobDataQuality(snapshotClient.dobDataQuality ?? '');
    setMobile(snapshotClient.mobile ?? '');
    setEmail(snapshotClient.email ?? '');
    setVeteranStatus(snapshotClient.veteranStatus ?? '');
    if (snapshotClient.veteranDetails) {
      setMilitaryBranch(snapshotClient.veteranDetails.militaryBranch ?? '');
      setYearEnteredService(
        snapshotClient.veteranDetails.yearEnteredService != null
          ? String(snapshotClient.veteranDetails.yearEnteredService)
          : ''
      );
      setDischargeStatus(snapshotClient.veteranDetails.dischargeStatus ?? '');
      setWw2(snapshotClient.veteranDetails.ww2 ?? false);
      setKoreanWar(snapshotClient.veteranDetails.koreanWar ?? false);
      setVietnamWar(snapshotClient.veteranDetails.vietnamWar ?? false);
      setOtherTheater(snapshotClient.veteranDetails.otherTheater ?? false);
    }
  }, [snapshotClient]);

  function buildInput(): ClientIntakeInput {
    const ssn: DisclosureField<string> =
      ssnStatus === 'provided' ? { status: 'provided', value: ssnValue } : { status: ssnStatus, value: null };
    const dob: DisclosureField<string> =
      dobStatus === 'provided' ? { status: 'provided', value: dobValue } : { status: dobStatus, value: null };

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      title: title.trim() || undefined,
      nameDataQuality: nameDataQuality || undefined,
      sex: (sex || 'other') as Sex,
      raceEthnicity,
      ssnDataQuality: ssnDataQuality || undefined,
      ssn,
      dobDataQuality: dobDataQuality || undefined,
      dob,
      mobile: mobile.trim() || undefined,
      email: email.trim() || undefined,
      veteranStatus: veteranStatus || undefined,
      veteranDetails: isVeteran
        ? {
            militaryBranch: militaryBranch || null,
            yearEnteredService: yearEnteredService ? Number(yearEnteredService) : null,
            dischargeStatus: dischargeStatus || null,
            ww2,
            koreanWar,
            vietnamWar,
            otherTheater,
          }
        : undefined,
      relationshipToHoh: relationshipToHoh || undefined,
    };
  }

  function validate(): Set<string> {
    const invalid = new Set<string>();
    if (!firstName.trim()) invalid.add('firstName');
    if (!lastName.trim()) invalid.add('lastName');
    if (!sex) invalid.add('sex');
    if (!relationshipToHoh) invalid.add('relationshipToHoh');
    if (dobStatus === 'provided' && !dobValue) invalid.add('dobValue');
    return invalid;
  }

  async function ensureHouseholdCreated(clientId: string) {
    const existingHouseholdId = store.getState().intake.ids.householdId;
    if (!existingHouseholdId) {
      await dispatch(createHousehold(clientId));
    }
  }

  async function performSave(allowDuplicate: boolean): Promise<boolean> {
    setBannerDismissed(false);
    const freshClientId = store.getState().intake.ids.clientId;
    const input = buildInput();
    const result = await dispatch(saveClientBasicInfo({ clientId: freshClientId, input, allowDuplicate }));

    if (saveClientBasicInfo.fulfilled.match(result)) {
      dispatch(markStepComplete(1));
      await ensureHouseholdCreated(result.payload.id);
      return true;
    }

    if (saveClientBasicInfo.rejected.match(result)) {
      if (result.payload?.kind === 'duplicate') {
        // Banner renders from `state.intake.clientSave.duplicateCandidates`.
        return false;
      }
      showToast(result.payload?.message ?? 'Failed to save client information.');
      return false;
    }

    return false;
  }

  async function handleSaveAnyway() {
    const succeeded = await performSave(true);
    if (succeeded) {
      // "Save Anyway ... succeeds" — interpreted as auto-advance so the case
      // manager doesn't have to click Save & Next a second time (see report).
      dispatch(setCurrentStep(2));
    }
  }

  function handleDismissBanner() {
    setBannerDismissed(true);
  }

  useImperativeHandle(ref, () => ({
    async save() {
      if (showDuplicateBanner) {
        return false;
      }
      const invalid = validate();
      if (invalid.size > 0) {
        setInvalidFields(invalid);
        showToast('Missing information: Please fill in the highlighted required fields before continuing.');
        return false;
      }
      setInvalidFields(new Set());
      return performSave(false);
    },
  }));

  const raceOptions = hudOptions?.raceEthnicity ?? [];
  const nameDqOptions = hudOptions?.nameDataQuality ?? [];
  const ssnDqOptions = hudOptions?.ssnDataQuality ?? [];
  const dobDqOptions = hudOptions?.dobDataQuality ?? [];
  const relationshipOptions = hudOptions?.relationshipToHoh ?? [];
  const veteranStatusOptions = hudOptions?.veteranStatus ?? [];
  const dischargeStatusOptions = hudOptions?.dischargeStatus ?? [];

  return (
    <div className="flex flex-col gap-7">
      <div className="rounded-lg border border-borderStrong bg-surface p-9">
        <h2 className="font-display text-xl text-ink">Client Basic Information</h2>

        {showDuplicateBanner ? (
          <div className="mt-6 rounded-lg border border-coral bg-coralTint p-7">
            <p className="text-sm font-semibold text-coralDeep">
              Possible duplicate client{clientSave.duplicateCandidates.length > 1 ? 's' : ''} found
            </p>
            <p className="mt-1 text-sm text-coralDeep">
              These existing records match on name, date of birth, and SSN. Review before saving.
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {clientSave.duplicateCandidates.map((candidate) => (
                <li
                  key={candidate.id}
                  className="rounded-md border border-borderRow bg-surface px-6 py-4 text-sm text-ink"
                >
                  <span className="font-semibold">
                    {candidate.firstName} {candidate.lastName}
                  </span>
                  <span className="ml-3 text-textMuted">{capitalize(candidate.sex)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-4">
              <Button variant="primary" size="sm" onClick={handleSaveAnyway}>
                Save Anyway
              </Button>
              <Button variant="tertiary" size="sm" onClick={handleDismissBanner}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-7 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <label className={fieldWrapClass}>
            <span className={labelClass}>First Name *</span>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={`${inputClass} ${fieldBorder(invalidFields, 'firstName')}`}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Last Name *</span>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className={`${inputClass} ${fieldBorder(invalidFields, 'lastName')}`}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Title</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Name Data Quality</span>
            <select
              value={nameDataQuality}
              onChange={(event) => setNameDataQuality(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {nameDqOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Sex *</span>
            <select
              value={sex}
              onChange={(event) => setSex(event.target.value as Sex | '')}
              className={`${inputClass} ${fieldBorder(invalidFields, 'sex')}`}
            >
              <option value="">Select…</option>
              {SEX_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Relationship to Head of Household *</span>
            <select
              value={relationshipToHoh}
              onChange={(event) => setRelationshipToHoh(event.target.value)}
              className={`${inputClass} ${fieldBorder(invalidFields, 'relationshipToHoh')}`}
            >
              <option value="">Select…</option>
              {relationshipOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Mobile</span>
            <input
              type="text"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <div className={fieldWrapClass}>
            <span className={labelClass}>SSN</span>
            {/* Value input gets the field's full width; the disclosure status
                qualifies it from underneath rather than competing for the row. */}
            <input
              type="text"
              value={ssnValue}
              onChange={(event) => setSsnValue(event.target.value)}
              disabled={ssnStatus !== 'provided'}
              placeholder="XXX-XX-XXXX"
              className={inputClass}
            />
            <select
              value={ssnStatus}
              onChange={(event) => {
                const next = event.target.value as DisclosureStatus;
                setSsnStatus(next);
                if (next !== 'provided') setSsnValue('');
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

          <label className={fieldWrapClass}>
            <span className={labelClass}>SSN Data Quality</span>
            <select
              value={ssnDataQuality}
              onChange={(event) => setSsnDataQuality(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {ssnDqOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={fieldWrapClass}>
            <span className={labelClass}>Birthdate *</span>
            <input
              type="date"
              value={dobValue}
              onChange={(event) => setDobValue(event.target.value)}
              disabled={dobStatus !== 'provided'}
              className={`${inputClass} ${fieldBorder(invalidFields, 'dobValue')}`}
            />
            <select
              value={dobStatus}
              onChange={(event) => {
                const next = event.target.value as DisclosureStatus;
                setDobStatus(next);
                if (next !== 'provided') setDobValue('');
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

          <label className={fieldWrapClass}>
            <span className={labelClass}>DOB Data Quality</span>
            <select
              value={dobDataQuality}
              onChange={(event) => setDobDataQuality(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {dobDqOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-7">
          <DualListbox
            label="Race and Ethnicity"
            options={raceOptions}
            selected={raceEthnicity}
            onChange={setRaceEthnicity}
          />
        </div>

        <div className="mt-7">
          <label className={fieldWrapClass}>
            <span className={labelClass}>Veteran Status</span>
            <select
              value={veteranStatus}
              onChange={(event) => setVeteranStatus(event.target.value)}
              className={`${inputClass} sm:w-fieldNarrow`}
            >
              <option value="">Select…</option>
              {veteranStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isVeteran ? (
          <div ref={veteranSectionRef} className="mt-7 rounded-lg border border-borderRow bg-surfaceMuted p-7">
            <h3 className="text-sm font-semibold text-ink">Veteran Details</h3>
            <div className="mt-5 grid grid-cols-1 gap-7 sm:grid-cols-2">
              <label className={fieldWrapClass}>
                <span className={labelClass}>Military Branch</span>
                <input
                  type="text"
                  value={militaryBranch}
                  onChange={(event) => setMilitaryBranch(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className={fieldWrapClass}>
                <span className={labelClass}>Year Entered Service</span>
                <input
                  type="number"
                  value={yearEnteredService}
                  onChange={(event) => setYearEnteredService(event.target.value)}
                  className={inputClass}
                />
              </label>

              <label className={fieldWrapClass}>
                <span className={labelClass}>Discharge Status</span>
                <select
                  value={dischargeStatus}
                  onChange={(event) => setDischargeStatus(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {dischargeStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={ww2} onChange={(event) => setWw2(event.target.checked)} />
                WW2
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={koreanWar}
                  onChange={(event) => setKoreanWar(event.target.checked)}
                />
                Korean War
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={vietnamWar}
                  onChange={(event) => setVietnamWar(event.target.checked)}
                />
                Vietnam War
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={otherTheater}
                  onChange={(event) => setOtherTheater(event.target.checked)}
                />
                Other Theater
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
});

function capitalize(value: string | null | undefined): string {
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default Step1ClientBasicInfo;
