import type { Disability, DisabilityInput } from '@housing360/types';
import {
  createDisability as createDisabilityRow,
  deleteDisability as deleteDisabilityRow,
  findDisabilityById,
  replaceDisabilitiesForAssessment,
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

/** `PUT /assessments/:id/disabilities` — replaces the full set in one call
 * (`assessment-and-ce-workspace`); `assessmentId` comes from the URL param on
 * every row, same convention as `addDisabilityToAssessment`. */
export async function replaceDisabilities(
  assessmentId: string,
  disabilities: Omit<DisabilityInput, 'assessmentId'>[]
): Promise<Disability[]> {
  const rows = await replaceDisabilitiesForAssessment(assessmentId, disabilities);
  return rows.map(toDisability);
}
