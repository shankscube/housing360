import type { Bed, BedAssignment, BedNight, BedNightUpdateInput } from '@housing360/types';
import {
  createBedAssignmentWithFirstNight,
  createBedNight,
  findAvailableBeds,
  findBedAssignmentById,
  findBedNightById,
  findBedNightsByAssignment,
  updateBedNightStatus,
} from '../models/bed.model';
import { toBed, toBedAssignment, toBedNight } from '../models/bed.mapper';
import { AppError } from '../utils/AppError';

export async function listAvailableBeds(programId: string, date: string, shift: string): Promise<Bed[]> {
  const rows = await findAvailableBeds(programId, new Date(date), shift);
  return rows.map(toBed);
}

export async function assignBed(
  programEnrollmentId: string,
  bedId: string,
  shift: string,
  date?: string
): Promise<BedAssignment> {
  const startDate = date ? new Date(date) : new Date();
  const row = await createBedAssignmentWithFirstNight(programEnrollmentId, bedId, shift, startDate);
  return toBedAssignment(row);
}

export async function listBedNights(bedAssignmentId: string): Promise<BedNight[]> {
  const existing = await findBedAssignmentById(bedAssignmentId);
  if (!existing) {
    throw new AppError(404, 'Bed assignment not found');
  }
  const rows = await findBedNightsByAssignment(bedAssignmentId);
  return rows.map(toBedNight);
}

export async function logBedNight(
  bedAssignmentId: string,
  logDate: string,
  shift: string,
  status: string
): Promise<BedNight> {
  const existing = await findBedAssignmentById(bedAssignmentId);
  if (!existing) {
    throw new AppError(404, 'Bed assignment not found');
  }
  const row = await createBedNight(bedAssignmentId, new Date(logDate), shift, status);
  return toBedNight(row);
}

export async function updateBedNight(id: string, input: BedNightUpdateInput): Promise<BedNight> {
  const existing = await findBedNightById(id);
  if (!existing) {
    throw new AppError(404, 'Bed night not found');
  }
  if (!input.status) {
    throw new AppError(400, 'status is required');
  }
  const row = await updateBedNightStatus(id, input.status);
  return toBedNight(row);
}
