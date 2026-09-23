import { PageHeader } from '../../src/components/ui';
import type { ComponentPreview } from './types';

export const pageHeaderPreview: ComponentPreview = {
  name: 'PageHeader',
  reference: 'Home → title band and the New Intake / New Referral / New Case button group',
  variants: [
    {
      name: 'Title only',
      element: <PageHeader title="My Clients" />,
    },
    {
      name: 'Title with subtitle',
      element: (
        <PageHeader
          title="Good morning, Anamika"
          subtitle="Tuesday, September 22, 2026 · Eastside Continuum of Care"
        />
      ),
    },
    {
      name: 'Title with all three action variants',
      element: (
        <PageHeader
          title="Cases"
          subtitle="All three action variants"
          actions={[
            { key: 'new-intake', label: 'New Intake', onClick: () => {}, variant: 'primary' },
            { key: 'new-referral', label: 'New Referral', onClick: () => {}, variant: 'secondary' },
            { key: 'new-case', label: 'New Case', onClick: () => {}, variant: 'tertiary' },
          ]}
        />
      ),
    },
  ],
};
