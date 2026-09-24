import { useState } from 'react';
import type { CaseDetail, FollowUpMilestone } from '@housing360/types';
import { Button, useToast } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { setCaseFollowUp } from '../../../store/slices/casesSlice';

export interface FollowUpReminderControlProps {
  caseDetail: CaseDetail;
}

const MILESTONE_OPTIONS: { value: FollowUpMilestone; label: string }[] = [
  { value: 'none', label: 'No follow-up' },
  { value: '30', label: '30 Day' },
  { value: '60', label: '60 Day' },
  { value: '90', label: '90 Day' },
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function FollowUpReminderControl({ caseDetail }: FollowUpReminderControlProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [milestone, setMilestone] = useState<FollowUpMilestone>(caseDetail.followUpMilestone);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSetReminder() {
    setIsSaving(true);
    const result = await dispatch(setCaseFollowUp({ id: caseDetail.id, input: { milestone } }));
    setIsSaving(false);

    if (setCaseFollowUp.fulfilled.match(result)) {
      showToast(
        milestone === 'none' ? 'Follow-up reminder cleared.' : 'Follow-up reminder set.',
        'success'
      );
    } else {
      showToast('Failed to update the follow-up reminder. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-8 shadow-card">
      <h2 className="font-display text-lg font-semibold text-ink">Follow-Up Reminder</h2>
      <p className="text-xs text-textMuted">
        Current: {caseDetail.followUpMilestone === 'none' ? 'No follow-up' : `${caseDetail.followUpMilestone} Day`}
        {caseDetail.followUpDueDate ? ` — due ${formatDate(caseDetail.followUpDueDate)}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={milestone}
          onChange={(event) => setMilestone(event.target.value as FollowUpMilestone)}
          className="rounded-md border border-borderStrong bg-surface px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-ink"
        >
          {MILESTONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="secondary" size="sm" onClick={handleSetReminder} disabled={isSaving}>
          Set Reminder
        </Button>
      </div>
    </div>
  );
}
