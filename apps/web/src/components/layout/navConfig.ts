export interface NavItem {
  key: string;
  label: string;
  /** Present when this item (or group header) itself navigates somewhere. */
  to?: string;
  /** Real screen vs. a route stub. */
  implemented: boolean;
  /** Marks which stub badge value to render next to the label, if any. */
  badge?: 'referrals';
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', to: '/', implemented: true },
  { key: 'my-clients', label: 'My Clients', to: '/clients', implemented: true },
  { key: 'cases', label: 'Cases', to: '/cases', implemented: true },
  { key: 'assessments', label: 'Assessments', to: '/assessments', implemented: true },
  {
    key: 'coordinated-entry',
    label: 'Coordinated Entry',
    to: '/coordinated-entry',
    implemented: true,
  },
  {
    key: 'resource-directory',
    label: 'Resource Directory',
    to: '/resource-directory',
    implemented: false,
  },
  {
    key: 'referrals',
    label: 'Referrals',
    to: '/referrals',
    implemented: false,
    badge: 'referrals',
    children: [
      { key: 'referrals-internal', label: 'Internal', to: '/referrals/internal', implemented: false },
      { key: 'referrals-outbound', label: 'Outbound', to: '/referrals/outbound', implemented: false },
    ],
  },
  {
    key: 'shelter-management',
    label: 'Shelter Management',
    to: '/shelter-management',
    implemented: false,
    children: [
      { key: 'shelter-beds', label: 'Beds', to: '/shelter-management/beds', implemented: false },
      {
        key: 'shelter-daily-log',
        label: 'Daily Log',
        to: '/shelter-management/daily-log',
        implemented: false,
      },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    implemented: false,
    children: [
      { key: 'insights-data-quality', label: 'Data Quality', to: '/insights/data-quality', implemented: false },
      { key: 'insights-reports', label: 'Reports', to: '/insights/reports', implemented: false },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    implemented: false,
    children: [
      { key: 'tools-data-import', label: 'Data Import', to: '/tools/data-import', implemented: false },
      { key: 'tools-training', label: 'Training', to: '/tools/training', implemented: false },
    ],
  },
];
