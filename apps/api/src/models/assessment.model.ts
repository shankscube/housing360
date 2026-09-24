import { Prisma } from '@prisma/client';
import type { AssessmentFilter, AssessmentTypeFilter } from '@housing360/types';
import { prisma } from './prismaClient';

/** Full row shape for an `Assessment`, including every Living-Situation /
 * Income-Benefits-Insurance / Health-DV field — there is no list-safe subset
 * for assessments (unlike `Client`), since nothing here is PII in the same
 * sense SSN/DOB are. */
export type AssessmentRow = Prisma.AssessmentGetPayload<Record<string, never>>;

/** Client/program-enrollment names, joined once and reused by both the global
 * Assessment Command Center list and the per-enrollment Assessments tab list
 * — see `case.model.ts`'s `LIST_INCLUDE` for the identical pattern. */
const LIST_INCLUDE = {
  client: { select: { firstName: true, lastName: true } },
  programEnrollment: { select: { name: true } },
} satisfies Prisma.AssessmentInclude;

export type AssessmentListRow = Prisma.AssessmentGetPayload<{ include: typeof LIST_INCLUDE }>;

const ENTRY_STAGE = 1;

/** Maps the `stage` query param (`GET /enrollments/:id/assessments?stage=entry`)
 * to the numeric `dataCollectionStage` column. Entry (`1`) is the only stage
 * this phase ever writes/reads — see design.md's Non-Goals. */
export function stageParamToDataCollectionStage(stage: string | undefined): number {
  if (stage === 'entry' || stage === undefined) {
    return ENTRY_STAGE;
  }
  // Unknown stage values fall back to Entry rather than erroring — this
  // phase only ever deals with stage 1, so there's nothing else to map to.
  return ENTRY_STAGE;
}

/** `cycleNumber` defaults to `1` — the only value the intake wizard's Entry
 * Assessment (and every pre-existing call site) ever uses. Annual/exit
 * assessments pass an explicit cycle to address a later recurrence. */
export function findAssessmentByEnrollmentAndStage(
  programEnrollmentId: string,
  dataCollectionStage: number,
  cycleNumber = 1
): Promise<AssessmentRow | null> {
  return prisma.assessment.findUnique({
    where: {
      programEnrollmentId_dataCollectionStage_cycleNumber: {
        programEnrollmentId,
        dataCollectionStage,
        cycleNumber,
      },
    },
  });
}

export function findAssessmentById(id: string): Promise<AssessmentRow | null> {
  return prisma.assessment.findUnique({ where: { id } });
}

/** `case-workspace`'s Assessments tab list — every stage recorded for an enrollment, not just Entry. */
export function findAssessmentsByEnrollment(programEnrollmentId: string): Promise<AssessmentListRow[]> {
  return prisma.assessment.findMany({
    where: { programEnrollmentId },
    include: LIST_INCLUDE,
    orderBy: { dataCollectionStage: 'asc' },
  });
}

export function deleteAssessment(id: string): Promise<AssessmentRow> {
  return prisma.assessment.delete({ where: { id } });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const COMPLETED_STATUS = 'completed';
const IN_PROGRESS_STATUS = 'in_progress';

function dueTodayWhere(): Prisma.AssessmentWhereInput {
  const todayStart = startOfDay(new Date());
  const todayEnd = addDays(todayStart, 1);
  return {
    status: { not: COMPLETED_STATUS },
    dueDate: { gte: todayStart, lt: todayEnd },
  };
}

function overdueWhere(): Prisma.AssessmentWhereInput {
  const todayStart = startOfDay(new Date());
  return {
    status: { not: COMPLETED_STATUS },
    dueDate: { lt: todayStart },
  };
}

/** Single-select filter, same "combines with search, never with another
 * filter value" contract as `case.model.ts`'s `filterWhere`. */
function statusFilterWhere(filter: AssessmentFilter): Prisma.AssessmentWhereInput {
  switch (filter) {
    case 'overdue':
      return overdueWhere();
    case 'dueToday':
      return dueTodayWhere();
    case 'inProgress':
      return { status: IN_PROGRESS_STATUS };
    case 'completed':
      return { status: COMPLETED_STATUS };
    case 'all':
    default:
      return {};
  }
}

function typeFilterWhere(typeFilter: AssessmentTypeFilter | undefined): Prisma.AssessmentWhereInput {
  if (!typeFilter || typeFilter === 'all') {
    return {};
  }
  return { type: typeFilter };
}

interface FindAssessmentsParams {
  page: number;
  pageSize: number;
  filter: AssessmentFilter;
  typeFilter?: AssessmentTypeFilter;
  search?: string;
}

/** Global, cross-case list backing the Assessment Command Center — status and
 * type filters AND together (design.md's "Status and Type Filters Combine"
 * spec requirement), distinct from `findAssessmentsByEnrollment`'s
 * single-enrollment scope. */
export async function findAssessments({
  page,
  pageSize,
  filter,
  typeFilter,
  search,
}: FindAssessmentsParams): Promise<{ rows: AssessmentListRow[]; total: number }> {
  const where: Prisma.AssessmentWhereInput = {
    AND: [
      statusFilterWhere(filter),
      typeFilterWhere(typeFilter),
      search
        ? {
            client: {
              is: { OR: [{ firstName: { contains: search } }, { lastName: { contains: search } }] },
            },
          }
        : {},
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.assessment.findMany({
      where,
      include: LIST_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { dueDate: 'asc' },
    }),
    prisma.assessment.count({ where }),
  ]);

  return { rows, total };
}

export interface AssessmentKpiCountRows {
  dueToday: number;
  inProgress: number;
  completed: number;
  total: number;
}

export async function countAssessmentKpis(): Promise<AssessmentKpiCountRows> {
  const [dueToday, inProgress, completed, total] = await Promise.all([
    prisma.assessment.count({ where: dueTodayWhere() }),
    prisma.assessment.count({ where: { status: IN_PROGRESS_STATUS } }),
    prisma.assessment.count({ where: { status: COMPLETED_STATUS } }),
    prisma.assessment.count(),
  ]);
  return { dueToday, inProgress, completed, total };
}

export function findAssessmentDetailById(id: string): Promise<AssessmentListRow | null> {
  return prisma.assessment.findUnique({ where: { id }, include: LIST_INCLUDE });
}

/** Upsert keyed on the compound unique `(programEnrollmentId, dataCollectionStage, cycleNumber)` —
 * required so re-saving the same enrollment's Entry Assessment (steps 4-6
 * resubmitted) never creates a second row. See design.md's "Exactly one Entry
 * Assessment per enrollment" decision. `cycleNumber` defaults to `1`, matching
 * every existing call site (entry assessments never set it) — the
 * `assessments-and-coordinated-entry` change adds this column solely so an
 * annual/exit assessment can recur under a new cycle without colliding with
 * an earlier one on the same enrollment+stage. */
export function upsertAssessment(
  programEnrollmentId: string,
  dataCollectionStage: number,
  createData: Prisma.AssessmentUncheckedCreateInput,
  updateData: Prisma.AssessmentUncheckedUpdateInput,
  cycleNumber = 1
): Promise<AssessmentRow> {
  return prisma.assessment.upsert({
    where: {
      programEnrollmentId_dataCollectionStage_cycleNumber: {
        programEnrollmentId,
        dataCollectionStage,
        cycleNumber,
      },
    },
    create: createData,
    update: updateData,
  });
}

export function updateAssessment(
  id: string,
  data: Prisma.AssessmentUncheckedUpdateInput
): Promise<AssessmentRow> {
  return prisma.assessment.update({ where: { id }, data });
}
