import { StatusStepper, type StatusStepperStage } from '../../src/components/ui';
import type { ComponentPreview } from './types';

/** The bundle's referral stepper: four linear stages plus a rejected branch. */
const REFERRAL_STAGES: StatusStepperStage[] = [
  { key: 'new', label: 'New' },
  { key: 'in-review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
  {
    key: 'enrolled',
    label: 'Enrolled',
    branches: [{ key: 'rejected', label: 'Rejected' }],
  },
];

const at = (currentStageKey: string) => (
  <StatusStepper stages={REFERRAL_STAGES} currentStageKey={currentStageKey} />
);

export const statusStepperPreview: ComponentPreview = {
  name: 'StatusStepper',
  reference: 'Referral detail → stage stepper',
  variants: [
    { name: 'Stage 1 — New', element: at('new') },
    { name: 'Stage 2 — In Review', element: at('in-review') },
    { name: 'Stage 3 — Approved', element: at('approved') },
    { name: 'Stage 4 — Enrolled (complete)', element: at('enrolled') },
    { name: 'Terminal branch — Rejected', element: at('rejected') },
  ],
};
