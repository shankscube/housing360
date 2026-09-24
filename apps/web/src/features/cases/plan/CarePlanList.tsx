import type { CarePlanDetail, GoalAssignmentDetail } from '@housing360/types';
import { ExpandableRow, StatusBadge } from '../../../components/ui';
import { useAppDispatch } from '../../../store/hooks';
import { updateGoalTaskStatus } from '../../../store/slices/carePlansSlice';
import { caseOptionLabel, casePriorityLabel } from '../shared/caseLabels';

export interface CarePlanListProps {
  plans: CarePlanDetail[];
  onNewTaskForGoal: (goal: GoalAssignmentDetail) => void;
  onEditPlan: (plan: CarePlanDetail) => void;
  onAddGoal: (plan: CarePlanDetail) => void;
  onEditGoal: (goal: GoalAssignmentDetail) => void;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

const TASK_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

function GoalRow({
  goal,
  onNewTask,
  onEditGoal,
}: {
  goal: GoalAssignmentDetail;
  onNewTask: () => void;
  onEditGoal: () => void;
}) {
  const dispatch = useAppDispatch();

  return (
    <ExpandableRow
      summary={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-ink">{goal.name}</span>
            {goal.priority ? (
              <span className="ml-3">
                <StatusBadge label={casePriorityLabel(goal.priority) ?? goal.priority} />
              </span>
            ) : null}
          </div>
          <StatusBadge label={goal.status} />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Tasks</span>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEditGoal();
              }}
              className="text-xs font-semibold text-textMuted hover:text-ink"
            >
              Edit Goal
            </button>
            <button type="button" onClick={onNewTask} className="text-xs font-semibold text-tealDeep hover:underline">
              New Task
            </button>
          </div>
        </div>
        {goal.tasks.length === 0 ? (
          <p className="text-sm text-textMuted">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {goal.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-borderRow bg-surface px-4 py-3"
              >
                <span className="text-sm text-ink">{task.subject}</span>
                <select
                  value={task.status}
                  onChange={(event) => dispatch(updateGoalTaskStatus({ id: task.id, status: event.target.value }))}
                  className="rounded-md border border-borderStrong bg-surface px-3 py-1.5 text-xs text-ink outline-none"
                >
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ExpandableRow>
  );
}

export function CarePlanList({ plans, onNewTaskForGoal, onEditPlan, onAddGoal, onEditGoal }: CarePlanListProps) {
  if (plans.length === 0) {
    return <p className="text-sm text-textMuted">No care plans yet for this case.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {plans.map((plan) => (
        <ExpandableRow
          key={plan.id}
          defaultExpanded
          summary={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-sm font-semibold text-ink">{plan.name}</span>
                <p className="text-xs text-textMuted">
                  {plan.description ?? 'No description'} · Start {formatDate(plan.startDate)} · Target{' '}
                  {formatDate(plan.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-textMuted">
                  {plan.tasksDone}/{plan.tasksTotal} tasks done
                </span>
                <StatusBadge label={caseOptionLabel(plan.status)} />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditPlan(plan);
                  }}
                  className="text-xs font-semibold text-textMuted hover:text-ink"
                >
                  Edit
                </button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-3">
            {plan.goals.length === 0 ? (
              <p className="text-sm text-textMuted">No goals yet.</p>
            ) : (
              plan.goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  onNewTask={() => onNewTaskForGoal(goal)}
                  onEditGoal={() => onEditGoal(goal)}
                />
              ))
            )}
            <button
              type="button"
              onClick={() => onAddGoal(plan)}
              className="self-start text-xs font-semibold text-tealDeep hover:underline"
            >
              + Add Goal
            </button>
          </div>
        </ExpandableRow>
      ))}
    </div>
  );
}
