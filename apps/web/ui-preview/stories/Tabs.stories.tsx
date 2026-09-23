import { useState } from 'react';
import { Tabs } from '../../src/components/ui';
import type { ComponentPreview } from './types';

const CASE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'plan', label: 'Plan' },
  { key: 'services', label: 'Services' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'hudData', label: 'HUD Data' },
  { key: 'healthWellness', label: 'Health and Wellness' },
];

function InteractiveTabs() {
  const [activeKey, setActiveKey] = useState('overview');
  return <Tabs tabs={CASE_TABS} activeKey={activeKey} onChange={setActiveKey} />;
}

export const tabsPreview: ComponentPreview = {
  name: 'Tabs',
  reference: 'Cases → case detail record\'s 7-tab layout',
  variants: [
    {
      name: 'Case detail tab strip (click a tab)',
      element: <InteractiveTabs />,
    },
  ],
};
