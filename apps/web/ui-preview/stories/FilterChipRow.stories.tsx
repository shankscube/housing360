import { useState } from 'react';
import { FilterChipRow } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'urgent', label: 'Urgent' },
];

function InteractiveFilterChipRow() {
  const [activeValue, setActiveValue] = useState('open');
  return <FilterChipRow options={OPTIONS} activeValue={activeValue} onChange={setActiveValue} />;
}

export const filterChipRowPreview: ComponentPreview = {
  name: 'FilterChipRow',
  variants: [
    {
      name: 'Single-select (click a chip)',
      element: <InteractiveFilterChipRow />,
    },
  ],
};
