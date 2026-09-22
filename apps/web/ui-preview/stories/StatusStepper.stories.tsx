import type { StatusStepperStage } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const REFERRAL_STAGES: StatusStepperStage[] = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
  {
    key: 'decision',
    label: 'Decision',
    branches: [
      { key: 'accepted', label: 'Accepted' },
      { key: 'declined', label: 'Declined' },
    ],
  },
];

export const statusStepperPreview: ComponentPreview = {
  name: 'StatusStepper (reserved)',
  variants: [
    {
      name: 'Interface reserved for the Referrals module',
      element: (
        <div className="rounded-md border border-dashed border-neutral-300 p-md text-sm text-neutral-500">
          <p>
            Not implemented yet — reserved for the Referrals module. Props interface only:{' '}
            {REFERRAL_STAGES.length} example stages (with a branching final stage) shown here as
            data, not rendered UI.
          </p>
        </div>
      ),
    },
  ],
};
