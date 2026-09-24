import type {
  CarePlanCreateInput,
  CarePlanDetail,
  CarePlanTemplate,
  CarePlanTemplateListItem,
  CarePlanUpdateInput,
  CarePlanWizardGoalInput,
  GoalAssignment,
  GoalAssignmentCreateInput,
  GoalAssignmentUpdateInput,
  GoalDefinition,
  ServiceGap,
  Task,
  TaskCreateInput,
} from '@housing360/types';
import {
  addGoalToCarePlan as addGoalToCarePlanRow,
  createCarePlanWithGoals,
  findActiveGoalServiceDomainsByCase,
  findCarePlanById,
  findCarePlansByCase,
  findCarePlanTemplateById,
  findCarePlanTemplateList,
  findCoveredServiceDomainsByClient,
  findGoalAssignmentById,
  findGoalDefinitions,
  updateCarePlan as updateCarePlanRow,
  updateGoalAssignment as updateGoalAssignmentRow,
  type GoalCreateData,
} from '../models/carePlan.model';
import { createTask } from './task.service';
import {
  toCarePlanDetail,
  toCarePlanTemplate,
  toCarePlanTemplateListItem,
  toGoalAssignment,
  toGoalAssignmentDetail,
} from '../models/carePlan.mapper';
import { AppError } from '../utils/AppError';

/** Same two rules the wizard blocks client-side before it ever submits — see design.md Decision 5. */
function validateGoals(goals: CarePlanWizardGoalInput[]): void {
  if (goals.some((goal) => !goal.name || !goal.name.trim())) {
    throw new AppError(400, 'Give every goal a name, or remove the empty one, to continue.');
  }
  for (const goal of goals) {
    if (goal.tasks.some((task) => !task.subject || !task.subject.trim())) {
      throw new AppError(400, 'Give every task a subject, or remove the empty one, to continue.');
    }
  }
}

function toGoalCreateData(goal: CarePlanWizardGoalInput): GoalCreateData {
  return {
    goalDefinitionId: goal.goalDefinitionId ?? null,
    name: goal.name,
    description: goal.description ?? null,
    priority: goal.priority ?? null,
    serviceDomain: goal.serviceDomain ?? null,
    tasks: goal.tasks.map((task) => ({
      subject: task.subject,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
    })),
  };
}

export async function listCarePlansByCase(caseId: string): Promise<CarePlanDetail[]> {
  const rows = await findCarePlansByCase(caseId);
  return rows.map(toCarePlanDetail);
}

export async function getCarePlanById(id: string): Promise<CarePlanDetail> {
  const row = await findCarePlanById(id);
  if (!row) {
    throw new AppError(404, 'Care plan not found');
  }
  return toCarePlanDetail(row);
}

export async function listCarePlanTemplates(
  published?: boolean,
  search?: string
): Promise<CarePlanTemplateListItem[]> {
  const rows = await findCarePlanTemplateList(published, search);
  return rows.map(toCarePlanTemplateListItem);
}

export async function getCarePlanTemplateById(id: string): Promise<CarePlanTemplate> {
  const row = await findCarePlanTemplateById(id);
  if (!row) {
    throw new AppError(404, 'Care plan template not found');
  }
  return toCarePlanTemplate(row);
}

/**
 * "Recommended for this client" has no defined scoring criteria in the
 * proposal beyond "shown first" — this change surfaces every published
 * template as recommended (no ranking signal exists yet, e.g. from the
 * client's assessment or disability data) rather than fabricating a
 * relevance score. Revisit once a real signal is identified.
 */
export async function getRecommendedCarePlanTemplates(): Promise<CarePlanTemplateListItem[]> {
  const rows = await findCarePlanTemplateList(true);
  return rows.map(toCarePlanTemplateListItem);
}

export async function listGoalDefinitions(): Promise<GoalDefinition[]> {
  const rows = await findGoalDefinitions();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    serviceDomain: row.serviceDomain,
  }));
}

export async function createCarePlan(input: CarePlanCreateInput): Promise<CarePlanDetail> {
  if (!input.name || !input.name.trim()) {
    throw new AppError(400, 'Please enter a name for the care plan.');
  }
  validateGoals(input.goals);

  const row = await createCarePlanWithGoals({
    caseId: input.caseId,
    clientId: input.clientId,
    name: input.name.trim(),
    description: input.description ?? null,
    status: input.status,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    templateId: input.templateId ?? null,
    goals: input.goals.map(toGoalCreateData),
  });

  return toCarePlanDetail(row);
}

export async function updateCarePlan(id: string, input: CarePlanUpdateInput): Promise<CarePlanDetail> {
  const existing = await findCarePlanById(id);
  if (!existing) {
    throw new AppError(404, 'Care plan not found');
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw new AppError(400, 'Please enter a name for the care plan.');
  }

  const row = await updateCarePlanRow(id, {
    name: input.name,
    description: input.description,
    status: input.status,
    startDate: input.startDate ? new Date(input.startDate) : input.startDate,
    endDate: input.endDate ? new Date(input.endDate) : input.endDate,
  });
  return toCarePlanDetail(row);
}

export async function addGoalToCarePlan(input: GoalAssignmentCreateInput): Promise<GoalAssignment> {
  validateGoals([input]);
  const row = await addGoalToCarePlanRow(input.carePlanId, toGoalCreateData(input));
  return toGoalAssignment(row);
}

export async function updateGoalAssignment(
  id: string,
  input: GoalAssignmentUpdateInput
): Promise<GoalAssignment> {
  const existing = await findGoalAssignmentById(id);
  if (!existing) {
    throw new AppError(404, 'Goal not found');
  }
  if (input.name !== undefined && !input.name.trim()) {
    throw new AppError(400, 'Give every goal a name, or remove the empty one, to continue.');
  }
  const row = await updateGoalAssignmentRow(id, input);
  return toGoalAssignment(row);
}

export async function getGoalAssignmentDetail(id: string) {
  const row = await findGoalAssignmentById(id);
  if (!row) {
    throw new AppError(404, 'Goal not found');
  }
  return toGoalAssignmentDetail(row);
}

export async function addTaskToGoal(goalId: string, input: Omit<TaskCreateInput, 'clientId' | 'caseId' | 'goalAssignmentId'>): Promise<Task> {
  const goal = await findGoalAssignmentById(goalId);
  if (!goal) {
    throw new AppError(404, 'Goal not found');
  }
  return createTask({
    ...input,
    clientId: goal.carePlan.clientId,
    caseId: goal.carePlan.caseId,
    goalAssignmentId: goalId,
    subtype: 'goal',
  });
}

/** Design.md Decision 6 — computed at request time, never stored. */
export async function getServiceGaps(caseId: string, clientId: string): Promise<ServiceGap[]> {
  const [activeGoalDomains, coveredDomains] = await Promise.all([
    findActiveGoalServiceDomainsByCase(caseId),
    findCoveredServiceDomainsByClient(clientId),
  ]);
  return activeGoalDomains.filter((goal) => !coveredDomains.has(goal.serviceDomain));
}
