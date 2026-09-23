import type { Disability, DisabilityInput } from '@housing360/types';
import {
  createDisability as createDisabilityRow,
  deleteDisability as deleteDisabilityRow,
  findDisabilityById,
} from '../models/disability.model';
import { toDisability } from '../models/disability.mapper';
import { AppError } from '../utils/AppError';

/** `POST /assessments/:id/disabilities` — `assessmentId` comes from the URL param,
 * not the body (`DisabilityInput` minus `assessmentId`). */
export async function addDisabilityToAssessment(
  assessmentId: string,
  input: Omit<DisabilityInput, 'assessmentId'>
): Promise<Disability> {
  const row = await createDisabilityRow({ ...input, assessmentId });
  return toDisability(row);
}

export async function removeDisability(id: string): Promise<void> {
  const existing = await findDisabilityById(id);
  if (!existing) {
    throw new AppError(404, 'Disability not found');
  }
  await deleteDisabilityRow(id);
}
