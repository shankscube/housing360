export interface TabItem {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

const tabBaseClass =
  'whitespace-nowrap border-b-2 px-6.5 py-4 text-sm font-semibold transition-colors';

/**
 * Generic tab strip — renders a set of labels and an active-tab indicator
 * only. It has no idea what any tab's panel contains; the consumer owns
 * mounting the right content for `activeKey` (see `CaseDetailPage`).
 */
export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-borderRow">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={
              isActive
                ? `${tabBaseClass} border-ink text-ink`
                : `${tabBaseClass} border-transparent text-textMuted hover:text-ink`
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
