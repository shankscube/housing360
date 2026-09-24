import { useEffect, useState } from 'react';
import type { AssessmentType, ClientSearchResultItem, ProgramEnrollment } from '@housing360/types';
import { Button, Modal } from '../../components/ui';
import { getClientEnrollments } from '../../api/client';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearEligibility, fetchAssessmentEligibility } from '../../store/slices/assessmentsSlice';
import { ClientSearchField } from '../cases/shared/ClientSearchField';
import { fieldWrapClass, formActionsClass, labelClass } from '../cases/shared/formStyles';
import { assessmentEligibilityStageLabel } from './assessmentLabels';

/**
 * What step 3 hands back to the caller (`AssessmentCommandCenterPage`/the
 * Case Assessments tab) so it can open the Assessment form modal (8.3) in the
 * right mode — either a brand-new assessment of `stage`, or resuming
 * `resumeAssessmentId`. Exactly one of the two is ever set.
 */
export interface LaunchAssessmentTarget {
  clientId: string;
  clientName: string;
  enrollment: ProgramEnrollment;
  /** New-assessment path. */
  stage?: AssessmentType;
  /** Resume-draft path. */
  resumeAssessmentId?: string;
}

export interface LaunchAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (target: LaunchAssessmentTarget) => void;
}

const TOTAL_STEPS = 3;

/**
 * 3-step "Client -> Program Enrollment -> Assessment Type" launch flow —
 * follows `features/cases/plan/CarePlanWizard.tsx`'s pattern exactly (one
 * `Modal`, local `step` state, a plain "Step N of 3" text indicator, per-step
 * Next/Cancel validation), per design.md Decision 11 — deliberately not
 * `StatusStepper`.
 *
 * The "Update" eligibility stage is always rendered informational-only (never
 * clickable): the schema has no `dataCollectionStage` code for it (only
 * entry/annual/exit are tracked), so there is nowhere to actually persist an
 * "Update Assessment" record today — see this change's design.md Open
 * Questions and this task's final report for the full note.
 */
export function LaunchAssessmentModal({ isOpen, onClose, onLaunch }: LaunchAssessmentModalProps) {
  const dispatch = useAppDispatch();
  const { items: eligibility, status: eligibilityStatus } = useAppSelector((state) => state.assessments.eligibility);

  const [step, setStep] = useState(1);
  const [client, setClient] = useState<ClientSearchResultItem | null>(null);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [enrollmentsLoaded, setEnrollmentsLoaded] = useState(false);
  const [enrollment, setEnrollment] = useState<ProgramEnrollment | null>(null);

  useEffect(() => {
    if (step !== 2 || !client) return undefined;
    let cancelled = false;
    setEnrollmentsLoaded(false);
    getClientEnrollments(client.id).then((response) => {
      if (cancelled) return;
      if (response.success) {
        setEnrollments(response.data);
      }
      setEnrollmentsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [step, client]);

  useEffect(() => {
    if (step !== 3 || !enrollment) return;
    dispatch(fetchAssessmentEligibility(enrollment.id));
  }, [step, enrollment, dispatch]);

  /**
   * A genuine cancel (Cancel button, Escape, backdrop click — every path
   * routes through `Modal`'s own `onClose`, wired to this) fully resets the
   * flow. Choosing a stage/resuming a draft deliberately does NOT reset
   * anything: the parent hides this modal (`isOpen={false}`) without calling
   * this, so the Assessment form modal's "‹ Back" can reopen it
   * (`isOpen={true}`) and land back on step 3 with the same client/enrollment
   * still selected, per this modal's `AssessmentFormModalProps.onBack` contract.
   */
  function handleClose() {
    setStep(1);
    setClient(null);
    setEnrollments([]);
    setEnrollmentsLoaded(false);
    setEnrollment(null);
    dispatch(clearEligibility());
    onClose();
  }

  function handleSelectStage(stage: AssessmentType) {
    if (!client || !enrollment) return;
    onLaunch({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      enrollment,
      stage,
    });
  }

  function handleResume(assessmentId: string) {
    if (!client || !enrollment) return;
    onLaunch({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      enrollment,
      resumeAssessmentId: assessmentId,
    });
  }

  const nothingAvailable =
    eligibilityStatus === 'succeeded' &&
    eligibility.every((item) => item.stage === 'update' || (!item.allowed && !item.draftAssessmentId));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Launch Assessment" size="md">
      <div className="flex flex-col gap-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
          Step {step} of {TOTAL_STEPS}
        </p>

        {step === 1 ? <ClientSearchField selectedClient={client} onSelect={setClient} required /> : null}

        {step === 2 ? (
          <div className={fieldWrapClass}>
            <span className={labelClass}>Program Enrollment</span>
            {!enrollmentsLoaded ? (
              <p className="mt-2 text-sm text-textMuted">Loading enrollments…</p>
            ) : enrollments.length === 0 ? (
              <p className="mt-2 text-sm text-textMuted">
                This client has no program enrollments yet. Create one before recording an assessment.
              </p>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {enrollments.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEnrollment(item)}
                    className={`flex items-center justify-between rounded-md border px-4 py-2.5 text-left text-sm ${
                      enrollment?.id === item.id ? 'border-ink bg-surfaceMuted' : 'border-borderRow'
                    }`}
                  >
                    <span>{item.programName}</span>
                    <span className="text-xs text-textMuted">{item.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            {eligibilityStatus === 'loading' ? (
              <p className="text-sm text-textMuted">Checking assessment eligibility…</p>
            ) : (
              <>
                {nothingAvailable ? (
                  <p className="text-sm text-textMuted">
                    No assessment type is available to record on this enrollment right now.
                  </p>
                ) : null}
                {eligibility.map((item) => {
                  if (item.stage === 'update') {
                    return (
                      <div key={item.stage} className="rounded-md border border-borderRow bg-surfaceMuted px-5 py-4">
                        <p className="text-sm font-semibold text-ink">{assessmentEligibilityStageLabel(item.stage)}</p>
                        <p className="mt-1 text-xs text-textMuted">
                          Update assessments can&apos;t be recorded as a distinct record in this system yet —
                          informational only.
                        </p>
                      </div>
                    );
                  }
                  if (item.draftAssessmentId) {
                    const stageLower = assessmentEligibilityStageLabel(item.stage).toLowerCase();
                    return (
                      <div
                        key={item.stage}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-borderRow px-5 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">{assessmentEligibilityStageLabel(item.stage)}</p>
                          <p className="mt-1 text-xs text-textMuted">
                            An unfinished {stageLower} assessment already exists on this enrollment — resume it to
                            continue.
                          </p>
                        </div>
                        <Button variant="tertiary" size="sm" onClick={() => handleResume(item.draftAssessmentId as string)}>
                          Resume Draft ›
                        </Button>
                      </div>
                    );
                  }
                  if (item.allowed) {
                    // `item.stage` is narrowed to exclude 'update' by the early
                    // return above, but that narrowing doesn't carry into the
                    // `onClick` closure below (TS doesn't track CFA narrowing
                    // of a captured parameter across a nested function) — a
                    // local `const` re-binds it so the closure sees the
                    // already-narrowed type.
                    const stage: AssessmentType = item.stage;
                    return (
                      <button
                        key={item.stage}
                        type="button"
                        onClick={() => handleSelectStage(stage)}
                        className="flex items-center justify-between rounded-md border border-borderStrong px-5 py-4 text-left transition-colors hover:border-ink"
                      >
                        <span className="text-sm font-semibold text-ink">
                          Start {assessmentEligibilityStageLabel(item.stage)} Assessment
                        </span>
                        <span className="text-xs text-textMuted">{item.reason}</span>
                      </button>
                    );
                  }
                  return (
                    <div key={item.stage} className="rounded-md border border-borderRow bg-surfaceSubtle px-5 py-4">
                      <p className="text-sm font-semibold text-textMuted">{assessmentEligibilityStageLabel(item.stage)}</p>
                      <p className="mt-1 text-xs text-textFaint">{item.reason}</p>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ) : null}

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={handleClose}>
            Cancel
          </Button>
          {step > 1 ? (
            <Button variant="tertiary" onClick={() => setStep((prev) => prev - 1)}>
              ‹ Back
            </Button>
          ) : null}
          {step < TOTAL_STEPS ? (
            <Button
              variant="primary"
              disabled={step === 1 ? !client : !enrollment}
              onClick={() => setStep((prev) => prev + 1)}
            >
              Next
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
