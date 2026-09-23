import { Prisma, DisclosureStatus as PrismaDisclosureStatus, Sex as PrismaSex } from '@prisma/client';
import { prisma } from './prismaClient';

/** Full `Household` row shape. */
export type HouseholdRow = Prisma.HouseholdGetPayload<Record<string, never>>;

/** Full `Client` row shape — used only for the members-just-created return value. */
export type ClientRow = Prisma.ClientGetPayload<Record<string, never>>;

export type CreateHouseholdResult =
  | { status: 'ok'; household: HouseholdRow }
  | { status: 'client_not_found' }
  | { status: 'already_in_household' };

/**
 * Creates a `Household` with `headClientId = clientId` and, in the same
 * transaction, sets that client's `householdId`/`relationshipToHoh` — the
 * chicken-and-egg ordering described in design.md (client row already
 * exists; household points back at it; client is then updated to point at
 * the household). Returns a discriminated result rather than throwing, so
 * the service layer (not this model) decides the HTTP status — see the
 * repo's layering convention (`models/` never imports `utils/AppError`).
 */
export async function createHouseholdForClient(clientId: string): Promise<CreateHouseholdResult> {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return { status: 'client_not_found' };
    }
    if (client.householdId) {
      return { status: 'already_in_household' };
    }

    const household = await tx.household.create({ data: { headClientId: clientId } });
    await tx.client.update({
      where: { id: clientId },
      // '1' = HUD 3.15 "Self (head of household)" — see hudOptions.ts.
      data: { householdId: household.id, relationshipToHoh: '1' },
    });

    return { status: 'ok', household };
  });
}

export function findHouseholdById(id: string): Promise<HouseholdRow | null> {
  return prisma.household.findUnique({ where: { id } });
}

/** Prisma-shaped write payload for one bulk-created family member. */
export interface HouseholdMemberCreateData {
  firstName: string;
  lastName: string;
  sex: PrismaSex;
  raceEthnicity: string[];
  dob: string | null;
  dobDisclosure: PrismaDisclosureStatus;
  ssnEncrypted: string | null;
  ssnHash: string | null;
  ssnLast4: string | null;
  ssnDisclosure: PrismaDisclosureStatus;
  mobile: string | null;
  email: string | null;
  relationshipToHoh: string;
  householdId: string;
}

/**
 * Bulk-creates family members in one transaction. Uses the array form of
 * `$transaction` (each member is an independent `create`, no interdependent
 * reads) rather than `createMany`, since MySQL's `createMany` doesn't return
 * the created rows and the caller needs them to build the response.
 */
export function createHouseholdMembers(members: HouseholdMemberCreateData[]): Promise<ClientRow[]> {
  return prisma.$transaction(members.map((data) => prisma.client.create({ data })));
}
