import { KpiTile } from '../../src/components/ui';
import type { ComponentPreview } from './types';

export const kpiTilePreview: ComponentPreview = {
  name: 'KpiTile',
  reference: 'Home → KPI row across the top',
  variants: [
    {
      name: 'Row of 4',
      element: (
        <div className="flex flex-wrap gap-7">
          <KpiTile value={128} label="Open Cases" tone="teal" />
          <KpiTile value={42} label="Assessments Due" subLine="+3 this week" tone="gold" />
          <KpiTile value="87%" label="On-Time Rate" tone="blue" />
          <KpiTile value={12} label="Urgent Referrals" subLine="requires action" tone="coral" />
        </div>
      ),
    },
    {
      name: 'Row of 5',
      element: (
        <div className="flex gap-4">
          <KpiTile value={128} label="Open Cases" />
          <KpiTile value={42} label="Assessments Due" />
          <KpiTile value="87%" label="On-Time Rate" />
          <KpiTile value={12} label="Urgent Referrals" />
          <KpiTile value={5} label="New Intakes" subLine="today" />
        </div>
      ),
    },
  ],
};
