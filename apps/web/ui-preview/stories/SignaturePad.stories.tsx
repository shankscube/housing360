import { useState } from 'react';
import { SignaturePad } from '../../src/components/ui';
import type { ComponentPreview } from './types';

function InteractiveSignaturePad() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div className="max-w-formCardWidth">
      <SignaturePad label="Client Signature" value={value} onChange={setValue} onClear={() => setValue(null)} />
    </div>
  );
}

export const signaturePadPreview: ComponentPreview = {
  name: 'SignaturePad',
  reference: 'case-workspace → Release of Information form (client + staff signatures)',
  variants: [
    {
      name: 'Interactive — draw and clear',
      element: <InteractiveSignaturePad />,
    },
  ],
};
