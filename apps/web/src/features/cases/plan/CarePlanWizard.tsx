import { useEffect, useState } from 'react';
import type { CarePlanDetail, GoalAssignmentDetail, GoalPriority } from '@housing360/types';
import { Button, Modal, useToast } from '../../../components/ui';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  addGoalToCarePlan,
  createCarePlan,
  fetchCarePlanTemplateDetail,
  fetchCarePlanTemplates,
  fetchCarePlansByCase,
  fetchGoalDefinitions,
  fetchRecommendedCarePlanTemplates,
  updateCarePlan,
  updateGoalAssignment,
} from '../../../store/slices/carePlansSlice';
import { fieldWrapClass, formActionsClass, formGridClass, inputClass, labelClass, textareaClass } from '../shared/formStyles';

export type CarePlanWizardMode = 'create' | 'editPlan' | 'addGoal' | 'editGoal';

export interface CarePlanWizardProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  clientId: string;
  mode: CarePlanWizardMode;
  existingPlan?: CarePlanDetail | null;
  existingGoal?: GoalAssignmentDetail | null;
  /** "Create from Template" pre-fill entry point (Assessments tab, Group 7). */
  preFillTemplateId?: string | null;
}

interface DraftTask {
  key: string;
  subject: string;
  dueDate: string;
}

interface DraftGoal {
  key: string;
  goalDefinitionId: string | null;
  name: string;
  description: string;
  priority: GoalPriority | '';
  serviceDomain: string;
  tasks: DraftTask[];
}

const STATUS_OPTIONS = ['Proposed', 'Draft', 'Active', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS: GoalPriority[] = ['High', 'Medium', 'Low'];

let keyCounter = 0;
function nextKey(): string {
  keyCounter += 1;
  return `draft-${keyCounter}`;
}

function emptyGoal(): DraftGoal {
  return { key: nextKey(), goalDefinitionId: null, name: '', description: '', priority: '', serviceDomain: '', tasks: [] };
}

function emptyTask(): DraftTask {
  return { key: nextKey(), subject: '', dueDate: '' };
}

/**
 * One component covers all four entry points the Plan tab needs — see
 * design.md Decision 5. `create` runs the full 3-step flow (template picker →
 * goals → tasks) and writes plan+goals+tasks in one transaction. `editPlan`
 * only touches the plan's own fields. `addGoal` combines the goal+tasks
 * steps against an existing plan. `editGoal` edits one goal's own fields —
 * its tasks stay managed inline in `CarePlanList` (status change/New Task),
 * not re-editable from here.
 */
export function CarePlanWizard({
  isOpen,
  onClose,
  caseId,
  clientId,
  mode,
  existingPlan,
  existingGoal,
  preFillTemplateId,
}: CarePlanWizardProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { templates, recommendedTemplates, selectedTemplate, goalDefinitions } = useAppSelector(
    (state) => state.carePlans
  );

  const [step, setStep] = useState(1);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState(existingPlan?.name ?? '');
  const [description, setDescription] = useState(existingPlan?.description ?? '');
  const [status, setStatus] = useState<string>(existingPlan?.status ?? 'Proposed');
  const [startDate, setStartDate] = useState(existingPlan?.startDate?.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(existingPlan?.endDate?.slice(0, 10) ?? '');
  const [goals, setGoals] = useState<DraftGoal[]>([emptyGoal()]);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = mode === 'create' ? 3 : 1;

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'create') {
      dispatch(fetchRecommendedCarePlanTemplates(caseId));
      dispatch(fetchCarePlanTemplates({ published: true, search: templateSearch || undefined }));
      dispatch(fetchGoalDefinitions());
    }
    if (mode === 'addGoal') {
      dispatch(fetchGoalDefinitions());
    }
    if (mode === 'editGoal' && existingGoal) {
      setGoals([
        {
          key: nextKey(),
          goalDefinitionId: existingGoal.goalDefinitionId,
          name: existingGoal.name,
          description: existingGoal.description ?? '',
          priority: existingGoal.priority ?? '',
          serviceDomain: existingGoal.serviceDomain ?? '',
          tasks: [],
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen && mode === 'create' && preFillTemplateId) {
      setTemplateId(preFillTemplateId);
    }
  }, [isOpen, mode, preFillTemplateId]);

  useEffect(() => {
    if (templateId) {
      dispatch(fetchCarePlanTemplateDetail(templateId));
    }
  }, [templateId, dispatch]);

  useEffect(() => {
    if (selectedTemplate && selectedTemplate.id === templateId) {
      setName(selectedTemplate.name);
      setDescription(selectedTemplate.description ?? '');
      setGoals(
        selectedTemplate.goals.map((goal) => ({
          key: nextKey(),
          goalDefinitionId: null,
          name: goal.name,
          description: goal.description ?? '',
          priority: (goal.priority as GoalPriority) ?? '',
          serviceDomain: goal.serviceDomain ?? '',
          tasks: goal.tasks.map((task) => ({ key: nextKey(), subject: task.subject, dueDate: '' })),
        }))
      );
    }
  }, [selectedTemplate, templateId]);

  function resetAndClose() {
    setStep(1);
    setTemplateId(null);
    setName('');
    setDescription('');
    setStatus('Proposed');
    setStartDate('');
    setEndDate('');
    setGoals([emptyGoal()]);
    setGoalError(null);
    onClose();
  }

  function updateGoal(key: string, patch: Partial<DraftGoal>) {
    setGoals((prev) => prev.map((goal) => (goal.key === key ? { ...goal, ...patch } : goal)));
  }

  function removeGoal(key: string) {
    setGoals((prev) => prev.filter((goal) => goal.key !== key));
  }

  function updateTask(goalKey: string, taskKey: string, patch: Partial<DraftTask>) {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.key === goalKey
          ? { ...goal, tasks: goal.tasks.map((task) => (task.key === taskKey ? { ...task, ...patch } : task)) }
          : goal
      )
    );
  }

  function removeTask(goalKey: string, taskKey: string) {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.key === goalKey ? { ...goal, tasks: goal.tasks.filter((task) => task.key !== taskKey) } : goal
      )
    );
  }

  function handleNextFromGoals(): boolean {
    if (goals.some((goal) => !goal.name.trim())) {
      setGoalError('Give every goal a name, or remove the empty one, to continue.');
      return false;
    }
    setGoalError(null);
    return true;
  }

  async function handleFinalSubmit() {
    if (goals.some((goal) => goal.tasks.some((task) => !task.subject.trim()))) {
      showToast('Give every task a subject, or remove the empty one, to continue.');
      return;
    }

    setIsSaving(true);

    if (mode === 'create') {
      const result = await dispatch(
        createCarePlan({
          caseId,
          clientId,
          name: name.trim(),
          description: description.trim() || undefined,
          status: status as CarePlanDetail['status'],
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          templateId: templateId ?? undefined,
          goals: goals.map((goal) => ({
            goalDefinitionId: goal.goalDefinitionId ?? undefined,
            name: goal.name.trim(),
            description: goal.description.trim() || undefined,
            priority: (goal.priority || undefined) as GoalPriority | undefined,
            serviceDomain: goal.serviceDomain || undefined,
            tasks: goal.tasks.map((task) => ({ subject: task.subject.trim(), dueDate: task.dueDate || undefined })),
          })),
        })
      );
      setIsSaving(false);
      if (createCarePlan.fulfilled.match(result)) {
        showToast('Care plan created.', 'success');
        resetAndClose();
      } else {
        showToast('Failed to create the care plan. Please try again.');
      }
      return;
    }

    if (mode === 'editPlan' && existingPlan) {
      const result = await dispatch(
        updateCarePlan({
          id: existingPlan.id,
          input: {
            name: name.trim(),
            description: description.trim() || undefined,
            status: status as CarePlanDetail['status'],
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        })
      );
      setIsSaving(false);
      if (updateCarePlan.fulfilled.match(result)) {
        showToast('Care plan updated.', 'success');
        resetAndClose();
      } else {
        showToast('Failed to update the care plan. Please try again.');
      }
      return;
    }

    if (mode === 'addGoal' && existingPlan) {
      const goal = goals[0];
      if (!goal) {
        setIsSaving(false);
        return;
      }
      const result = await dispatch(
        addGoalToCarePlan({
          carePlanId: existingPlan.id,
          goalDefinitionId: goal.goalDefinitionId ?? undefined,
          name: goal.name.trim(),
          description: goal.description.trim() || undefined,
          priority: (goal.priority || undefined) as GoalPriority | undefined,
          serviceDomain: goal.serviceDomain || undefined,
          tasks: goal.tasks.map((task) => ({ subject: task.subject.trim(), dueDate: task.dueDate || undefined })),
        })
      );
      setIsSaving(false);
      if (addGoalToCarePlan.fulfilled.match(result)) {
        showToast('Goal added.', 'success');
        dispatch(fetchCarePlansByCase(caseId));
        resetAndClose();
      } else {
        showToast('Failed to add the goal. Please try again.');
      }
      return;
    }

    if (mode === 'editGoal' && existingGoal) {
      const goal = goals[0];
      if (!goal) {
        setIsSaving(false);
        return;
      }
      const result = await dispatch(
        updateGoalAssignment({
          id: existingGoal.id,
          input: {
            name: goal.name.trim(),
            description: goal.description.trim() || undefined,
            priority: (goal.priority || undefined) as GoalPriority | undefined,
            serviceDomain: goal.serviceDomain || undefined,
          },
        })
      );
      setIsSaving(false);
      if (updateGoalAssignment.fulfilled.match(result)) {
        showToast('Goal updated.', 'success');
        dispatch(fetchCarePlansByCase(caseId));
        resetAndClose();
      } else {
        showToast('Failed to update the goal. Please try again.');
      }
    }
  }

  const title =
    mode === 'create'
      ? 'New Care Plan'
      : mode === 'editPlan'
        ? 'Edit Care Plan'
        : mode === 'addGoal'
          ? 'Add Goal'
          : 'Edit Goal';

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={title} size="lg">
      <div className="flex flex-col gap-6">
        {mode === 'create' ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
            Step {step} of {totalSteps}
          </p>
        ) : null}

        {(mode === 'create' && step === 1) || mode === 'editPlan' ? (
          <div className="flex flex-col gap-6">
            {mode === 'create' ? (
              <div className={fieldWrapClass}>
                <label className={labelClass}>Template</label>
                <input
                  type="search"
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Search published templates"
                  className={inputClass}
                />
                <div className="mt-2 flex flex-col gap-2">
                  {recommendedTemplates.length > 0 ? (
                    <>
                      <span className="text-2xs font-semibold uppercase tracking-wide text-textFaint">
                        Recommended for this client
                      </span>
                      {recommendedTemplates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setTemplateId(template.id)}
                          className={`rounded-md border px-4 py-2.5 text-left text-sm ${templateId === template.id ? 'border-ink bg-surfaceMuted' : 'border-borderRow'}`}
                        >
                          {template.name}
                        </button>
                      ))}
                    </>
                  ) : null}
                  {templates
                    .filter((template) => !recommendedTemplates.some((r) => r.id === template.id))
                    .map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setTemplateId(template.id)}
                        className={`rounded-md border px-4 py-2.5 text-left text-sm ${templateId === template.id ? 'border-ink bg-surfaceMuted' : 'border-borderRow'}`}
                      >
                        {template.name}
                      </button>
                    ))}
                </div>
              </div>
            ) : null}

            <div className={fieldWrapClass}>
              <label className={labelClass} htmlFor="cp-name">
                Name *
              </label>
              <input id="cp-name" type="text" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </div>
            <div className={fieldWrapClass}>
              <label className={labelClass} htmlFor="cp-description">
                Description
              </label>
              <textarea
                id="cp-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={textareaClass}
              />
            </div>
            <div className={formGridClass}>
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="cp-status">
                  Status
                </label>
                <select id="cp-status" value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="cp-start">
                  Start Date
                </label>
                <input id="cp-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputClass} />
              </div>
              <div className={fieldWrapClass}>
                <label className={labelClass} htmlFor="cp-end">
                  End Date
                </label>
                <input id="cp-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
        ) : null}

        {(mode === 'create' && step === 2) || mode === 'addGoal' || mode === 'editGoal' ? (
          <div className="flex flex-col gap-6">
            {goals.map((goal) => (
              <div key={goal.key} className="rounded-lg border border-borderRow p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Goal</span>
                  {mode === 'create' && goals.length > 1 ? (
                    <button type="button" onClick={() => removeGoal(goal.key)} className="text-xs text-coralDeep hover:underline">
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className={formGridClass}>
                  <div className={fieldWrapClass}>
                    <label className={labelClass}>Suggested Goal</label>
                    <select
                      value={goal.goalDefinitionId ?? ''}
                      onChange={(event) => {
                        const def = goalDefinitions.find((d) => d.id === event.target.value);
                        updateGoal(goal.key, {
                          goalDefinitionId: event.target.value || null,
                          name: def ? def.name : goal.name,
                          serviceDomain: def?.serviceDomain ?? goal.serviceDomain,
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="">Type your own goal below</option>
                      {goalDefinitions.map((def) => (
                        <option key={def.id} value={def.id}>
                          {def.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={fieldWrapClass}>
                    <label className={labelClass}>Goal Name *</label>
                    <input
                      type="text"
                      value={goal.name}
                      onChange={(event) => updateGoal(goal.key, { name: event.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className={fieldWrapClass}>
                    <label className={labelClass}>Priority</label>
                    <select
                      value={goal.priority}
                      onChange={(event) => updateGoal(goal.key, { priority: event.target.value as GoalPriority })}
                      className={inputClass}
                    >
                      <option value="">Select…</option>
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {mode === 'create' || mode === 'addGoal' ? (
                  <div className="mt-5 flex flex-col gap-3">
                    <span className="text-2xs font-semibold uppercase tracking-wide text-textFaint">Tasks</span>
                    {goal.tasks.map((task) => (
                      <div key={task.key} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={task.subject}
                          onChange={(event) => updateTask(goal.key, task.key, { subject: event.target.value })}
                          placeholder="Task subject"
                          className={inputClass}
                        />
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(event) => updateTask(goal.key, task.key, { dueDate: event.target.value })}
                          className={inputClass}
                        />
                        <button
                          type="button"
                          onClick={() => removeTask(goal.key, task.key)}
                          className="shrink-0 text-xs text-coralDeep hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateGoal(goal.key, { tasks: [...goal.tasks, emptyTask()] })}
                      className="self-start text-xs font-semibold text-tealDeep hover:underline"
                    >
                      + Add Task
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
            {mode === 'create' ? (
              <button
                type="button"
                onClick={() => setGoals((prev) => [...prev, emptyGoal()])}
                className="self-start text-sm font-semibold text-tealDeep hover:underline"
              >
                + Add Another Goal
              </button>
            ) : null}
            {goalError ? <p className="text-xs font-medium text-coralDeep">{goalError}</p> : null}
          </div>
        ) : null}

        <div className={formActionsClass}>
          <Button variant="tertiary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>
          {mode === 'create' && step < 3 ? (
            <Button
              variant="primary"
              onClick={() => {
                if (step === 2 && !handleNextFromGoals()) return;
                setStep((prev) => prev + 1);
              }}
            >
              Next
            </Button>
          ) : (
            <Button variant="primary" onClick={handleFinalSubmit} disabled={isSaving}>
              {mode === 'create' ? 'Create Care Plan' : 'Save'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
