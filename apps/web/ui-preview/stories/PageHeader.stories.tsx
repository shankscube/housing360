import { PageHeader } from '../../src/components/ui';
import type { ComponentPreview } from './types';

export const pageHeaderPreview: ComponentPreview = {
  name: 'PageHeader',
  variants: [
    {
      name: 'Title only',
      element: <PageHeader title="My Clients" />,
    },
    {
      name: 'Title with actions',
      element: (
        <PageHeader
          title="Cases"
          actions={[
            { key: 'new-case', label: 'New Case', onClick: () => {} },
            { key: 'export', label: 'Export', onClick: () => {}, variant: 'secondary' },
          ]}
        />
      ),
    },
  ],
};
