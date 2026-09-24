import { useRef } from 'react';
import { ContentAreaTemplate } from '../../components/layout/ContentAreaTemplate';
import { ToastProvider } from '../../components/ui';
import { CoordinatedEntryWizard } from '../../features/coordinatedEntry/CoordinatedEntryWizard';
import { PrioritizationList } from '../../features/coordinatedEntry/PrioritizationList';

function CoordinatedEntryContent() {
  const wizardRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <ContentAreaTemplate
      title="Coordinated Entry"
      subtitle="Screen, prioritize, and refer clients into the right program."
      actions={[
        {
          key: 'vulnerability-assessment',
          label: 'Vulnerability Assessment',
          variant: 'primary',
          onClick: () => wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        },
        {
          key: 'view-all-clients',
          label: 'View All Clients',
          variant: 'tertiary',
          onClick: () => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        },
      ]}
    >
      <div className="flex flex-col gap-10">
        <div ref={wizardRef}>
          <CoordinatedEntryWizard />
        </div>
        <div ref={listRef}>
          <PrioritizationList />
        </div>
      </div>
    </ContentAreaTemplate>
  );
}

export function CoordinatedEntryPage() {
  return (
    <ToastProvider>
      <CoordinatedEntryContent />
    </ToastProvider>
  );
}
