import { useState } from 'react';
import { DualListbox } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const RACE_OPTIONS = [
  { value: '1', label: 'American Indian, Alaska Native, or Indigenous' },
  { value: '2', label: 'Asian or Asian American' },
  { value: '3', label: 'Black, African American, or African' },
  { value: '4', label: 'Native Hawaiian or Pacific Islander' },
  { value: '5', label: 'White' },
  { value: '8', label: "Client doesn't know" },
  { value: '9', label: 'Client prefers not to answer' },
];

function InteractiveDualListbox() {
  const [selected, setSelected] = useState<string[]>(['3']);
  return (
    <DualListbox
      label="Race"
      options={RACE_OPTIONS}
      selected={selected}
      onChange={setSelected}
    />
  );
}

export const dualListboxPreview: ComponentPreview = {
  name: 'DualListbox',
  reference:
    'client-intake-wizard → Step 1 (Client Basic Information) → multi-value Race and Ethnicity (HUD 3.04) — no dual-listbox pattern in the design bundle, built from shared tokens',
  variants: [
    {
      name: 'Click to highlight, double-click to move, or use the arrow buttons',
      element: <InteractiveDualListbox />,
    },
    {
      name: 'Nothing selected yet',
      element: (
        <DualListbox label="Ethnicity" options={RACE_OPTIONS} selected={[]} onChange={() => {}} />
      ),
    },
    {
      name: 'Everything already selected',
      element: (
        <DualListbox
          label="Race"
          options={RACE_OPTIONS}
          selected={RACE_OPTIONS.map((option) => option.value)}
          onChange={() => {}}
        />
      ),
    },
  ],
};
