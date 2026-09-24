import { useState, type ReactNode } from 'react';
import { Icon } from '../icons';

export interface ExpandableRowProps {
  summary: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
}

/**
 * A single collapsible row: click the summary, see its children indented
 * below. Built once for `case-workspace` because two independent tabs need
 * the identical nesting pattern — Plan's care-plan → goals → tasks and
 * Services' enrollment → services → disbursements — rather than each tab
 * building its own expand/collapse row.
 */
export function ExpandableRow({ summary, children, defaultExpanded = false }: ExpandableRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border border-borderRow">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surfaceHover"
      >
        <Icon
          name="chevronRight"
          size={14}
          className={`shrink-0 text-textMuted transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <div className="flex-1">{summary}</div>
      </button>
      {expanded ? (
        <div className="border-t border-borderRow bg-surfaceMuted px-5 py-4 pl-11">{children}</div>
      ) : null}
    </div>
  );
}
