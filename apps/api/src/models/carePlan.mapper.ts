import type {
  CarePlan,
  CarePlanDetail,
  CarePlanStatus,
  CarePlanTemplate,
  CarePlanTemplateListItem,
  GoalAssignment,
  GoalAssignmentDetail,
  GoalPriority,
  GoalStatus,
} from '@housing360/types';
import { toTask } from './task.mapper';
import type { TaskRow } from './task.model';
import type {
  CarePlanGoalRow,
  CarePlanRow,
  CarePlanTemplateListRow,
  CarePlanTemplateRow,
} from './carePlan.model';

export function toCarePlanTemplateListItem(row: CarePlanTemplateListRow): CarePlanTemplateListItem {
  return { id: row.id, name: row.name, description: row.description, isPublished: row.isPublished };
}

export function toCarePlanTemplate(row: CarePlanTemplateRow): CarePlanTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isPublished: row.isPublished,
    goals: row.goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      description: goal.description,
      priority: goal.priority,
      serviceDomain: goal.serviceDomain,
      tasks: goal.tasks.map((task) => ({ id: task.id, subject: task.subject, description: task.description })),
    })),
  };
}

const VALID_PRIORITIES: readonly GoalPriority[] = ['High', 'Medium', 'Low'];
const VALID_GOAL_STATUSES: readonly GoalStatus[] = ['Not Started', 'In Progress', 'Completed', 'Canceled'];
const VALID_CARE_PLAN_STATUSES: readonly CarePlanStatus[] = [
  'Proposed',
  'Draft',
  'Active',
  'Completed',
  'Cancelled',
];

function toGoalPriority(value: string | null): GoalPriority | null {
  return value && (VALID_PRIORITIES as readonly string[]).includes(value) ? (value as GoalPriority) : null;
}

function toGoalStatus(value: string): GoalStatus {
  return (VALID_GOAL_STATUSES as readonly string[]).includes(value) ? (value as GoalStatus) : 'Not Started';
}

function toCarePlanStatus(value: string): CarePlanStatus {
  return (VALID_CARE_PLAN_STATUSES as readonly string[]).includes(value)
    ? (value as CarePlanStatus)
    : 'Proposed';
}

export function toGoalAssignment(row: Omit<CarePlanGoalRow, 'tasks'>): GoalAssignment {
  return {
    id: row.id,
    carePlanId: row.carePlanId,
    goalDefinitionId: row.goalDefinitionId,
    name: row.name,
    description: row.description,
    priority: toGoalPriority(row.priority),
    status: toGoalStatus(row.status),
    serviceDomain: row.serviceDomain,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toGoalAssignmentDetail(row: CarePlanGoalRow): GoalAssignmentDetail {
  return { ...toGoalAssignment(row), tasks: row.tasks.map((task: TaskRow) => toTask(task)) };
}

export function toCarePlan(row: CarePlanRow): CarePlan {
  return {
    id: row.id,
    caseId: row.caseId,
    clientId: row.clientId,
    name: row.name,
    description: row.description,
    status: toCarePlanStatus(row.status),
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    templateId: row.templateId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toCarePlanDetail(row: CarePlanRow): CarePlanDetail {
  const goals = row.goals.map((goal) => toGoalAssignmentDetail(goal));
  const tasksTotal = goals.reduce((sum, goal) => sum + goal.tasks.length, 0);
  const tasksDone = goals.reduce(
    (sum, goal) => sum + goal.tasks.filter((task) => task.status === 'completed').length,
    0
  );
  return { ...toCarePlan(row), goals, tasksDone, tasksTotal };
}
