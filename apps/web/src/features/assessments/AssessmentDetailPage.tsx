import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { Button, ConfirmDialog, KpiTile, StatusBadge, ToastProvider, useToast } from '../../components/ui';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  clearSelectedAssessment,
  discardAssessment,
  fetchAssessmentDetail,
} from '../../store/slices/assessmentsSlice';
import { AssessmentFormModal } from './AssessmentFormModal';
import { assessmentDisplayStatus, assessmentTypeLabel, hudStageLabel } from './assessmentLabels';

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function AssessmentDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { assessment, status } = useAppSelector((state) => state.assessments.detail);

  const [showContributions, setShowContributions] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchAssessmentDetail(id));
    return () => {
      dispatch(clearSelectedAssessment());
    };
  }, [dispatch, id]);

  async function handleConfirmDiscard() {
    if (!id) return;
    const result = await dispatch(discardAssessment(id));
    setShowDiscardConfirm(false);
    if (discardAssessment.fulfilled.match(result)) {
      showToast('Draft assessment discarded.', 'success');
      navigate('/assessments');
    } else {
      showToast('Failed to discard the draft assessment.');
    }
  }

  if (status === 'loading' || !assessment) {
    return (
      <ContentAreaTemplate title="Assessment" subtitle="Loading assessment…">
        <div />
      </ContentAreaTemplate>
    );
  }

  const isScored = assessment.score !== null;
  const isDraft = assessment.status !== 'completed';

  return (
    <ContentAreaTemplate title={`${assessmentTypeLabel(assessment.type)} Assessment`} subtitle={assessment.clientName}>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="tertiary" size="sm" onClick={() => navigate('/assessments')}>
            ← Back to Assessment Command Center
          </Button>
          {isDraft ? (
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={() => setShowResumeModal(true)}>
                Resume Draft
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDiscardConfirm(true)}>
                Discard
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-6">
          <KpiTile
            value={isScored ? assessment.score! : '—'}
            label="Score"
            subLine={isScored ? (assessment.scoreLabel ?? undefined) : 'Not yet scored'}
            tone={isScored ? 'teal' : 'quiet'}
          />
        </div>

        <section className="flex flex-col gap-5 rounded-2xl bg-surface p-9 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Assessment Overview</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Status</div>
              <div className="mt-2">
                <StatusBadge label={assessmentDisplayStatus(assessment)} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">HUD Stage</div>
              <div className="mt-2 text-sm text-ink">{hudStageLabel(assessment.dataCollectionStage)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Assessment Date</div>
              <div className="mt-2 text-sm text-ink">{formatDate(assessment.assessmentDate)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Due Date</div>
              <div className="mt-2 text-sm text-ink">{formatDate(assessment.dueDate)}</div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5 rounded-2xl bg-surface p-9 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Client &amp; Enrollment</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Client</div>
              <div className="mt-2 text-sm text-ink">{assessment.clientName}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Program Enrollment</div>
              <div className="mt-2 text-sm text-ink">{assessment.programEnrollmentName}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Assessor</div>
              <div className="mt-2 text-sm text-ink">{assessment.assessorName ?? 'Not yet recorded'}</div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5 rounded-2xl bg-surface p-9 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Score</h2>
            {isScored ? (
              <Button variant="tertiary" size="sm" onClick={() => setShowContributions((prev) => !prev)}>
                {showContributions ? 'Hide' : 'Show'} what contributed to this score
              </Button>
            ) : null}
          </div>
          {isScored && showContributions ? (
            assessment.contributions.length > 0 ? (
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-surfaceMuted">
                    <th className="px-5 py-3 text-2xs font-semibold uppercase tracking-wide text-textMuted">Field</th>
                    <th className="px-5 py-3 text-2xs font-semibold uppercase tracking-wide text-textMuted">Value</th>
                    <th className="px-5 py-3 text-right text-2xs font-semibold uppercase tracking-wide text-textMuted">
                      Contribution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assessment.contributions.map((contribution, index) => (
                    // Contribution rows have no stable id of their own; this list is
                    // read-only and append-order-stable per fetch, so an index key is safe.
                    <tr key={index} className="border-b border-borderRow">
                      <td className="px-5 py-3 font-semibold text-ink">{contribution.field}</td>
                      <td className="px-5 py-3 text-textMuted">{contribution.value ?? '—'}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink">{contribution.contribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-textMuted">No individual scoring rules matched this assessment.</p>
            )
          ) : null}
        </section>

        <section className="flex flex-col gap-5 rounded-2xl bg-surface p-9 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Disabilities</h2>
          {assessment.disabilities.length === 0 ? (
            <p className="text-sm text-textMuted">No disabilities recorded for this assessment.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {assessment.disabilities.map((disability) => (
                <li key={disability.id} className="rounded-md border border-borderRow bg-surfaceMuted px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-ink">{disability.disabilityType}</span>
                    <span className="text-sm text-textMuted">{disability.response}</span>
                  </div>
                  {disability.antiRetroviral !== null ||
                  disability.tCellCount !== null ||
                  disability.viralLoad !== null ? (
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-textMuted sm:grid-cols-4">
                      {disability.antiRetroviral !== null ? (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-textFaint">Anti-Retroviral</dt>
                          <dd>{disability.antiRetroviral}</dd>
                        </div>
                      ) : null}
                      {disability.tCellCount !== null ? (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-textFaint">T-Cell Count</dt>
                          <dd>{disability.tCellCount}</dd>
                        </div>
                      ) : null}
                      {disability.viralLoad !== null ? (
                        <div>
                          <dt className="font-semibold uppercase tracking-wide text-textFaint">Viral Load</dt>
                          <dd>{disability.viralLoad}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-5 rounded-2xl bg-surface p-9 shadow-card">
          <h2 className="text-lg font-semibold text-ink">System Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Created</div>
              <div className="mt-2 text-sm text-ink">{formatDateTime(assessment.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Last Updated</div>
              <div className="mt-2 text-sm text-ink">{formatDateTime(assessment.updatedAt)}</div>
            </div>
          </div>
        </section>
      </div>

      <AssessmentFormModal
        isOpen={showResumeModal}
        mode="edit"
        assessmentId={assessment.id}
        onClose={() => setShowResumeModal(false)}
        onSaved={() => {
          setShowResumeModal(false);
          if (id) dispatch(fetchAssessmentDetail(id));
        }}
        onDiscarded={() => {
          setShowResumeModal(false);
          navigate('/assessments');
        }}
      />

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleConfirmDiscard}
        title="Discard draft assessment?"
        message="This permanently deletes the draft and its answers. This can't be undone."
        confirmLabel="Discard Draft"
        danger
      />
    </ContentAreaTemplate>
  );
}

/** Routed standalone at `/assessments/:id` (not nested under `AssessmentsPage`),
 * so it mounts its own `ToastProvider` here — same pattern as `CoordinatedEntryPage` —
 * rather than relying on an ancestor that doesn't exist on this route. */
export function AssessmentDetailPage() {
  return (
    <ToastProvider>
      <AssessmentDetailContent />
    </ToastProvider>
  );
}
