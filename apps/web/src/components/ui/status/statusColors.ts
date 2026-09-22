/**
 * Single source of truth for status → color across the app. `StatusBadge`
 * resolves its color from this map by tone rather than any per-usage value,
 * so a new screen never invents its own status colors.
 */
export type StatusTone = 'urgent' | 'warning' | 'success' | 'neutral';

export interface StatusToneColors {
  background: string;
  text: string;
}

export const STATUS_COLOR_MAP: Record<StatusTone, StatusToneColors> = {
  urgent: { background: 'bg-danger/10', text: 'text-danger' },
  warning: { background: 'bg-warning/10', text: 'text-warning' },
  success: { background: 'bg-success/10', text: 'text-success' },
  neutral: { background: 'bg-neutral-100', text: 'text-neutral-600' },
};
