import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { ProgramEnrollment, ProgramEnrollmentInput } from '@housing360/types';
import { Button, StatusBadge } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { store } from '../../../store';
import {
  ensureCase,
  loadEntryAssessment,
  loadEnrollments,
  loadPrograms,
  markStepComplete,
  resetSectionSteps,
  saveEnrollment,
  setActiveEnrollment,
} from '../../../store/slices/intakeSlice';
import type { StepHandle } from '../types';

const inputClass =
  'mt-2 w-full rounded-md border border-borderStrong bg-surface px-6 py-4 text-base text-ink outline-none transition-colors focus:border-ink';
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-textMuted';
const fieldWrapClass = 'flex flex-col';

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Step 3 — Program & Enrollment. Shows a searchable picker of existing
 * enrollments when any exist (primary marked), or the new-enrollment form
 * directly otherwise — either path is toggleable once at least one
 * enrollment exists. On save, ensures a `Case` exists for the resulting
 * client+enrollment pair and loads/derives the Entry Assessment status
 * message.
 */
const Step3ProgramEnrollment = forwardRef<StepHandle>(function Step3ProgramEnrollment(_props, ref) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const clientId = useAppSelector((state) => state.intake.ids.clientId);
  const clientName = useAppSelector((state) => {
    const client = state.intake.client;
    return client ? `${client.firstName} ${client.lastName}`.trim() : '';
  });
  const programs = useAppSelector((state) => state.intake.programs);
  const enrollments = useAppSelector((state) => state.intake.enrollments);
  const activeEnrollmentId = useAppSelector((state) => state.intake.ids.enrollmentId);
  const entryStatus = useAppSelector((state) => state.intake.assessment.entryStatus);
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);

  const [viewMode, setViewMode] = useState<'existing' | 'new'>('new');
  const autoSelectedRef = useRef(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(
    activeEnrollmentId ?? enrollments.primaryEnrollmentId
  );
  const [enrollmentSearch, setEnrollmentSearch] = useState('');

  const [programId, setProgramId] = useState('');
  const [enrollmentName, setEnrollmentName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [startDate, setStartDate] = useState(todayIsoDate());
  const [status, setStatus] = useState('');
  const [relationshipToHoh, setRelationshipToHoh] = useState('');
  const [disablingCondition, setDisablingCondition] = useState('');
  const [enrollmentCoc, setEnrollmentCoc] = useState('');
  const [programCaseManagerId, setProgramCaseManagerId] = useState('');

  useEffect(() => {
    if (clientId && programs.status !== 'succeeded' && programs.status !== 'loading') {
      dispatch(loadPrograms());
    }
    if (clientId && enrollments.status !== 'succeeded' && enrollments.status !== 'loading') {
      dispatch(loadEnrollments(clientId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (!autoSelectedRef.current && enrollments.status === 'succeeded') {
      autoSelectedRef.current = true;
      if (enrollments.items.length > 0) {
        setViewMode('existing');
        setSelectedEnrollmentId(
          (current) => current ?? enrollments.primaryEnrollmentId ?? enrollments.items[0]?.id ?? null
        );
      }
    }
  }, [enrollments.status, enrollments.items, enrollments.primaryEnrollmentId]);

  useEffect(() => {
    if (!nameTouched) {
      const program = programs.items.find((item) => item.id === programId);
      if (program) {
        setEnrollmentName(clientName ? `${program.name} - ${clientName}` : `${program.name} - Enrollment`);
      }
    }
  }, [programId, programs.items, nameTouched, clientName]);

  async function afterEnrollmentSelected(enrollmentId: string): Promise<boolean> {
    const previousEnrollmentId = store.getState().intake.ids.enrollmentId;
    const priorCompletedSteps = store.getState().intake.completedSteps;
    const switchingEnrollment = Boolean(previousEnrollmentId) && previousEnrollmentId !== enrollmentId;

    dispatch(setActiveEnrollment(enrollmentId));

    if (switchingEnrollment && priorCompletedSteps.some((step) => step >= 4 && step <= 7)) {
      dispatch(resetSectionSteps());
    }

    const currentClientId = store.getState().intake.ids.clientId;
    if (currentClientId) {
      await dispatch(ensureCase({ clientId: currentClientId, enrollmentId }));
    }

    // Status message ("Resuming…" / "Already recorded…" / "Not yet recorded…")
    // is derived reactively below from `entryStatus`, once this resolves.
    await dispatch(loadEntryAssessment(enrollmentId));
    dispatch(markStepComplete(3));
    return true;
  }

  async function saveNewEnrollment(): Promise<boolean> {
    if (!programId) {
      showToast('Please select a program before continuing.');
      return false;
    }
    const currentClientId = store.getState().intake.ids.clientId;
    if (!currentClientId) {
      showToast('The client must be saved (step 1) before creating an enrollment.');
      return false;
    }

    const input: ProgramEnrollmentInput = {
      clientId: currentClientId,
      programId,
      name: enrollmentName || undefined,
      startDate: startDate || undefined,
      status: status || undefined,
      relationshipToHoh: relationshipToHoh || undefined,
      disablingCondition: disablingCondition || undefined,
      enrollmentCoc: enrollmentCoc.trim() || undefined,
      programCaseManagerId: programCaseManagerId.trim() || undefined,
    };

    const result = await dispatch(saveEnrollment({ enrollmentId: null, input }));
    if (saveEnrollment.fulfilled.match(result)) {
      return afterEnrollmentSelected(result.payload.id);
    }
    showToast('Failed to save the enrollment. Please try again.');
    return false;
  }

  useImperativeHandle(ref, () => ({
    async save() {
      if (viewMode === 'new') {
        return saveNewEnrollment();
      }
      if (!selectedEnrollmentId) {
        showToast('Please select an enrollment, or create a new one, before continuing.');
        return false;
      }
      return afterEnrollmentSelected(selectedEnrollmentId);
    },
  }));

  const statusOptions = hudOptions?.enrollmentStatus ?? [];
  const relationshipOptions = hudOptions?.relationshipToHoh ?? [];
  const disablingConditionOptions = hudOptions?.disablingCondition ?? [];

  const filteredEnrollments: ProgramEnrollment[] = enrollments.items.filter((enrollment) => {
    const term = enrollmentSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      enrollment.programName.toLowerCase().includes(term) || enrollment.name.toLowerCase().includes(term)
    );
  });

  let statusMessage: string | null = null;
  if (entryStatus) {
    if (entryStatus.status === 'in_progress') {
      statusMessage = 'Resuming the unfinished Entry assessment already started for this enrollment.';
    } else if (entryStatus.status === 'complete') {
      statusMessage = 'Already recorded for this enrollment; editing below updates that same record.';
    } else {
      statusMessage = 'Not yet recorded for this enrollment.';
    }
  }

  return (
    <div className="rounded-lg border border-borderStrong bg-surface p-9">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Program & Enrollment</h2>
        {enrollments.items.length > 0 ? (
          viewMode === 'existing' ? (
            <Button variant="tertiary" size="sm" onClick={() => setViewMode('new')}>
              + Create a new enrollment instead
            </Button>
          ) : (
            <Button variant="tertiary" size="sm" onClick={() => setViewMode('existing')}>
              ‹ Use an existing enrollment instead
            </Button>
          )
        ) : null}
      </div>

      {statusMessage ? (
        <p className="mt-4 rounded-md border border-borderRow bg-surfaceMuted px-6 py-4 text-sm text-textMuted">
          {statusMessage}
        </p>
      ) : null}

      {viewMode === 'existing' ? (
        <div className="mt-7">
          <label className={fieldWrapClass}>
            <span className={labelClass}>Search Enrollments</span>
            <input
              type="text"
              value={enrollmentSearch}
              onChange={(event) => setEnrollmentSearch(event.target.value)}
              placeholder="Search by program or enrollment name"
              className={inputClass}
            />
          </label>

          <ul className="mt-5 flex flex-col gap-3">
            {filteredEnrollments.map((enrollment) => {
              const isSelected = selectedEnrollmentId === enrollment.id;
              const isPrimary =
                enrollment.isPrimary || enrollment.id === enrollments.primaryEnrollmentId;
              return (
                <li key={enrollment.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedEnrollmentId(enrollment.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-6 py-4 text-left transition-colors ${
                      isSelected ? 'border-ink bg-surfaceMuted' : 'border-borderRow hover:bg-surfaceHover'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {enrollment.programName}
                        {isPrimary ? (
                          <span className="ml-2 text-2xs font-semibold uppercase tracking-wide text-tealDeep">
                            Primary
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-textMuted">
                        {enrollment.name} · Started {enrollment.startDate}
                      </p>
                    </div>
                    <StatusBadge label={enrollment.status} />
                  </button>
                </li>
              );
            })}
            {filteredEnrollments.length === 0 ? (
              <li className="px-6 py-8 text-center text-sm text-textMuted">No enrollments match.</li>
            ) : null}
          </ul>
        </div>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-7 sm:grid-cols-2">
          <label className={fieldWrapClass}>
            <span className={labelClass}>Program *</span>
            <select value={programId} onChange={(event) => setProgramId(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {programs.items.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Name</span>
            <input
              type="text"
              value={enrollmentName}
              onChange={(event) => {
                setEnrollmentName(event.target.value);
                setNameTouched(true);
              }}
              className={inputClass}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">Select…</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Relationship to Head of Household</span>
            <select
              value={relationshipToHoh}
              onChange={(event) => setRelationshipToHoh(event.target.value)}
              className={inputClass}
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
            <span className={labelClass}>Disabling Condition</span>
            <select
              value={disablingCondition}
              onChange={(event) => setDisablingCondition(event.target.value)}
              className={inputClass}
            >
              <option value="">Select…</option>
              {disablingConditionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Enrollment CoC</span>
            <input
              type="text"
              value={enrollmentCoc}
              onChange={(event) => setEnrollmentCoc(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className={fieldWrapClass}>
            <span className={labelClass}>Program Case Manager</span>
            <input
              type="text"
              value={programCaseManagerId}
              onChange={(event) => setProgramCaseManagerId(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      )}
    </div>
  );
});

export default Step3ProgramEnrollment;
