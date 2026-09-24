import { useEffect, useState } from 'react';
import { Button, StatusBadge } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchCaseTasks } from '../../../store/slices/casesSlice';
import { NewTaskModal } from '../shared/NewTaskModal';
import { caseOptionLabel, casePriorityLabel } from '../shared/caseLabels';

export interface TasksCardProps {
  clientId: string;
  caseId: string;
}

function formatDueDate(value: string | null): string {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}

export function TasksCard({ clientId, caseId }: TasksCardProps) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.cases.detail.tasks);
  const [showNewTask, setShowNewTask] = useState(false);

  useEffect(() => {
    dispatch(fetchCaseTasks(caseId));
  }, [dispatch, caseId]);

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-surface p-8 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-semibold text-ink">Tasks</h2>
        <Button variant="secondary" size="sm" onClick={() => setShowNewTask(true)}>
          New Task
        </Button>
      </div>

      {status === 'loading' ? <p className="text-sm text-textMuted">Loading…</p> : null}

      {status !== 'loading' && items.length === 0 ? (
        <p className="text-sm text-textMuted">No tasks yet.</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-borderRow px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{task.subject}</p>
                <p className="text-xs text-textMuted">
                  {formatDueDate(task.dueDate)}
                  {task.priority ? ` · ${casePriorityLabel(task.priority)} priority` : ''}
                </p>
              </div>
              <StatusBadge label={caseOptionLabel(task.status)} />
            </li>
          ))}
        </ul>
      ) : null}

      <NewTaskModal
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        clientId={clientId}
        caseId={caseId}
      />
    </div>
  );
}
