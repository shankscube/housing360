import type { Disability } from '@housing360/types';
import type { DisabilityRow } from './disability.model';

export function toDisability(row: DisabilityRow): Disability {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    disabilityType: row.disabilityType,
    response: row.response,
    indefiniteAndImpairs: row.indefiniteAndImpairs,
    antiRetroviral: row.antiRetroviral,
    tCellAvailable: row.tCellAvailable,
    tCellCount: row.tCellCount,
    tCellSource: row.tCellSource,
    viralLoadAvailable: row.viralLoadAvailable,
    viralLoad: row.viralLoad,
    viralLoadSource: row.viralLoadSource,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
