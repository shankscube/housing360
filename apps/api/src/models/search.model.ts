import { prisma } from './prismaClient';

/**
 * One capped (`take: 5`) query per entity group, run independently — the
 * service layer runs all five in parallel via `Promise.all`. Each query
 * matches only name/title fields, per global-search's spec requirement that
 * a Client result never be reachable via SSN digits.
 */

export function searchClients(query: string) {
  return prisma.client.findMany({
    where: {
      OR: [{ firstName: { contains: query } }, { lastName: { contains: query } }],
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: { id: true, firstName: true, lastName: true, dob: true },
  });
}

export function searchCases(query: string) {
  return prisma.case.findMany({
    where: {
      OR: [
        { caseNumber: { contains: query } },
        { subject: { contains: query } },
        { client: { is: { OR: [{ firstName: { contains: query } }, { lastName: { contains: query } }] } } },
      ],
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      caseNumber: true,
      subject: true,
      client: { select: { firstName: true, lastName: true } },
    },
  });
}

export function searchReferrals(query: string) {
  return prisma.referral.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { client: { is: { OR: [{ firstName: { contains: query } }, { lastName: { contains: query } }] } } },
      ],
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      client: { select: { firstName: true, lastName: true } },
    },
  });
}

export function searchTasks(query: string) {
  return prisma.task.findMany({
    where: { subject: { contains: query } },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      subject: true,
      client: { select: { firstName: true, lastName: true } },
    },
  });
}

export function searchAssessments(query: string) {
  return prisma.assessment.findMany({
    where: {
      client: { is: { OR: [{ firstName: { contains: query } }, { lastName: { contains: query } }] } },
    },
    take: 5,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      type: true,
      client: { select: { firstName: true, lastName: true } },
    },
  });
}
