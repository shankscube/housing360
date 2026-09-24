import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const TEMPLATE_INCLUDE = {
  goals: { include: { tasks: true } },
} satisfies Prisma.CarePlanTemplateInclude;

export type CarePlanTemplateRow = Prisma.CarePlanTemplateGetPayload<{ include: typeof TEMPLATE_INCLUDE }>;
export type CarePlanTemplateListRow = Prisma.CarePlanTemplateGetPayload<Record<string, never>>;

export function findCarePlanTemplateList(
  published?: boolean,
  search?: string
): Promise<CarePlanTemplateListRow[]> {
  return prisma.carePlanTemplate.findMany({
    where: {
      ...(published !== undefined ? { isPublished: published } : {}),
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export function findCarePlanTemplateById(id: string): Promise<CarePlanTemplateRow | null> {
  return prisma.carePlanTemplate.findUnique({ where: { id }, include: TEMPLATE_INCLUDE });
}

export function findGoalDefinitions() {
  return prisma.goalDefinition.findMany({ orderBy: { name: 'asc' } });
}

const CARE_PLAN_INCLUDE = {
  goals: {
    include: { tasks: { include: { owner: { select: { id: true, firstName: true, lastName: true } } } } },
  },
} satisfies Prisma.CarePlanInclude;

export type CarePlanRow = Prisma.CarePlanGetPayload<{ include: typeof CARE_PLAN_INCLUDE }>;
/** The shape of one goal as it comes back nested under a `CarePlan` query — no `carePlan` back-reference, unlike a standalone `GoalAssignmentRow` fetch. */
export type CarePlanGoalRow = CarePlanRow['goals'][number];

export function countCarePlansByCase(caseId: string): Promise<number> {
  return prisma.carePlan.count({ where: { caseId } });
}

export function findCarePlansByCase(caseId: string): Promise<CarePlanRow[]> {
  return prisma.carePlan.findMany({
    where: { caseId },
    include: CARE_PLAN_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export function findCarePlanById(id: string): Promise<CarePlanRow | null> {
  return prisma.carePlan.findUnique({ where: { id }, include: CARE_PLAN_INCLUDE });
}

export interface GoalTaskCreateData {
  subject: string;
  dueDate?: Date | null;
}

export interface GoalCreateData {
  goalDefinitionId?: string | null;
  name: string;
  description?: string | null;
  priority?: string | null;
  serviceDomain?: string | null;
  tasks: GoalTaskCreateData[];
}

export interface CarePlanCreateData {
  caseId: string;
  clientId: string;
  name: string;
  description?: string | null;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  templateId?: string | null;
  goals: GoalCreateData[];
}

/**
 * Plan + all goals + all their tasks in one transaction — see design.md
 * Decision 5. Task rows also carry `clientId`/`caseId` (not just
 * `goalAssignmentId`) so `GET /api/cases/:id/tasks` sees goal tasks
 * alongside plain case tasks without a second query.
 */
export function createCarePlanWithGoals(data: CarePlanCreateData): Promise<CarePlanRow> {
  return prisma.carePlan.create({
    data: {
      caseId: data.caseId,
      clientId: data.clientId,
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? 'Proposed',
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      templateId: data.templateId ?? null,
      goals: {
        create: data.goals.map((goal) => ({
          goalDefinitionId: goal.goalDefinitionId ?? null,
          name: goal.name,
          description: goal.description ?? null,
          priority: goal.priority ?? null,
          serviceDomain: goal.serviceDomain ?? null,
          tasks: {
            create: goal.tasks.map((task) => ({
              subject: task.subject,
              dueDate: task.dueDate ?? null,
              clientId: data.clientId,
              caseId: data.caseId,
              subtype: 'goal',
            })),
          },
        })),
      },
    },
    include: CARE_PLAN_INCLUDE,
  });
}

export function updateCarePlan(
  id: string,
  data: Prisma.CarePlanUncheckedUpdateInput
): Promise<CarePlanRow> {
  return prisma.carePlan.update({ where: { id }, data, include: CARE_PLAN_INCLUDE });
}

const GOAL_INCLUDE = {
  tasks: { include: { owner: { select: { id: true, firstName: true, lastName: true } } } },
  carePlan: { select: { clientId: true, caseId: true } },
} satisfies Prisma.GoalAssignmentInclude;
export type GoalAssignmentRow = Prisma.GoalAssignmentGetPayload<{ include: typeof GOAL_INCLUDE }>;

export function findGoalAssignmentById(id: string): Promise<GoalAssignmentRow | null> {
  return prisma.goalAssignment.findUnique({ where: { id }, include: GOAL_INCLUDE });
}

/** Appends one goal (with its tasks) to an existing plan — used by "add a goal" outside the initial create transaction. */
export async function addGoalToCarePlan(carePlanId: string, goal: GoalCreateData): Promise<GoalAssignmentRow> {
  const carePlan = await prisma.carePlan.findUniqueOrThrow({ where: { id: carePlanId } });
  return prisma.goalAssignment.create({
    data: {
      carePlanId,
      goalDefinitionId: goal.goalDefinitionId ?? null,
      name: goal.name,
      description: goal.description ?? null,
      priority: goal.priority ?? null,
      serviceDomain: goal.serviceDomain ?? null,
      tasks: {
        create: goal.tasks.map((task) => ({
          subject: task.subject,
          dueDate: task.dueDate ?? null,
          clientId: carePlan.clientId,
          caseId: carePlan.caseId,
          subtype: 'goal',
        })),
      },
    },
    include: GOAL_INCLUDE,
  });
}

export function updateGoalAssignment(
  id: string,
  data: Prisma.GoalAssignmentUncheckedUpdateInput
): Promise<GoalAssignmentRow> {
  return prisma.goalAssignment.update({ where: { id }, data, include: GOAL_INCLUDE });
}

/** Distinct service domains across a case's active (not Completed/Cancelled) goal assignments. */
export async function findActiveGoalServiceDomainsByCase(
  caseId: string
): Promise<{ goalAssignmentId: string; goalName: string; serviceDomain: string }[]> {
  const goals = await prisma.goalAssignment.findMany({
    where: {
      carePlan: { caseId },
      serviceDomain: { not: null },
      status: { notIn: ['Completed', 'Canceled'] },
    },
    select: { id: true, name: true, serviceDomain: true },
  });
  return goals
    .filter((goal): goal is typeof goal & { serviceDomain: string } => goal.serviceDomain !== null)
    .map((goal) => ({ goalAssignmentId: goal.id, goalName: goal.name, serviceDomain: goal.serviceDomain }));
}

/** Service domains covered by a client's in-house benefits, across all their program enrollments. */
export async function findCoveredServiceDomainsByClient(clientId: string): Promise<Set<string>> {
  const benefits = await prisma.benefit.findMany({
    where: { program: { enrollments: { some: { clientId } } }, serviceDomain: { not: null } },
    select: { serviceDomain: true },
  });
  return new Set(benefits.map((b) => b.serviceDomain).filter((d): d is string => d !== null));
}
