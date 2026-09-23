import { useState } from 'react';
import type { CaseDetail } from '@housing360/types';
import { Button } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { updateCase } from '../../../store/slices/casesSlice';

export interface OverviewPanelProps {
  caseDetail: CaseDetail;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const fieldClass =
  'w-full rounded-md border border-borderStrong bg-surface px-5 py-3 text-sm text-ink outline-none transition-colors focus:border-ink';
const labelClass = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-textMuted';

/** `open` (the default `cases/ensure` assigns) has no dedicated option here — saving always writes one of these three explicit values, matching `CasesPage`'s own display mapping. */
function normalizeStatus(status: string): string {
  return status === 'open' ? 'active' : status;
}

export function OverviewPanel({ caseDetail }: OverviewPanelProps) {
  const dispatch = useAppDispatch();
  const [subject, setSubject] = useState(caseDetail.subject ?? '');
  const [status, setStatus] = useState(normalizeStatus(caseDetail.status));
  const [priority, setPriority] = useState(caseDetail.priority ?? '');
  const [lastContactDate, setLastContactDate] = useState(caseDetail.lastContactDate?.slice(0, 10) ?? '');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await dispatch(
        updateCase({
          id: caseDetail.id,
          input: {
            subject: subject.trim() || undefined,
            status,
            priority: priority ? (priority as 'high' | 'medium' | 'low') : undefined,
            lastContactDate: lastContactDate || null,
          },
        })
      ).unwrap();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-7 px-9 py-8">
      <div className="grid grid-cols-2 gap-7">
        <div>
          <span className={labelClass}>Case Number</span>
          <p className="text-sm font-semibold text-ink">{caseDetail.caseNumber}</p>
        </div>
        <div>
          <span className={labelClass}>Client</span>
          <p className="text-sm font-semibold text-ink">{caseDetail.clientName}</p>
        </div>
        <div>
          <span className={labelClass}>Case Manager</span>
          <p className="text-sm text-ink">{caseDetail.assignedCaseManagerName ?? '—'}</p>
        </div>
        <div>
          <span className={labelClass}>Created</span>
          <p className="text-sm text-ink">{new Date(caseDetail.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7">
        <div className="col-span-2">
          <label className={labelClass} htmlFor="case-subject">
            Subject
          </label>
          <input
            id="case-subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="case-status">
            Status
          </label>
          <select
            id="case-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="case-priority">
            Priority
          </label>
          <select
            id="case-priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className={fieldClass}
          >
            <option value="">—</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="case-last-contact">
            Last Contact Date
          </label>
          <input
            id="case-last-contact"
            type="date"
            value={lastContactDate}
            onChange={(event) => setLastContactDate(event.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
