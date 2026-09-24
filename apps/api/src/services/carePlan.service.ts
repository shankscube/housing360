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
  findCarePlanTemplateRules,
  findCoveredServiceDomainsByClient,
  findGoalAssignmentById,
  findGoalDefinitions,
  updateCarePlan as updateCarePlanRow,
  updateGoalAssignment as updateGoalAssignmentRow,
  type CarePlanTemplateRuleRow,
  type GoalCreateData,
} from '../models/carePlan.model';
import { findLatestCompletedAssessmentForEnrollment, type AssessmentRow } from '../models/assessment.model';
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

/** A rule's condition string is `"field=value"` — compares the enrollment's
 * latest assessment's own column value, case-insensitively. Anything else
 * (missing `=`, unknown field, null value) never matches. */
function fieldConditionMatches(condition: string, assessment: AssessmentRow): boolean {
  const separatorIndex = condition.indexOf('=');
  if (separatorIndex === -1) {
    return false;
  }
  const field = condition.slice(0, separatorIndex).trim();
  const expected = condition.slice(separatorIndex + 1).trim();
  const actual = (assessment as unknown as Record<string, unknown>)[field];
  if (actual === null || actual === undefined || expected === '') {
    return false;
  }
  return String(actual).trim().toLowerCase() === expected.toLowerCase();
}

/** A rule matches when its score band contains the assessment's score
 * (bounds are independent — a `null` bound is unbounded on that side) OR its
 * `fieldCondition` matches — whichever criteria the rule actually specifies;
 * a rule with neither never matches (design.md Decision 5). */
function templateRuleMatches(rule: CarePlanTemplateRuleRow, assessment: AssessmentRow): boolean {
  const hasScoreBand = rule.scoreBandMin !== null || rule.scoreBandMax !== null;
  if (hasScoreBand && assessment.score !== null) {
    const min = rule.scoreBandMin ?? -Infinity;
    const max = rule.scoreBandMax ?? Infinity;
    if (assessment.score >= min && assessment.score <= max) {
      return true;
    }
  }
  if (rule.fieldCondition) {
    return fieldConditionMatches(rule.fieldCondition, assessment);
  }
  return false;
}

/**
 * Ranks published care plan templates using `care_plan_template_rules`
 * against the enrollment's latest completed, scored assessment, highest
 * `priority` first — replacing the prior "every published template, no real
 * signal" placeholder (design.md Decision 5). Falls back to every published
 * template, preserving the placeholder's old behavior, whenever the
 * enrollment has no completed/scored assessment yet OR no rule matches (the
 * assessment-tracking spec's "No scored assessment falls back to all
 * published templates" requirement) — so an enrollment never sees an empty
 * recommendation strip.
 */
export async function getRecommendedCarePlanTemplates(
  programEnrollmentId: string
): Promise<CarePlanTemplateListItem[]> {
  const fallbackToAllPublished = async () => {
    const rows = await findCarePlanTemplateList(true);
    return rows.map(toCarePlanTemplateListItem);
  };

  const latestAssessment = await findLatestCompletedAssessmentForEnrollment(programEnrollmentId);
  if (!latestAssessment || latestAssessment.score === null) {
    return fallbackToAllPublished();
  }

  const rules = await findCarePlanTemplateRules();
  const seenTemplateIds = new Set<string>();
  const matchedTemplates: CarePlanTemplateListItem[] = [];
  for (const rule of rules) {
    if (
      rule.template.isPublished &&
      !seenTemplateIds.has(rule.templateId) &&
      templateRuleMatches(rule, latestAssessment)
    ) {
      seenTemplateIds.add(rule.templateId);
      matchedTemplates.push(toCarePlanTemplateListItem(rule.template));
    }
  }

  return matchedTemplates.length > 0 ? matchedTemplates : fallbackToAllPublished();
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
