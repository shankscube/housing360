import type { Program } from '@housing360/types';
import { findPrograms, type ProgramRow } from '../models/program.model';

function toProgram(row: ProgramRow): Program {
  return { id: row.id, name: row.name, isActive: row.isActive };
}

export async function listPrograms(activeOnly: boolean): Promise<Program[]> {
  const rows = await findPrograms(activeOnly);
  return rows.map(toProgram);
}
