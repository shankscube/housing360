import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Assessment,
  AssessmentInput,
  AssessmentType,
  AssessmentUpdateInput,
  ProgramEnrollment,
} from '@housing360/types';
import {
  Button,
  ConfirmDialog,
  DisabilitiesEditor,
  HealthDvSection,
  IncomeBenefitsSection,
  LivingSituationSection,
  Modal,
  StatusBadge,
  useToast,
  type DisabilitiesEditorHandle,
  type DisabilityRowInput,
} from '../../components/ui';
import { ensureCase } from '../../api/client';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  clearLatestValues,
  clearSelectedAssessment,
  createAssessment,
  discardAssessment,
  fetchAssessmentDetail,
  fetchLatestAssessmentValues,
  replaceAssessmentDisabilities,
  updateAssessment,
} from '../../store/slices/assessmentsSlice';
import { loadHudOptions } from '../../store/slices/intakeSlice';
import {
  useAssessmentFormDraft,
  type AssessmentFormDraft,
} from './shared/useAssessmentFormDraft';
import { assessmentStatusLabel, assessmentTypeLabel, assessmentTypeToDataCollectionStage } from './assessmentLabels';
import {
  fieldWrapClass,
  formActionsClass,
  formGridClass,
  inputClass,
  labelClass,
  textareaClass,
} from '../cases/shared/formStyles';

export type AssessmentFormMode = 'create' | 'edit';

/** What `LaunchAssessmentModal` (8.2) hands off for the `create` path. */
export interface AssessmentFormLaunchContext {
  clientId: string;
  clientName: string;
  enrollment: ProgramEnrollment;
  stage: AssessmentType;
}

export interface AssessmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AssessmentFormMode;
  /** Required when `mode === 'create'`. */
  launchContext?: AssessmentFormLaunchContext;
  /** Required when `mode === 'edit'` (the Resume Draft path). */
  assessmentId?: string;
  /** Renders a "‹ Back" action that returns to the Launch modal's step 3 — omit when this modal was opened any other way (e.g. straight from a Resume Draft row action). */
  onBack?: () => void;
  /** Fired after a successful Save Draft/Complete, with the saved assessment. */
  onSaved?: (assessment: Assessment) => void;
  /** Fired after a successful Discard Draft, with the discarded assessment's id. */
  onDiscarded?: (assessmentId: string) => void;
}

/** Local mirror of the two-level HUD code suffix convention `LivingSituationSection`
 * uses for `situationCategory`/`situationType` — same shape, applied to
 * `destinationType`/`destination` (see `hudOptions.ts`'s Destination taxonomy,
 * seeded with the identical "(Category)" label-suffix pattern). */
const DESTINATION_CATEGORY_LABEL_SUFFIX: Record<string, string> = {
  homeless: '(Homeless)',
  institutional: '(Institutional)',
  temporary: '(Temporary)',
  permanent: '(Permanent)',
  other: '(Other)',
};

/** Every `Assessment` field that is NOT one of the Living Situation / Income &
 * Benefits & Insurance / Health & DV section fields — used to strip a fetched
 * `Assessment` (or `AssessmentDetail`, which extends it) down to just its
 * section values before seeding `useAssessmentFormDraft`, so metadata (`id`,
 * `status`, `score`, …) never gets smuggled into a later save payload — see
 * this component's `handleSave` for why that matters. */
const ASSESSMENT_META_FIELDS = [
  'id',
  'clientId',
  'programEnrollmentId',
  'caseId',
  'dataCollectionStage',
  'type',
  'dueDate',
  'score',
  'scoreLabel',
  'cycleNumber',
  'assessmentDate',
  'status',
  'createdAt',
  'updatedAt',
] as const satisfies readonly (keyof Assessment)[];

function extractSectionFields(source: Assessment): AssessmentFormDraft {
  const sectionFields: Record<string, unknown> = { ...source };
  for (const field of ASSESSMENT_META_FIELDS) {
    delete sectionFields[field];
  }
  return sectionFields as AssessmentFormDraft;
}

function toDisabilityRowInput(disability: {
  disabilityType: string;
  response: string;
  indefiniteAndImpairs: string | null;
  antiRetroviral: string | null;
  tCellAvailable: string | null;
  tCellCount: number | null;
  tCellSource: string | null;
  viralLoadAvailable: string | null;
  viralLoad: string | null;
  viralLoadSource: string | null;
}): DisabilityRowInput {
  return {
    disabilityType: disability.disabilityType,
    response: disability.response,
    indefiniteAndImpairs: disability.indefiniteAndImpairs,
    antiRetroviral: disability.antiRetroviral,
    tCellAvailable: disability.tCellAvailable,
    tCellCount: disability.tCellCount,
    tCellSource: disability.tCellSource,
    viralLoadAvailable: disability.viralLoadAvailable,
    viralLoad: disability.viralLoad,
    viralLoadSource: disability.viralLoadSource,
  };
}

/**
 * The full Assessment form — Living Situation / Income & Benefits & Insurance
 * / Health & DV (the reused intake section components) + Disabilities +,
 * only for the Exit stage, Exit Details. Built on `useAssessmentFormDraft`
 * (a local, per-instance draft store — NOT the intake wizard's module-level
 * singleton, see that hook's doc comment) so this modal never collides with
 * the intake wizard or another instance of itself.
 *
 * `stage` is fixed by how the modal was launched and never editable here —
 * `create` mode takes it from `launchContext.stage`; `edit` mode (Resume
 * Draft) reads it off the fetched assessment's own `type`.
 */
export function AssessmentFormModal({
  isOpen,
  onClose,
  mode,
  launchContext,
  assessmentId,
  onBack,
  onSaved,
  onDiscarded,
}: AssessmentFormModalProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const hudOptions = useAppSelector((state) => state.intake.hudOptions.data);
  const { assessment, status: detailStatus } = useAppSelector((state) => state.assessments.detail);
  const latestValues = useAppSelector((state) => state.assessments.latestValues);

  const { draft, updateDraft, resetDraft } = useAssessmentFormDraft();
  const [disabilities, setDisabilities] = useState<DisabilityRowInput[]>([]);
  const disabilitiesRef = useRef<DisabilitiesEditorHandle>(null);

  const [caseId, setCaseId] = useState<string | null>(null);
  const [isResolvingCase, setIsResolvingCase] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [exitDestinationType, setExitDestinationType] = useState('');
  const [exitDestination, setExitDestination] = useState('');
  const [exitCaseManagerReason, setExitCaseManagerReason] = useState('');

  useEffect(() => {
    if (isOpen && !hudOptions) {
      dispatch(loadHudOptions());
    }
  }, [isOpen, hudOptions, dispatch]);

  // Seed the form fresh every time the modal opens (or switches which
  // assessment it targets) — mirrors `CarePlanWizard`'s `if (!isOpen) return`
  // guard so this only runs on a genuine open, not every render.
  useEffect(() => {
    if (!isOpen) return;
    setDisabilities([]);
    setExitDestinationType('');
    setExitDestination('');
    setExitCaseManagerReason('');
    setShowDiscardConfirm(false);
    dispatch(clearLatestValues());

    if (mode === 'create') {
      dispatch(clearSelectedAssessment());
      resetDraft({});
      setCaseId(null);
      if (launchContext) {
        setIsResolvingCase(true);
        ensureCase({ clientId: launchContext.clientId, enrollmentId: launchContext.enrollment.id }).then((response) => {
          if (response.success) {
            setCaseId(response.data.id);
          } else {
            showToast('Failed to prepare this assessment — please close and try again.');
          }
          setIsResolvingCase(false);
        });
      }
    } else if (mode === 'edit' && assessmentId) {
      dispatch(fetchAssessmentDetail(assessmentId)).then((result) => {
        if (fetchAssessmentDetail.fulfilled.match(result)) {
          resetDraft(extractSectionFields(result.payload));
          setDisabilities(result.payload.disabilities.map(toDisabilityRowInput));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, assessmentId, launchContext?.clientId, launchContext?.enrollment.id]);

  const isLoadingExisting =
    mode === 'edit' && (detailStatus === 'loading' || detailStatus === 'idle' || assessment?.id !== assessmentId);

  const stage: AssessmentType = mode === 'create' ? launchContext?.stage ?? 'entry' : assessment?.type ?? 'entry';
  const clientName = mode === 'create' ? launchContext?.clientName : assessment?.clientName;
  const enrollmentName = mode === 'create' ? launchContext?.enrollment.programName : assessment?.programEnrollmentName;
  const enrollmentId = mode === 'create' ? launchContext?.enrollment.id : assessment?.programEnrollmentId;
  const assessmentDateValue = (assessment?.assessmentDate ?? new Date().toISOString()).slice(0, 10);
  const canDiscard = mode === 'edit' && assessment && assessment.status !== 'completed';

  const destinationTypeOptions = hudOptions?.destinationType ?? [];
  const destinationOptions = useMemo(() => {
    if (!exitDestinationType) return [];
    const suffix = DESTINATION_CATEGORY_LABEL_SUFFIX[exitDestinationType] ?? '';
    return (hudOptions?.destination ?? []).filter((option) => option.label.includes(suffix));
  }, [hudOptions, exitDestinationType]);

  async function handleCarryForward() {
    if (!enrollmentId) return;
    const result = await dispatch(fetchLatestAssessmentValues(enrollmentId));
    if (fetchLatestAssessmentValues.fulfilled.match(result)) {
      if (result.payload) {
        updateDraft(extractSectionFields(result.payload));
        showToast('Carried forward the most recent assessment on this enrollment.', 'success');
      } else {
        showToast('No prior assessment exists on this enrollment to carry forward from.');
      }
    } else {
      showToast('Failed to load previous assessment values.');
    }
  }

  function buildExitFields() {
    if (stage !== 'exit') return {};
    return {
      destinationType: exitDestinationType || undefined,
      destination: exitDestination || undefined,
      caseManagerExitReason: exitCaseManagerReason || undefined,
    };
  }

  async function handleSave(status: 'in_progress' | 'completed') {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const pendingRow = disabilitiesRef.current?.getPendingRow() ?? null;
      const finalDisabilities = pendingRow ? [...disabilities, pendingRow] : disabilities;
      if (pendingRow) {
        setDisabilities(finalDisabilities);
        disabilitiesRef.current?.clearPendingRow();
      }

      let saved: Assessment;
      if (mode === 'create') {
        if (!launchContext || !caseId) {
          showToast('Still preparing this assessment — please wait a moment and try again.');
          return;
        }
        const payload: AssessmentInput & { status: string } = {
          ...draft,
          ...buildExitFields(),
          clientId: launchContext.clientId,
          programEnrollmentId: launchContext.enrollment.id,
          caseId,
          dataCollectionStage: assessmentTypeToDataCollectionStage(stage),
          type: stage,
          status,
        };
        const result = await dispatch(createAssessment(payload));
        if (!createAssessment.fulfilled.match(result)) {
          showToast('Failed to save the assessment. Please try again.');
          return;
        }
        saved = result.payload;
      } else {
        if (!assessmentId) return;
        const payload: AssessmentUpdateInput = {
          ...draft,
          ...buildExitFields(),
          status,
        };
        const result = await dispatch(updateAssessment({ id: assessmentId, input: payload }));
        if (!updateAssessment.fulfilled.match(result)) {
          showToast('Failed to save the assessment. Please try again.');
          return;
        }
        saved = result.payload;
      }

      const disabilitiesResult = await dispatch(
        replaceAssessmentDisabilities({ assessmentId: saved.id, disabilities: finalDisabilities })
      );
      if (!replaceAssessmentDisabilities.fulfilled.match(disabilitiesResult)) {
        showToast('The assessment saved, but its disability records failed to update.');
      }

      showToast(status === 'completed' ? 'Assessment completed.' : 'Draft saved.', 'success');
      onSaved?.(saved);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDiscard() {
    if (!assessmentId) return;
    const result = await dispatch(discardAssessment(assessmentId));
    setShowDiscardConfirm(false);
    if (discardAssessment.fulfilled.match(result)) {
      showToast('Draft assessment discarded.', 'success');
      onDiscarded?.(assessmentId);
      onClose();
    } else {
      showToast('Failed to discard the draft assessment.');
    }
  }

  const savingDisabled = isSaving || (mode === 'create' && (isResolvingCase || !caseId));

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`${assessmentTypeLabel(stage)} Assessment`} size="xl">
        {isLoadingExisting ? (
          <p className="text-sm text-textMuted">Loading assessment…</p>
        ) : (
          <div className="flex flex-col gap-9">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-borderRow bg-surfaceMuted px-6 py-5">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wide text-textFaint">Client</span>
                <p className="text-sm font-semibold text-ink">{clientName ?? '—'}</p>
              </div>
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wide text-textFaint">Program Enrollment</span>
                <p className="text-sm font-semibold text-ink">{enrollmentName ?? '—'}</p>
              </div>
              {mode === 'edit' && assessment ? (
                <div>
                  <span className="text-2xs font-semibold uppercase tracking-wide text-textFaint">Status</span>
                  <div className="mt-1">
                    <StatusBadge label={assessmentStatusLabel(assessment.status)} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className={formGridClass}>
              <div className={fieldWrapClass}>
                <span className={labelClass}>Assessment Type</span>
                <input type="text" value={assessmentTypeLabel(stage)} disabled className={inputClass} />
              </div>
              <div className={fieldWrapClass}>
                <span className={labelClass}>Assessment Date</span>
                <input type="date" value={assessmentDateValue} disabled className={inputClass} />
                <span className="mt-1 text-xs text-textFaint">Set automatically when the assessment is recorded.</span>
              </div>
            </div>

            <div>
              <Button
                variant="tertiary"
                size="sm"
                onClick={handleCarryForward}
                disabled={latestValues.status === 'loading' || !enrollmentId}
              >
                {latestValues.status === 'loading' ? 'Carrying forward…' : 'Carry forward previous answers'}
              </Button>
            </div>

            <LivingSituationSection values={draft} onChange={updateDraft} hudOptions={hudOptions} />
            <IncomeBenefitsSection values={draft} onChange={updateDraft} hudOptions={hudOptions} />
            <HealthDvSection values={draft} onChange={updateDraft} hudOptions={hudOptions} />

            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-ink">Disabilities</h2>
              <DisabilitiesEditor ref={disabilitiesRef} value={disabilities} onChange={setDisabilities} hudOptions={hudOptions} />
            </div>

            {stage === 'exit' ? (
              <div className="flex flex-col gap-5 rounded-lg border border-borderRow p-6">
                <h2 className="text-lg font-semibold text-ink">Exit Details</h2>
                <div className={formGridClass}>
                  <div className={fieldWrapClass}>
                    <label className={labelClass}>Destination Type</label>
                    <select
                      value={exitDestinationType}
                      onChange={(event) => {
                        setExitDestinationType(event.target.value);
                        setExitDestination('');
                      }}
                      className={inputClass}
                    >
                      <option value="">Select a category</option>
                      {destinationTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldWrapClass}>
                    <label className={labelClass}>Destination</label>
                    <select
                      value={exitDestination}
                      onChange={(event) => setExitDestination(event.target.value)}
                      disabled={!exitDestinationType}
                      className={inputClass}
                    >
                      <option value="">Select a destination</option>
                      {destinationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={fieldWrapClass}>
                  <label className={labelClass}>Case Manager Exit Reason</label>
                  <textarea
                    value={exitCaseManagerReason}
                    onChange={(event) => setExitCaseManagerReason(event.target.value)}
                    className={textareaClass}
                  />
                </div>
              </div>
            ) : null}

            <div className={formActionsClass}>
              {canDiscard ? (
                <Button variant="danger" onClick={() => setShowDiscardConfirm(true)} disabled={isSaving}>
                  Discard Draft
                </Button>
              ) : null}
              <div className="flex-1" />
              {onBack ? (
                <Button variant="tertiary" onClick={onBack} disabled={isSaving}>
                  ‹ Back
                </Button>
              ) : null}
              <Button variant="tertiary" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => handleSave('in_progress')} disabled={savingDisabled}>
                Save Draft
              </Button>
              <Button variant="primary" onClick={() => handleSave('completed')} disabled={savingDisabled}>
                Complete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard draft assessment?"
        message="This permanently deletes the draft and its answers. This can't be undone."
        confirmLabel="Discard Draft"
        danger
      />
    </>
  );
}
