import type {
  ProgramEnrollment,
  ProgramEnrollmentInput,
  ProgramEnrollmentSummary,
  ProgramEnrollmentUpdateInput,
} from '@housing360/types';
import {
  countEnrollmentsForClient,
  createEnrollment as createEnrollmentRow,
  findClientNameById,
  findEnrollmentById,
  findEnrollmentsByClient,
  findEnrollmentSummaryById,
  findProgramById,
  updateEnrollment as updateEnrollmentRow,
  type EnrollmentRow,
  type EnrollmentUpdateData,
} from '../models/enrollment.model';
import { AppError } from '../utils/AppError';

function toEnrollment(row: EnrollmentRow): ProgramEnrollment {
  return {
    id: row.id,
    clientId: row.clientId,
    householdId: row.householdId,
    programId: row.programId,
    programName: row.program.name,
    name: row.name,
    startDate: row.startDate.toISOString(),
    status: row.status,
    relationshipToHoh: row.relationshipToHoh,
    disablingCondition: row.disablingCondition,
    enrollmentCoc: row.enrollmentCoc,
    programCaseManagerId: row.programCaseManagerId,
    isPrimary: row.isPrimary,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listEnrollmentsForClient(clientId: string): Promise<ProgramEnrollment[]> {
  const rows = await findEnrollmentsByClient(clientId);
  return rows.map(toEnrollment);
}

export async function createEnrollment(input: ProgramEnrollmentInput): Promise<ProgramEnrollment> {
  const program = await findProgramById(input.programId);
  if (!program) {
    throw new AppError(404, 'Program not found');
  }
  const client = await findClientNameById(input.clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  // First enrollment for a client becomes primary automatically, so
  // "primary" is never left unset when there's exactly one — see design.md.
  const existingCount = await countEnrollmentsForClient(input.clientId);
  const isPrimary = input.isPrimary ?? existingCount === 0;

  const name = input.name ?? `${program.name} - ${client.firstName} ${client.lastName}`;
  const startDate = input.startDate ? new Date(input.startDate) : new Date();

  const row = await createEnrollmentRow({
    clientId: input.clientId,
    programId: input.programId,
    name,
    startDate,
    status: input.status ?? 'pending',
    relationshipToHoh: input.relationshipToHoh ?? null,
    disablingCondition: input.disablingCondition ?? null,
    enrollmentCoc: input.enrollmentCoc ?? null,
    programCaseManagerId: input.programCaseManagerId ?? null,
    isPrimary,
  });

  return toEnrollment(row);
}

export async function updateEnrollment(
  id: string,
  input: ProgramEnrollmentUpdateInput
): Promise<ProgramEnrollment> {
  const existing = await findEnrollmentById(id);
  if (!existing) {
    throw new AppError(404, 'Enrollment not found');
  }

  if (input.programId !== undefined && input.programId !== existing.programId) {
    const program = await findProgramById(input.programId);
    if (!program) {
      throw new AppError(404, 'Program not found');
    }
  }

  const data: EnrollmentUpdateData = {};
  if (input.name !== undefined) {
    data.name = input.name;
  }
  if (input.startDate !== undefined) {
    data.startDate = new Date(input.startDate);
  }
  if (input.status !== undefined) {
    data.status = input.status;
  }
  if (input.relationshipToHoh !== undefined) {
    data.relationshipToHoh = input.relationshipToHoh;
  }
  if (input.disablingCondition !== undefined) {
    data.disablingCondition = input.disablingCondition;
  }
  if (input.enrollmentCoc !== undefined) {
    data.enrollmentCoc = input.enrollmentCoc;
  }
  if (input.programCaseManagerId !== undefined) {
    data.programCaseManagerId = input.programCaseManagerId;
  }
  if (input.isPrimary !== undefined) {
    data.isPrimary = input.isPrimary;
  }

  const row = await updateEnrollmentRow(id, data);
  return toEnrollment(row);
}

/**
 * `GET /api/enrollments/:id/summary` — the small client-name/program-name/
 * status/dates block the Launch Assessment flow and Assessment form modal
 * render for context (`assessment-and-ce-workspace`). Reads the client
 * relation directly via Prisma (`enrollment.model.ts`'s
 * `findEnrollmentSummaryById`) rather than through `client.model.ts`/
 * `client.mapper.ts` — same reasoning as `findClientNameById` above, those
 * files are being rewritten concurrently by another agent for this change.
 */
export async function getEnrollmentSummary(id: string): Promise<ProgramEnrollmentSummary> {
  const row = await findEnrollmentSummaryById(id);
  if (!row) {
    throw new AppError(404, 'Program enrollment not found');
  }
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    programId: row.programId,
    programName: row.program.name,
    status: row.status,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
  };
}
