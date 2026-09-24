import { AssessmentCommandCenterPage } from '../../features/assessments/AssessmentCommandCenterPage';
import { ToastProvider } from '../../components/ui';

/** `AssessmentCommandCenterPage` (and the Launch/Assessment-form modals it
 * renders) calls `useToast()`, which throws without a `ToastProvider`
 * ancestor — mounted here, same pattern as `CoordinatedEntryPage`/`CasesPage`. */
export function AssessmentsPage() {
  return (
    <ToastProvider>
      <AssessmentCommandCenterPage />
    </ToastProvider>
  );
}
