import { useEffect, useState } from 'react';
import type { AssessmentListItem, ProgramEnrollment } from '@housing360/types';
import { Button, StatusBadge, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchRecommendedCarePlanTemplates } from '../../../store/slices/carePlansSlice';
import { getClientEnrollments } from '../../../api/client';
import { apiClient } from '../../../api/client';
import { caseOptionLabel } from '../shared/caseLabels';
import { CarePlanWizard } from '../plan/CarePlanWizard';
import { NotYetBuiltPanel } from '../NotYetBuiltPanel';

export interface AssessmentsPanelProps {
  clientId: string;
  caseId: string;
  /** From `CaseDetail.tabsWithContent.assessments` — true once an Entry Assessment exists for this case's enrollment. */
  hasContent: boolean;
}

function stageLabel(stage: number): string {
  return stage === 1 ? 'Entry' : `Stage ${stage}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function AssessmentsPanel({ clientId, caseId, hasContent }: AssessmentsPanelProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { recommendedTemplates } = useAppSelector((state) => state.carePlans);

  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [showWizardFromTemplate, setShowWizardFromTemplate] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedEnrollmentId) return;
    apiClient.get<AssessmentListItem[]>(`/api/enrollments/${selectedEnrollmentId}/assessments/list`).then((response) => {
      if (response.success) {
        setAssessments(response.data);
      }
    });
  }, [selectedEnrollmentId]);

  function handleDiscard(id: string) {
    apiClient.delete(`/api/assessments/${id}`).then((response) => {
      if (response.success) {
        setAssessments((prev) => prev.filter((a) => a.id !== id));
        showToast('Draft assessment discarded.', 'success');
      } else {
        showToast('Failed to discard the draft assessment.');
      }
    });
  }

  function handlePlaceholderRoute() {
    showToast('The Entry Assessment form and scoring arrive in a later phase — not available from here yet.');
  }

  if (!hasContent && assessments.length === 0) {
    return <NotYetBuiltPanel tabLabel="Assessments" />;
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
        <Button variant="secondary" size="sm" onClick={handlePlaceholderRoute}>
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
                    <Button variant="tertiary" size="sm" onClick={handlePlaceholderRoute}>
                      Resume Draft
                    </Button>
                    <Button variant="tertiary" size="sm" onClick={() => handleDiscard(assessment.id)}>
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
    </div>
  );
}
