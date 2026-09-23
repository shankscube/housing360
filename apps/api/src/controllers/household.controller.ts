import { NextFunction, Request, Response } from 'express';
import type { AddHouseholdMembersInput, CreateHouseholdInput, FamilyMemberInput } from '@housing360/types';
import { addHouseholdMembers, createHousehold } from '../services/household.service';
import { sendSuccess } from '../utils/responder';
import { AppError } from '../utils/AppError';

export async function createHouseholdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as Partial<CreateHouseholdInput> | undefined;
    if (!input?.clientId) {
      throw new AppError(400, 'clientId is required');
    }

    const household = await createHousehold(input.clientId);
    sendSuccess(res, { code: 201, message: 'Household created', data: household });
  } catch (err) {
    next(err);
  }
}

function isValidMember(member: unknown): member is FamilyMemberInput {
  const m = member as Partial<FamilyMemberInput> | null;
  return Boolean(m && m.firstName && m.lastName && m.ssn && m.dob && m.sex && m.relationshipToHoh);
}

export async function addHouseholdMembersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError(400, 'Household id is required');
    }

    const input = req.body as Partial<AddHouseholdMembersInput> | undefined;
    if (!input?.members || !Array.isArray(input.members) || input.members.length === 0) {
      throw new AppError(400, 'members is required and must be a non-empty array');
    }
    if (!input.members.every(isValidMember)) {
      throw new AppError(
        400,
        'Each family member requires firstName, lastName, sex, ssn, dob, and relationshipToHoh'
      );
    }

    const members = await addHouseholdMembers(id, { members: input.members });
    sendSuccess(res, { code: 201, message: 'Household members created', data: { members } });
  } catch (err) {
    next(err);
  }
}
