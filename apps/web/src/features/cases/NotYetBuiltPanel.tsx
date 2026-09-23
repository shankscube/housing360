export interface NotYetBuiltPanelProps {
  tabLabel: string;
}

/**
 * Labeled empty state for a case-detail tab with no backing data model yet
 * (Plan, Services, Referrals, Health and Wellness — see design.md's
 * "computed readiness, not stored flags" decision). Deliberately not in
 * `components/ui/` — its copy names the specific tab, so it isn't generic
 * enough for the shared component library.
 */
export function NotYetBuiltPanel({ tabLabel }: NotYetBuiltPanelProps) {
  return (
    <div className="px-9 py-14 text-center text-sm text-textMuted">
      <p className="font-semibold text-ink">{tabLabel} isn&apos;t built yet.</p>
      <p className="mt-2">This tab is reserved for future case data — nothing to show here yet.</p>
    </div>
  );
}
