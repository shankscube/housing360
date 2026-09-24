import type { Task } from './tasks';

export interface CarePlanTemplateTask {
  id: string;
  subject: string;
  description: string | null;
}

export interface CarePlanTemplateGoal {
  id: string;
  name: string;
  description: string | null;
  priority: string | null;
  serviceDomain: string | null;
  tasks: CarePlanTemplateTask[];
}

export interface CarePlanTemplate {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
  goals: CarePlanTemplateGoal[];
}

/** List-row shape — no nested goals, used by the template picker's list/search. */
export interface CarePlanTemplateListItem {
  id: string;
  name: string;
  description: string | null;
  isPublished: boolean;
}

export interface GoalDefinition {
  id: string;
  name: string;
  description: string | null;
  serviceDomain: string | null;
}

export type GoalPriority = 'High' | 'Medium' | 'Low';
export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Canceled';
export type CarePlanStatus = 'Proposed' | 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface GoalAssignment {
  id: string;
  carePlanId: string;
  goalDefinitionId: string | null;
  name: string;
  description: string | null;
  priority: GoalPriority | null;
  status: GoalStatus;
  serviceDomain: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Goal + its tasks — the Plan tab's expandable-row shape. */
export interface GoalAssignmentDetail extends GoalAssignment {
  tasks: Task[];
}

export interface CarePlan {
  id: string;
  caseId: string;
  clientId: string;
  name: string;
  description: string | null;
  status: CarePlanStatus;
  startDate: string | null;
  endDate: string | null;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The Plan tab's list-row shape — plan plus its goals (each with tasks) and a tasks-done/total rollup. */
export interface CarePlanDetail extends CarePlan {
  goals: GoalAssignmentDetail[];
  tasksDone: number;
  tasksTotal: number;
}

/** One goal in the wizard's Goals step, before it's saved. */
export interface CarePlanWizardGoalInput {
  goalDefinitionId?: string | null;
  name: string;
  description?: string;
  priority?: GoalPriority;
  serviceDomain?: string;
  tasks: { subject: string; dueDate?: string }[];
}

/** `POST /api/care-plans` — plan + goals + tasks written in one transaction (design.md Decision 5). */
export interface CarePlanCreateInput {
  caseId: string;
  clientId: string;
  name: string;
  description?: string;
  status?: CarePlanStatus;
  startDate?: string;
  endDate?: string;
  templateId?: string;
  goals: CarePlanWizardGoalInput[];
}

export type CarePlanUpdateInput = Partial<
  Pick<CarePlanCreateInput, 'name' | 'description' | 'status' | 'startDate' | 'endDate'>
>;

export interface GoalAssignmentCreateInput extends CarePlanWizardGoalInput {
  carePlanId: string;
}

export type GoalAssignmentUpdateInput = Partial<
  Pick<GoalAssignment, 'name' | 'description' | 'priority' | 'status' | 'serviceDomain'>
>;

/** `GET /api/cases/:id/service-gaps` — a goal's service domain with no in-house benefit covering it. */
export interface ServiceGap {
  serviceDomain: string;
  goalAssignmentId: string;
  goalName: string;
}
