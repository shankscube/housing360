import { useEffect, useState } from 'react';
import type { AssessmentListItem, ProgramEnrollment } from '@housing360/types';
import { Button, ConfirmDialog, StatusBadge, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRecommendedCarePlanTemplates } from '../../../store/slices/carePlansSlice';
import { fetchCaseDetail } from '../../../store/slices/casesSlice';
import { getClientEnrollments } from '../../../api/client';
import { apiClient } from '../../../api/client';
import { caseOptionLabel } from '../shared/caseLabels';
import { CarePlanWizard } from '../plan/CarePlanWizard';
import {
  AssessmentFormModal,
  type AssessmentFormLaunchContext,
} from '../../assessments/AssessmentFormModal';
import { LaunchAssessmentModal, type LaunchAssessmentTarget } from '../../assessments/LaunchAssessmentModal';

export interface AssessmentsPanelProps {
  clientId: string;
  caseId: string;
}

function stageLabel(stage: number): string {
  return stage === 1 ? 'Entry' : `Stage ${stage}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

/** One modal instance covers both the "start a new assessment" and "resume a
 * draft" paths — mirrors `AssessmentCommandCenterPage`'s `FormModalState`
 * union exactly (`viaLaunch` gates whether `AssessmentFormModal` renders its
 * "‹ Back" action). */
type FormModalState =
  | { mode: 'create'; launchContext: AssessmentFormLaunchContext; viaLaunch: true }
  | { mode: 'edit'; assessmentId: string; viaLaunch: boolean };

export function AssessmentsPanel({ clientId, caseId }: AssessmentsPanelProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { recommendedTemplates } = useAppSelector((state) => state.carePlans);

  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [showWizardFromTemplate, setShowWizardFromTemplate] = useState<string | null>(null);

  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [discardTargetId, setDiscardTargetId] = useState<string | null>(null);

  useEffect(() => {
    getClientEnrollments(clientId).then((response) => {
      if (response.success) {
        setEnrollments(response.data);
        const primary = response.data.find((e) => e.isPrimary) ?? response.data[0];
        if (primary) setSelectedEnrollmentId(primary.id);
      }
    });
    dispatch(fetchRecommendedCarePlanTemplates(caseId));
  }, [clientId, caseId, dispatch]);

  function refetchAssessments() {
    if (!selectedEnrollmentId) return;
    apiClient.get<AssessmentListItem[]>(`/api/enrollments/${selectedEnrollmentId}/assessments/list`).then((response) => {
      if (response.success) {
        setAssessments(response.data);
      }
    });
  }

  useEffect(() => {
    refetchAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEnrollmentId]);

  function handleLaunch(target: LaunchAssessmentTarget) {
    setShowLaunchModal(false);
    if (target.resumeAssessmentId) {
      setFormModal({ mode: 'edit', assessmentId: target.resumeAssessmentId, viaLaunch: true });
    } else if (target.stage) {
      setFormModal({
        mode: 'create',
        launchContext: {
          clientId: target.clientId,
          clientName: target.clientName,
          enrollment: target.enrollment,
          stage: target.stage,
        },
        viaLaunch: true,
      });
    }
  }

  function handleResumeRow(assessmentId: string) {
    setFormModal({ mode: 'edit', assessmentId, viaLaunch: false });
  }

  function handleFormSaved() {
    setFormModal(null);
    refetchAssessments();
    // Cheap, and it's what flips `CaseDetail.tabsWithContent.assessments` to
    // true once a first assessment exists on this case — other panels (e.g.
    // the HUD Data tab's readiness checklist) read that flag off the
    // case-detail fetch `CaseDetailPage` owns, so without this refetch a
    // freshly-completed Entry Assessment wouldn't be reflected there until
    // the next full case-detail fetch (e.g. a tab switch away and back).
    dispatch(fetchCaseDetail(caseId));
  }

  function handleFormDiscarded() {
    setFormModal(null);
    refetchAssessments();
  }

  async function handleConfirmDiscardRow() {
    if (!discardTargetId) return;
    const response = await apiClient.delete(`/api/assessments/${discardTargetId}`);
    if (response.success) {
      setAssessments((prev) => prev.filter((a) => a.id !== discardTargetId));
      showToast('Draft assessment discarded.', 'success');
    } else {
      showToast('Failed to discard the draft assessment.');
    }
    setDiscardTargetId(null);
  }

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      <div className={enrollments.length > 0 ? 'flex flex-col gap-2' : 'hidden'}>
        <label className="text-xs font-semibold uppercase tracking-wide text-textMuted">Enrollment</label>
        <select
          value={selectedEnrollmentId}
          onChange={(event) => setSelectedEnrollmentId(event.target.value)}
          className="max-w-fieldNarrow rounded-md border border-borderStrong bg-surface px-5 py-3 text-sm text-ink outline-none focus:border-ink"
        >
          {enrollments.map((enrollment) => (
            <option key={enrollment.id} value={enrollment.id}>
              {enrollment.programName}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Assessments</h2>
        <Button variant="secondary" size="sm" onClick={() => setShowLaunchModal(true)}>
          New Assessment
        </Button>
      </div>

      {assessments.length === 0 ? (
        <p className="text-sm text-textMuted">No assessments recorded for this enrollment yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assessments.map((assessment) => (
            <li
              key={assessment.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4"
            >
              <div>
                <span className="text-sm font-semibold text-ink">{stageLabel(assessment.dataCollectionStage)}</span>
                <p className="text-xs text-textMuted">
                  {formatDate(assessment.assessmentDate)} · Score {assessment.score ?? '—'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge label={caseOptionLabel(assessment.status)} />
                {assessment.status === 'in_progress' ? (
                  <>
                    <Button variant="tertiary" size="sm" onClick={() => handleResumeRow(assessment.id)}>
                      Resume Draft
                    </Button>
                    <Button variant="tertiary" size="sm" onClick={() => setDiscardTargetId(assessment.id)}>
                      Discard
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {recommendedTemplates.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-lg border border-borderRow bg-surfaceMuted p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Recommended Care Plans</span>
          <div className="flex flex-wrap gap-3">
            {recommendedTemplates.map((template) => (
              <Button
                key={template.id}
                variant="tertiary"
                size="sm"
                onClick={() => setShowWizardFromTemplate(template.id)}
              >
                Create from {template.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {showWizardFromTemplate ? (
        <CarePlanWizard
          isOpen
          onClose={() => setShowWizardFromTemplate(null)}
          caseId={caseId}
          clientId={clientId}
          mode="create"
          preFillTemplateId={showWizardFromTemplate}
        />
      ) : null}

      <LaunchAssessmentModal
        isOpen={showLaunchModal}
        onClose={() => setShowLaunchModal(false)}
        onLaunch={handleLaunch}
      />

      {formModal ? (
        <AssessmentFormModal
          isOpen
          mode={formModal.mode}
          launchContext={formModal.mode === 'create' ? formModal.launchContext : undefined}
          assessmentId={formModal.mode === 'edit' ? formModal.assessmentId : undefined}
          onBack={
            formModal.viaLaunch
              ? () => {
                  setFormModal(null);
                  setShowLaunchModal(true);
                }
              : undefined
          }
          onClose={() => setFormModal(null)}
          onSaved={handleFormSaved}
          onDiscarded={handleFormDiscarded}
        />
      ) : null}

      <ConfirmDialog
        isOpen={Boolean(discardTargetId)}
        onClose={() => setDiscardTargetId(null)}
        onConfirm={handleConfirmDiscardRow}
        title="Discard draft assessment?"
        message="This permanently deletes the draft and its answers. This can't be undone."
        confirmLabel="Discard Draft"
        danger
      />
    </div>
  );
}
