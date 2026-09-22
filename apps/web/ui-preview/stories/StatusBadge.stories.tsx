import { StatusBadge } from '../../src/components/ui';
import type { ComponentPreview } from './types';

export const statusBadgePreview: ComponentPreview = {
  name: 'StatusBadge',
  variants: [
    {
      name: 'All tones',
      element: (
        <div className="flex gap-2">
          <StatusBadge label="Overdue" tone="urgent" />
          <StatusBadge label="Warning" tone="warning" />
          <StatusBadge label="On Track" tone="success" />
          <StatusBadge label="Informational" tone="neutral" />
        </div>
      ),
    },
  ],
};
