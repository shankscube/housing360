import { STATUS_COLOR_MAP, type StatusTone } from '../status/statusColors';
import { resolveStatusTone } from '../status/statusToneByLabel';

export interface StatusBadgeProps {
  /** The status word or short phrase shown in the pill. */
  label: string;
  /**
   * Overrides the shared status-word lookup. Pass this only where the word's
   * meaning is domain-specific — e.g. "Enrolled" as a referral stage, which
   * the bundle renders `navy` rather than the `teal` My Clients gives it.
   */
  tone?: StatusTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const { background, text } = STATUS_COLOR_MAP[tone ?? resolveStatusTone(label)];

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md px-4.5 py-1.5 text-xs font-semibold ${background} ${text}`}
    >
      {label}
    </span>
  );
}
