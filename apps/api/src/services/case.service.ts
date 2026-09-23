import type { Case, EnsureCaseInput } from '@housing360/types';
import { ensureCase as ensureCaseRow, type CaseRow } from '../models/case.model';

function toCase(row: CaseRow): Case {
  return {
    id: row.id,
    clientId: row.clientId,
    programEnrollmentId: row.programEnrollmentId,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureCase(input: EnsureCaseInput): Promise<Case> {
  // Type field is `enrollmentId`; the Prisma column is `programEnrollmentId`.
  const row = await ensureCaseRow(input.clientId, input.enrollmentId);
  return toCase(row);
}
