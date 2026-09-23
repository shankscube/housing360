import { NotYetBuiltPanel } from '../NotYetBuiltPanel';

export interface AssessmentsPanelProps {
  /** From `CaseDetail.tabsWithContent.assessments` — true once an Entry Assessment exists for this case's enrollment. */
  hasContent: boolean;
}

/**
 * Distinct from the generic "not yet built" tabs — an Entry Assessment
 * already exists here (via the intake wizard), this change just doesn't add
 * a full Assessments detail view yet. See this change's spec's "Assessments
 * tab reports real content when an assessment exists" scenario.
 */
export function AssessmentsPanel({ hasContent }: AssessmentsPanelProps) {
  if (!hasContent) {
    return <NotYetBuiltPanel tabLabel="Assessments" />;
  }

  return (
    <div className="px-9 py-14 text-center text-sm text-textMuted">
      <p className="font-semibold text-ink">An Entry Assessment has been recorded.</p>
      <p className="mt-2">
        The full Assessments detail view isn&apos;t built yet — recorded data lives on this
        enrollment&apos;s Entry Assessment from intake.
      </p>
    </div>
  );
}
