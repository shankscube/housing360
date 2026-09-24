import { useState } from 'react';
import { Button, Modal, StatusBadge } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearSelectedInteractionSummary } from '../../../store/slices/casesSlice';
import { NewTaskModal } from '../shared/NewTaskModal';
import { caseOptionLabel } from '../shared/caseLabels';
import { InteractionSummaryForm } from './InteractionSummaryForm';

export interface InteractionSummaryDetailProps {
  clientId: string;
  caseId: string;
}

function formatDate(value: string | null): string {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}

export function InteractionSummaryDetail({ clientId, caseId }: InteractionSummaryDetailProps) {
  const dispatch = useAppDispatch();
  const { selected } = useAppSelector((state) => state.cases.detail.interactionSummaries);
  const [showEdit, setShowEdit] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  if (!selected) {
    return null;
  }

  const now = Date.now();

  return (
    <>
      <Modal
        isOpen
        onClose={() => dispatch(clearSelectedInteractionSummary())}
        title={selected.title}
        size="lg"
      >
        <div className="flex flex-col gap-7">
          <div className="flex items-center justify-between">
            <StatusBadge label={caseOptionLabel(selected.status)} />
            <Button variant="tertiary" size="sm" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">
              Information
            </h3>
            <div className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <span className="text-xs text-textMuted">Interaction Purpose</span>
                <p className="text-ink">{caseOptionLabel(selected.interactionPurpose)}</p>
              </div>
              <div>
                <span className="text-xs text-textMuted">Confidentiality Type</span>
                <p className="text-ink">{caseOptionLabel(selected.confidentialityType)}</p>
              </div>
              <div>
                <span className="text-xs text-textMuted">Partner Account</span>
                <p className="text-ink">{selected.partnerAccount ?? '—'}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textMuted">
              More Details
            </h3>
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <span className="text-xs text-textMuted">Meeting Notes</span>
                <p className="whitespace-pre-wrap text-ink">{selected.meetingNotes || '—'}</p>
              </div>
              <div>
                <span className="text-xs text-textMuted">Next Steps</span>
                <p className="whitespace-pre-wrap text-ink">{selected.nextSteps || '—'}</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-textMuted">
                Upcoming &amp; Overdue
              </h3>
              <Button variant="secondary" size="sm" onClick={() => setShowNewTask(true)}>
                New Task
              </Button>
            </div>
            {selected.tasks.length === 0 ? (
              <p className="text-sm text-textMuted">No tasks linked to this interaction summary.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {selected.tasks.map((task) => {
                  const overdue = task.dueDate ? new Date(task.dueDate).getTime() < now : false;
                  return (
                    <li
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">{task.subject}</p>
                        <p className={`text-xs ${overdue ? 'text-coralDeep' : 'text-textMuted'}`}>
                          {formatDate(task.dueDate)}
                        </p>
                      </div>
                      <StatusBadge label={caseOptionLabel(task.status)} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Modal>

      <InteractionSummaryForm
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        clientId={clientId}
        caseId={caseId}
        existingSummary={selected}
      />

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        clientId={clientId}
        caseId={caseId}
        interactionSummaryId={selected.id}
      />
    </>
  );
}
