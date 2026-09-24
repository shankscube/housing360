import bcrypt from 'bcryptjs';
import { prisma } from '../src/models/prismaClient';
import { logger } from '../src/utils/logger';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const email = required('SEED_USER_EMAIL');
  const password = required('SEED_USER_PASSWORD');
  const firstName = required('SEED_USER_FIRST_NAME');
  const lastName = required('SEED_USER_LAST_NAME');

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, firstName, lastName },
    create: { email, passwordHash, firstName, lastName },
  });

  logger.info({ email: user.email }, 'Seeded case-manager user');

  await seedPrograms();
  await seedGoalDefinitions();
  await seedCarePlanTemplates();
  await seedOrganizations();
  await seedBenefits();
  await seedBeds();
}

const PROGRAMS = [
  'Rapid Re-Housing',
  'Permanent Supportive Housing',
  'Emergency Shelter',
  'Street Outreach',
  'Homelessness Prevention',
];

async function seedPrograms() {
  for (const name of PROGRAMS) {
    await prisma.program.upsert({
      where: { id: name },
      update: { name, isActive: true },
      create: { id: name, name, isActive: true },
    });
  }
  logger.info({ count: PROGRAMS.length }, 'Seeded active programs');
}

/**
 * Service domain vocabulary used across `GoalAssignment.serviceDomain`,
 * `Benefit.serviceDomain` (Group 6), and `OrganizationServiceDomain` — a
 * fixed operational list, not a HUD data element, so it's plain seed data
 * rather than an `hudOptions.ts`-style served reference list.
 */
const SERVICE_DOMAINS = [
  'housing',
  'employment',
  'behavioral_health',
  'healthcare',
  'legal',
  'financial',
  'childcare',
  'transportation',
  'food',
];

const GOAL_DEFINITIONS: { name: string; description: string; serviceDomain: string }[] = [
  { name: 'Secure permanent housing', description: 'Obtain a lease for stable permanent housing.', serviceDomain: 'housing' },
  { name: 'Increase household income', description: 'Enroll in job training or secure employment.', serviceDomain: 'employment' },
  { name: 'Engage in behavioral health services', description: 'Connect with counseling or psychiatric care.', serviceDomain: 'behavioral_health' },
  { name: 'Establish a primary care provider', description: 'Schedule and attend an initial healthcare visit.', serviceDomain: 'healthcare' },
  { name: 'Resolve outstanding legal issues', description: 'Connect with legal aid for pending matters.', serviceDomain: 'legal' },
  { name: 'Build financial stability', description: 'Open a bank account and create a household budget.', serviceDomain: 'financial' },
  { name: 'Secure childcare', description: 'Enroll dependents in a childcare program.', serviceDomain: 'childcare' },
  { name: 'Arrange reliable transportation', description: 'Obtain a transit pass or vehicle access.', serviceDomain: 'transportation' },
  { name: 'Address food insecurity', description: 'Connect with a food assistance program.', serviceDomain: 'food' },
];

function assertKnownServiceDomain(domain: string): void {
  if (!SERVICE_DOMAINS.includes(domain)) {
    throw new Error(`Unknown service domain "${domain}" — add it to SERVICE_DOMAINS first`);
  }
}

async function seedGoalDefinitions() {
  for (const goal of GOAL_DEFINITIONS) {
    assertKnownServiceDomain(goal.serviceDomain);
    await prisma.goalDefinition.upsert({
      where: { id: goal.name },
      update: goal,
      create: { id: goal.name, ...goal },
    });
  }
  logger.info({ count: GOAL_DEFINITIONS.length }, 'Seeded goal definitions');
}

const CARE_PLAN_TEMPLATES: {
  name: string;
  description: string;
  isPublished: boolean;
  goals: { name: string; serviceDomain: string; priority: string; tasks: string[] }[];
}[] = [
  {
    name: 'Rapid Re-Housing Starter Plan',
    description: 'A starting plan for clients newly enrolled in Rapid Re-Housing.',
    isPublished: true,
    goals: [
      {
        name: 'Secure permanent housing',
        serviceDomain: 'housing',
        priority: 'High',
        tasks: ['Complete housing application', 'Tour available units'],
      },
      {
        name: 'Increase household income',
        serviceDomain: 'employment',
        priority: 'Medium',
        tasks: ['Meet with employment specialist'],
      },
    ],
  },
  {
    name: 'Permanent Supportive Housing Stabilization Plan',
    description: 'Stabilization-focused plan for clients in Permanent Supportive Housing.',
    isPublished: true,
    goals: [
      {
        name: 'Engage in behavioral health services',
        serviceDomain: 'behavioral_health',
        priority: 'High',
        tasks: ['Schedule intake appointment'],
      },
      {
        name: 'Build financial stability',
        serviceDomain: 'financial',
        priority: 'Medium',
        tasks: ['Open a bank account'],
      },
    ],
  },
];

async function seedCarePlanTemplates() {
  for (const template of CARE_PLAN_TEMPLATES) {
    const existing = await prisma.carePlanTemplate.findFirst({ where: { name: template.name } });
    if (existing) {
      continue;
    }
    template.goals.forEach((goal) => assertKnownServiceDomain(goal.serviceDomain));
    await prisma.carePlanTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        isPublished: template.isPublished,
        goals: {
          create: template.goals.map((goal) => ({
            name: goal.name,
            serviceDomain: goal.serviceDomain,
            priority: goal.priority,
            tasks: { create: goal.tasks.map((subject) => ({ subject })) },
          })),
        },
      },
    });
  }
  logger.info({ count: CARE_PLAN_TEMPLATES.length }, 'Seeded care plan templates');
}

const ORGANIZATIONS: { name: string; contactEmail: string | null; domains: string[] }[] = [
  { name: 'Regional Legal Aid Society', contactEmail: 'intake@regionallegalaid.example.org', domains: ['legal'] },
  { name: 'Community Behavioral Health Partners', contactEmail: 'referrals@cbhp.example.org', domains: ['behavioral_health'] },
  { name: 'Northside Health Clinic', contactEmail: 'referrals@northsideclinic.example.org', domains: ['healthcare'] },
  // No contact email — exercises the Refer to Partner flow's "can't be reached yet" flag.
  { name: 'Neighborhood Childcare Collective', contactEmail: null, domains: ['childcare'] },
];

async function seedOrganizations() {
  for (const org of ORGANIZATIONS) {
    org.domains.forEach(assertKnownServiceDomain);
    const existing = await prisma.organization.findFirst({ where: { name: org.name } });
    const record = existing
      ? await prisma.organization.update({
          where: { id: existing.id },
          data: { contactEmail: org.contactEmail, isPartner: true },
        })
      : await prisma.organization.create({
          data: { name: org.name, contactEmail: org.contactEmail, isPartner: true },
        });

    for (const serviceDomain of org.domains) {
      await prisma.organizationServiceDomain.upsert({
        where: { organizationId_serviceDomain: { organizationId: record.id, serviceDomain } },
        update: {},
        create: { organizationId: record.id, serviceDomain },
      });
    }
  }
  logger.info({ count: ORGANIZATIONS.length }, 'Seeded partner organizations');
}

const BENEFITS_BY_PROGRAM: Record<string, { name: string; serviceDomain: string }[]> = {
  'Rapid Re-Housing': [
    { name: 'Rental Assistance', serviceDomain: 'housing' },
    { name: 'Move-In Financial Assistance', serviceDomain: 'financial' },
  ],
  'Permanent Supportive Housing': [
    { name: 'Permanent Housing Placement', serviceDomain: 'housing' },
    { name: 'On-Site Case Management', serviceDomain: 'behavioral_health' },
  ],
  'Emergency Shelter': [{ name: 'Shelter Bed', serviceDomain: 'housing' }],
  'Street Outreach': [{ name: 'Outreach Health Screening', serviceDomain: 'healthcare' }],
  'Homelessness Prevention': [{ name: 'Prevention Financial Assistance', serviceDomain: 'financial' }],
};

async function seedBenefits() {
  let count = 0;
  for (const [programId, benefits] of Object.entries(BENEFITS_BY_PROGRAM)) {
    for (const benefit of benefits) {
      assertKnownServiceDomain(benefit.serviceDomain);
      const existing = await prisma.benefit.findFirst({ where: { programId, name: benefit.name } });
      if (existing) continue;
      await prisma.benefit.create({ data: { programId, name: benefit.name, serviceDomain: benefit.serviceDomain } });
      count += 1;
    }
  }
  logger.info({ count }, 'Seeded benefits');
}

const BEDS_PER_PROGRAM = 3;

async function seedBeds() {
  let count = 0;
  for (const programId of PROGRAMS) {
    for (let i = 1; i <= BEDS_PER_PROGRAM; i += 1) {
      const identifier = `${programId}-Bed-${i}`;
      const existing = await prisma.bed.findFirst({ where: { programId, identifier } });
      if (existing) continue;
      await prisma.bed.create({ data: { programId, identifier, isActive: true } });
      count += 1;
    }
  }
  logger.info({ count }, 'Seeded beds');
}

main()
  .catch((err) => {
    logger.error({ err }, 'Seeding failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
