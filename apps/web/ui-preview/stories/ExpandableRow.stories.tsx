import { ExpandableRow } from '../../src/components/ui';
import type { ComponentPreview } from './types';

export const expandableRowPreview: ComponentPreview = {
  name: 'ExpandableRow',
  reference: 'case-workspace → Plan tab (plan → goals → tasks) and Services tab (enrollment → services → disbursements)',
  variants: [
    {
      name: 'Care plan → goals nesting',
      element: (
        <div className="flex flex-col gap-3">
          <ExpandableRow
            defaultExpanded
            summary={
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Housing Stability Plan</span>
                <span className="text-xs text-textMuted">2 of 4 tasks done</span>
              </div>
            }
          >
            <div className="flex flex-col gap-2">
              <ExpandableRow summary={<span className="text-sm text-ink">Secure stable housing</span>}>
                <p className="text-sm text-textMuted">Tasks: Apply for rental assistance, Tour units</p>
              </ExpandableRow>
              <ExpandableRow summary={<span className="text-sm text-ink">Increase income</span>}>
                <p className="text-sm text-textMuted">Tasks: Enroll in job training</p>
              </ExpandableRow>
            </div>
          </ExpandableRow>
        </div>
      ),
    },
  ],
};
