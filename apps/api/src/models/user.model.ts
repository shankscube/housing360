import { prisma } from './prismaClient';

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Backs every "Case Manager" / "Assigned To" picker `case-workspace` adds
 * (New Case, Edit Case, Overview's Tasks card, interaction summary's
 * optional task block). Only the single seeded demo user exists today, but
 * the picker is written against a real list endpoint rather than hardcoding
 * that one user, so it needs no change once more users are seeded.
 */
export function findAllUsers() {
  return prisma.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });
}
