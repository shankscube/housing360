export interface KpiTileProps {
  value: string | number;
  label: string;
  /** Optional muted qualifying text shown below the label, e.g. "+3 this week". */
  subLine?: string;
}

/**
 * A single KPI tile. Sized with `flex-1` so any number of tiles placed in a
 * flex row (4, 5, or otherwise) share the row evenly without a fixed layout.
 */
export function KpiTile({ value, label, subLine }: KpiTileProps) {
  return (
    <div className="min-w-[10rem] flex-1 rounded-lg border border-neutral-200 bg-white p-lg">
      <div className="text-3xl font-semibold text-neutral-900">{value}</div>
      <div className="mt-xs text-sm text-neutral-500">{label}</div>
      {subLine ? <div className="mt-xs text-xs text-neutral-500/80">{subLine}</div> : null}
    </div>
  );
}
