import type { IconName } from '../ui/icons';

export interface NavItem {
  key: string;
  label: string;
  /**
   * Navigation target for a leaf item. Group headers (items with `children`)
   * never set this — they're pure expand/collapse toggles, never a route.
   */
  to?: string;
  /** Every menu option — top-level and nested — renders an icon. */
  icon: IconName;
  /** Real screen vs. a route stub. */
  implemented: boolean;
  /** Marks which stub badge value to render next to the label, if any. */
  badge?: 'referrals';
  /**
   * Group headers render as a full-size row by default, matching leaf items
   * (Referrals, Shelter Management). Set this for a header that reads as a
   * lighter section grouping (Insights, Tools) rather than a primary item.
   */
  sectionHeader?: boolean;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', to: '/', icon: 'home', implemented: true },
  { key: 'my-clients', label: 'My Clients', to: '/clients', icon: 'users', implemented: true },
  { key: 'cases', label: 'Cases', to: '/cases', icon: 'cases', implemented: true },
  {
    key: 'assessments',
    label: 'Assessments',
    to: '/assessments',
    icon: 'assess',
    implemented: true,
  },
  {
    key: 'coordinated-entry',
    label: 'Coordinated Entry',
    to: '/coordinated-entry',
    icon: 'ce',
    implemented: true,
  },
  {
    key: 'resource-directory',
    label: 'Resource Directory',
    to: '/resource-directory',
    icon: 'dir',
    implemented: false,
  },
  {
    key: 'referrals',
    label: 'Referrals',
    icon: 'refer',
    implemented: false,
    badge: 'referrals',
    children: [
      {
        key: 'referrals-internal',
        label: 'Internal',
        to: '/referrals/internal',
        icon: 'swap',
        implemented: false,
      },
      {
        key: 'referrals-outbound',
        label: 'Outbound',
        to: '/referrals/outbound',
        icon: 'arrowUpRight',
        implemented: false,
      },
    ],
  },
  {
    key: 'shelter-management',
    label: 'Shelter Management',
    icon: 'shelter',
    implemented: false,
    children: [
      {
        key: 'shelter-beds',
        label: 'Beds',
        to: '/shelter-management/beds',
        icon: 'bed',
        implemented: false,
      },
      {
        key: 'shelter-daily-log',
        label: 'Daily Log',
        to: '/shelter-management/daily-log',
        icon: 'clipboard',
        implemented: false,
      },
    ],
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: 'insight',
    implemented: false,
    sectionHeader: true,
    children: [
      {
        key: 'insights-data-quality',
        label: 'Data Quality',
        to: '/insights/data-quality',
        icon: 'shieldCheck',
        implemented: false,
      },
      {
        key: 'insights-reports',
        label: 'Reports',
        to: '/insights/reports',
        icon: 'fileText',
        implemented: false,
      },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    icon: 'tools',
    implemented: false,
    sectionHeader: true,
    children: [
      {
        key: 'tools-data-import',
        label: 'Data Import',
        to: '/tools/data-import',
        icon: 'download',
        implemented: false,
      },
      {
        key: 'tools-training',
        label: 'Training',
        to: '/tools/training',
        icon: 'graduationCap',
        implemented: false,
      },
    ],
  },
];
