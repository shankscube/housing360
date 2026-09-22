import { STATUS_COLOR_MAP, type StatusTone } from '../status/statusColors';

export interface StatusBadgeProps {
  label: string;
  /** Semantic tone, resolved to a color via the shared status-to-color map. */
  tone: StatusTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const { background, text } = STATUS_COLOR_MAP[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-sm py-xs text-xs font-medium ${background} ${text}`}
    >
      {label}
    </span>
  );
}
