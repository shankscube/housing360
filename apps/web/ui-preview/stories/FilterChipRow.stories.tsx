import { useState } from 'react';
import { FilterChipRow } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'with-program', label: 'With Program' },
  { value: 'without-program', label: 'Without Program' },
];

function InteractiveFilterChipRow() {
  const [activeValue, setActiveValue] = useState('all');
  return <FilterChipRow options={OPTIONS} activeValue={activeValue} onChange={setActiveValue} />;
}

export const filterChipRowPreview: ComponentPreview = {
  name: 'FilterChipRow',
  reference: 'My Clients / Cases → filter chip row above the table',
  variants: [
    {
      name: 'Single-select (click a chip; hover an inactive one)',
      element: <InteractiveFilterChipRow />,
    },
  ],
};
