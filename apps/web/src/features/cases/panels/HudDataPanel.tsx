import { useEffect, useState } from 'react';
import { Icon } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCaseHudData } from '../../../store/slices/casesSlice';

export interface HudDataPanelProps {
  caseId: string;
}

/**
 * The show/hide-satisfied toggle is a pure frontend filter over the already-
 * fetched checklist — it never re-fetches (see this change's spec's "HUD
 * Data Tab Satisfied-Item Toggle" requirement).
 */
export function HudDataPanel({ caseId }: HudDataPanelProps) {
  const dispatch = useAppDispatch();
  const { hudData, hudDataStatus, hudDataError } = useAppSelector((state) => state.cases.detail);
  const [hideSatisfied, setHideSatisfied] = useState(false);

  useEffect(() => {
    dispatch(fetchCaseHudData(caseId));
  }, [dispatch, caseId]);

  if (hudDataStatus === 'loading' || hudDataStatus === 'idle') {
    return <p className="px-9 py-14 text-center text-sm text-textMuted">Loading HUD Data checklist…</p>;
  }

  if (hudDataStatus === 'failed' || !hudData) {
    return (
      <p className="px-9 py-14 text-center text-sm text-textMuted">
        {hudDataError ?? 'Could not load the HUD Data checklist.'}
      </p>
    );
  }

  const hasNoRules = hudData.items.length === 0;
  const allPassed = !hasNoRules && hudData.items.every((item) => item.passed);
  const visibleItems = hideSatisfied ? hudData.items.filter((item) => !item.passed) : hudData.items;
  const emptyFilterResult = !hasNoRules && hideSatisfied && visibleItems.length === 0 && !allPassed;

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      {!hasNoRules ? (
        <label className="flex w-fit items-center gap-2.5 text-sm text-textMuted">
          <input
            type="checkbox"
            checked={hideSatisfied}
            onChange={(event) => setHideSatisfied(event.target.checked)}
          />
          Hide satisfied items
        </label>
      ) : null}

      {hasNoRules ? (
        <p className="rounded-lg border border-borderRow px-6.5 py-8 text-center text-sm text-textMuted">
          No HUD data checklist rules apply to this case.
        </p>
      ) : allPassed ? (
        <p className="flex items-center gap-3 rounded-lg border border-teal bg-tealTint px-6.5 py-5 text-sm font-semibold text-tealDeep">
          <Icon name="check" size={16} strokeWidth={2.5} />✓ All clear
        </p>
      ) : emptyFilterResult ? (
        <p className="rounded-lg border border-borderRow px-6.5 py-8 text-center text-sm text-textMuted">
          Nothing matches the current filter; toggle Show satisfied items to see the full checklist.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borderRow rounded-lg border border-borderRow">
          {visibleItems.map((item) => (
            <li key={item.key} className="flex items-center gap-3.5 px-6.5 py-4">
              <span className={item.passed ? 'text-tealDeep' : 'text-coralDeep'}>
                <Icon name={item.passed ? 'check' : 'close'} size={16} strokeWidth={2.5} />
              </span>
              <span className="text-sm text-ink">{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-textFaint">{hudData.disclosureText}</p>
    </div>
  );
}
