import { useState } from 'react';
import type { CaseDetail } from '@housing360/types';
import { InteractionSummariesCard } from '../overview/InteractionSummariesCard';
import { InteractionSummaryForm } from '../overview/InteractionSummaryForm';
import { InteractionSummaryDetail } from '../overview/InteractionSummaryDetail';
import { DetailsCard } from '../overview/DetailsCard';
import { FollowUpReminderControl } from '../overview/FollowUpReminderControl';
import { TasksCard } from '../overview/TasksCard';
import { SystemInformationCard } from '../overview/SystemInformationCard';

export interface OverviewPanelProps {
  caseDetail: CaseDetail;
}

/**
 * Left: Interaction Summaries + their detail/edit modals. Right: Details,
 * Follow-Up Reminder, Tasks, System Information — see `case-workspace`'s
 * proposal for the full field list each card owns.
 */
export function OverviewPanel({ caseDetail }: OverviewPanelProps) {
  const [showNewSummary, setShowNewSummary] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-7 px-9 py-8 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-7">
        <InteractionSummariesCard caseId={caseDetail.id} onNew={() => setShowNewSummary(true)} />
      </div>

      <div className="flex flex-col gap-7">
        <DetailsCard caseDetail={caseDetail} />
        <FollowUpReminderControl caseDetail={caseDetail} />
        <TasksCard clientId={caseDetail.clientId} caseId={caseDetail.id} />
        <SystemInformationCard caseDetail={caseDetail} />
      </div>

      <InteractionSummaryForm
        isOpen={showNewSummary}
        onClose={() => setShowNewSummary(false)}
        clientId={caseDetail.clientId}
        caseId={caseDetail.id}
      />
      <InteractionSummaryDetail clientId={caseDetail.clientId} caseId={caseDetail.id} />
    </div>
  );
}
