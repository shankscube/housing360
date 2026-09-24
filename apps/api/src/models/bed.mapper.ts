import type { Bed, BedAssignment, BedNight, BedShift } from '@housing360/types';
import type { BedAssignmentRow, BedNightRow, BedRow } from './bed.model';

export function toBed(row: BedRow): Bed {
  return { id: row.id, programId: row.programId, identifier: row.identifier, isActive: row.isActive };
}

export function toBedAssignment(row: BedAssignmentRow): BedAssignment {
  return {
    id: row.id,
    programEnrollmentId: row.programEnrollmentId,
    bedId: row.bedId,
    bedIdentifier: row.bed.identifier,
    shift: row.shift as BedShift,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate ? row.endDate.toISOString() : null,
  };
}

export function toBedNight(row: BedNightRow): BedNight {
  return {
    id: row.id,
    bedAssignmentId: row.bedAssignmentId,
    logDate: row.logDate.toISOString(),
    shift: row.shift as BedShift,
    status: row.status as BedNight['status'],
  };
}
