import { Prisma } from '@prisma/client';
import { prisma } from './prismaClient';

const OWNER_INCLUDE = {
  owner: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.TaskInclude;

export type TaskRow = Prisma.TaskGetPayload<{ include: typeof OWNER_INCLUDE }>;

export function findTasksByCase(caseId: string): Promise<TaskRow[]> {
  return prisma.task.findMany({
    where: { caseId },
    include: OWNER_INCLUDE,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export function findTasksByInteractionSummary(interactionSummaryId: string): Promise<TaskRow[]> {
  return prisma.task.findMany({
    where: { interactionSummaryId },
    include: OWNER_INCLUDE,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export function findTasksByGoalAssignment(goalAssignmentId: string): Promise<TaskRow[]> {
  return prisma.task.findMany({
    where: { goalAssignmentId },
    include: OWNER_INCLUDE,
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export function findTaskById(id: string): Promise<TaskRow | null> {
  return prisma.task.findUnique({ where: { id }, include: OWNER_INCLUDE });
}

export interface TaskCreateData {
  subject: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  subtype?: string | null;
  dueDate?: Date | null;
  ownerId?: number | null;
  clientId: string;
  caseId?: string | null;
  goalAssignmentId?: string | null;
  interactionSummaryId?: string | null;
}

export function createTask(data: TaskCreateData): Promise<TaskRow> {
  return prisma.task.create({ data, include: OWNER_INCLUDE });
}

export interface TaskUpdateData {
  subject?: string;
  description?: string | null;
  status?: string;
  priority?: string | null;
  dueDate?: Date | null;
  ownerId?: number | null;
}

export function updateTask(id: string, data: TaskUpdateData): Promise<TaskRow> {
  return prisma.task.update({ where: { id }, data, include: OWNER_INCLUDE });
}

export function updateTaskStatus(id: string, status: string): Promise<TaskRow> {
  return prisma.task.update({ where: { id }, data: { status }, include: OWNER_INCLUDE });
}

const HOME_TASK_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
} satisfies Prisma.TaskInclude;

export type HomeTaskRow = Prisma.TaskGetPayload<{ include: typeof HOME_TASK_INCLUDE }>;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const TASK_LIST_INCLUDE = {
  owner: { select: { id: true, firstName: true, lastName: true } },
  client: { select: { firstName: true, lastName: true } },
} satisfies Prisma.TaskInclude;

export type TaskListRow = Prisma.TaskGetPayload<{ include: typeof TASK_LIST_INCLUDE }>;

export type TaskListFilter = 'all' | 'due_today' | 'overdue' | 'upcoming';

export interface FindTasksParams {
  filter: TaskListFilter;
  search?: string;
  page: number;
  pageSize: number;
}

/**
 * `due_today`/`overdue` exclude completed tasks (a completed task isn't
 * "due" anymore); `upcoming` deliberately doesn't per the task-management
 * spec — just a future due date, completed or not.
 */
function taskFilterWhere(filter: TaskListFilter): Prisma.TaskWhereInput {
  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  switch (filter) {
    case 'due_today':
      return { status: { not: 'completed' }, dueDate: { gte: todayStart, lt: todayEnd } };
    case 'overdue':
      return { status: { not: 'completed' }, dueDate: { lt: todayStart } };
    case 'upcoming':
      return { dueDate: { gte: todayEnd } };
    case 'all':
    default:
      return {};
  }
}

/**
 * The Tasks page's filtered/searchable list — single-select `filter` ANDed
 * with `search` (never a second filter), matching the same contract as
 * `case.model.ts`'s `findCases`/`client.model.ts`'s `findClients`. `search`
 * matches the task subject or the owner's first/last name.
 */
export async function findTasks({
  filter,
  search,
  page,
  pageSize,
}: FindTasksParams): Promise<{ rows: TaskListRow[]; total: number }> {
  const where: Prisma.TaskWhereInput = {
    AND: [
      taskFilterWhere(filter),
      search
        ? {
            OR: [
              { subject: { contains: search } },
              {
                owner: {
                  is: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] },
                },
              },
            ],
          }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: TASK_LIST_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.count({ where }),
  ]);

  return { rows, total };
}

/**
 * Home dashboard's "Tasks Due Today" KPI — strictly today's due date, not
 * including already-overdue tasks (home-dashboard design.md Decision 2).
 */
export function countTasksDueTodayForOwner(ownerId: number): Promise<number> {
  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  return prisma.task.count({
    where: { ownerId, status: { not: 'completed' }, dueDate: { gte: todayStart, lt: todayEnd } },
  });
}

/**
 * Home dashboard's Today's Tasks panel — due today OR already overdue, not
 * yet completed; the service layer flags which rows are overdue.
 */
export function findTasksDueOrOverdueForOwner(ownerId: number): Promise<HomeTaskRow[]> {
  const todayEnd = addDays(startOfDay(new Date()), 1);
  return prisma.task.findMany({
    where: { ownerId, status: { not: 'completed' }, dueDate: { lt: todayEnd } },
    include: HOME_TASK_INCLUDE,
    orderBy: { dueDate: 'asc' },
  });
}
