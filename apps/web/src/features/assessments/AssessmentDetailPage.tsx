import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Button, KpiTile, StatusBadge } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearSelectedAssessment, fetchAssessmentDetail } from '../../store/slices/assessmentsSlice';
import { assessmentDisplayStatus, assessmentTypeLabel } from './assessmentLabels';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { assessment, status } = useAppSelector((state) => state.assessments.detail);

  useEffect(() => {
    if (id) dispatch(fetchAssessmentDetail(id));
    return () => {
      dispatch(clearSelectedAssessment());
    };
  }, [dispatch, id]);

  if (status === 'loading' || !assessment) {
    return (
      <ContentAreaTemplate title="Assessment" subtitle="Loading assessment…">
        <div />
      </ContentAreaTemplate>
    );
  }

  const isScored = assessment.score !== null;

  return (
    <ContentAreaTemplate
      title={`${assessmentTypeLabel(assessment.type)} Assessment`}
      subtitle={assessment.clientName}
    >
      <div className="flex flex-col gap-8">
        <Button variant="tertiary" size="sm" onClick={() => navigate('/assessments')}>
          ← Back to Assessment Command Center
        </Button>

        <div className="flex flex-wrap gap-6">
          <KpiTile
            value={isScored ? assessment.score! : '—'}
            label="Score"
            subLine={isScored ? (assessment.scoreLabel ?? undefined) : 'Not yet scored'}
            tone={isScored ? 'teal' : 'quiet'}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 rounded-2xl bg-surface p-9 shadow-card sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Client</div>
            <div className="mt-2 text-sm text-ink">{assessment.clientName}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Program Enrollment</div>
            <div className="mt-2 text-sm text-ink">{assessment.programEnrollmentName}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Status</div>
            <div className="mt-2">
              <StatusBadge label={assessmentDisplayStatus(assessment)} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Due Date</div>
            <div className="mt-2 text-sm text-ink">{formatDate(assessment.dueDate)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Assessment Date</div>
            <div className="mt-2 text-sm text-ink">{formatDate(assessment.assessmentDate)}</div>
          </div>
        </div>
      </div>
    </ContentAreaTemplate>
  );
}
