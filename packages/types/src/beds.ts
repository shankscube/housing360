export type BedShift = 'Day' | 'Overnight';
export type BedNightStatus = 'Present' | 'Absent';

export interface Bed {
  id: string;
  programId: string;
  identifier: string;
  isActive: boolean;
}

export interface BedAssignment {
  id: string;
  programEnrollmentId: string;
  bedId: string;
  bedIdentifier: string;
  shift: BedShift;
  startDate: string;
  endDate: string | null;
}

export interface BedNight {
  id: string;
  bedAssignmentId: string;
  logDate: string;
  shift: BedShift;
  status: BedNightStatus;
}

export interface BedAssignmentInput {
  programEnrollmentId: string;
  bedId: string;
  shift: BedShift;
  date?: string;
}

export interface BedNightInput {
  bedAssignmentId: string;
  logDate: string;
  shift: BedShift;
  status: BedNightStatus;
}

export type BedNightUpdateInput = Partial<Pick<BedNightInput, 'status'>>;
