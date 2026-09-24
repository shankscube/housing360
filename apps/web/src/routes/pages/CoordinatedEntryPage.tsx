import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { ToastProvider } from '../../components/ui';
import { CoordinatedEntryWizard } from '../../features/coordinatedEntry/CoordinatedEntryWizard';
import { PrioritizationList } from '../../features/coordinatedEntry/PrioritizationList';

export function CoordinatedEntryPage() {
  return (
    <ToastProvider>
      <ContentAreaTemplate
        title="Coordinated Entry"
        subtitle="Screen, prioritize, and refer clients into the right program."
      >
        <div className="flex flex-col gap-10">
          <CoordinatedEntryWizard />
          <PrioritizationList />
        </div>
      </ContentAreaTemplate>
    </ToastProvider>
  );
}
