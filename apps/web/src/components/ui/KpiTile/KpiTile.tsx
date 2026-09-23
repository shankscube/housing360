import type { StatusTone } from '../status/statusColors';

/** The bundle marks each KPI with a small colored dot in the brand palette. */
const DOT_COLOR_CLASS: Record<StatusTone, string> = {
  teal: 'bg-teal',
  navy: 'bg-ink',
  blue: 'bg-blueSoft',
  gold: 'bg-gold',
  coral: 'bg-coral',
  quiet: 'bg-borderStep',
};

export interface KpiTileProps {
  value: string | number;
  label: string;
  /** Optional muted qualifying text shown below the value, e.g. "+3 this week". */
  subLine?: string;
  /** Optional leading dot, in the shared tone palette. */
  tone?: StatusTone;
}

/**
 * A single KPI tile. Sized with `flex-1` so any number of tiles placed in a
 * flex row (4, 5, or otherwise) share the row evenly without a fixed layout.
 */
export function KpiTile({ value, label, subLine, tone }: KpiTileProps) {
  return (
    <div className="min-w-kpiMinWidth flex-1 rounded-2xl bg-surface px-10 py-9 shadow-card">
      <div className="flex items-center gap-3">
        {tone ? (
          <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${DOT_COLOR_CLASS[tone]}`} />
        ) : null}
        <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
          {label}
        </span>
      </div>
      <div className="mt-5 font-display text-5xl font-semibold leading-none tracking-tighter text-ink">
        {value}
      </div>
      {subLine ? <div className="mt-2.5 text-sm text-textMuted">{subLine}</div> : null}
    </div>
  );
}
