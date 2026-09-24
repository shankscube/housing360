import { useState } from 'react';
import { Button, Modal } from '../../src/components/ui';
import type { ComponentPreview } from './types';

function InteractiveModal() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="New Case">
        <p className="text-sm text-textMuted">
          Modal content renders here — forms, wizards, confirmations. Closes on Escape, a
          backdrop click, or the header&apos;s close button.
        </p>
      </Modal>
    </div>
  );
}

export const modalPreview: ComponentPreview = {
  name: 'Modal',
  reference: 'case-workspace → New Case / Edit Case / Care Plan wizard / disbursement, bed, referral, and ROI forms',
  variants: [
    {
      name: 'Interactive — click to open',
      element: <InteractiveModal />,
    },
  ],
};
