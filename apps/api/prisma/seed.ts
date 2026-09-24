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
  // Optional — assessment-and-ce-workspace design.md Decision 8's minimal
  // permission gate. Defaults to 'case_manager' (matching `User.role`'s own
  // Prisma default) so existing demo behavior is unchanged unless a run
  // explicitly sets SEED_USER_ROLE=admin to exercise `ce:manage-rules`.
  const role = process.env.SEED_USER_ROLE ?? 'case_manager';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, firstName, lastName, role },
    create: { email, passwordHash, firstName, lastName, role },
  });

  logger.info({ email: user.email, role: user.role }, 'Seeded case-manager user');

  await seedPrograms();
  await seedGoalDefinitions();
  await seedCarePlanTemplates();
  await seedOrganizations();
  await seedBenefits();
  await seedBeds();
  await seedProgramProjectTypesAndOperatingOrganizations();
  await seedScoringRules();
  await seedCarePlanTemplateRules();
  await seedCeQuestions();
  await seedCeScoreBands();
  await seedCeFlagOverrides();
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

// ---------------------------------------------------------------------------
// assessment-and-ce-workspace seed data (Section 2 of that change's tasks.md)
// ---------------------------------------------------------------------------

/**
 * Backfills `Program.projectTypeCode`/`operatingOrganizationId`
 * (assessment-and-ce-workspace design.md Decision 7) — placeholder HUD
 * project-type codes, one per seeded program. Pending confirmation of the
 * real HUD project-type taxonomy against the source org (see that change's
 * Open Questions). `operatingOrganizationId` is paired against whichever
 * `Organization` rows exist (`seedOrganizations`'s partner-referral orgs —
 * none of which are actually housing-program operators; there's no
 * better-fitting seeded org today), cycling through them if there are more
 * programs than organizations.
 */
const PROGRAM_PROJECT_TYPES: Record<string, string> = {
  'Rapid Re-Housing': 'RRH',
  'Permanent Supportive Housing': 'PSH',
  'Emergency Shelter': 'ES',
  'Street Outreach': 'SH',
  'Homelessness Prevention': 'TH',
};

async function seedProgramProjectTypesAndOperatingOrganizations() {
  const organizations = await prisma.organization.findMany({ orderBy: { createdAt: 'asc' } });
  if (organizations.length === 0) {
    logger.info('No organizations found — leaving Program.operatingOrganizationId null');
  }

  let count = 0;
  for (let i = 0; i < PROGRAMS.length; i += 1) {
    const programId = PROGRAMS[i];
    const projectTypeCode = PROGRAM_PROJECT_TYPES[programId] ?? null;
    const operatingOrganizationId = organizations.length > 0 ? organizations[i % organizations.length].id : null;

    await prisma.program.update({
      where: { id: programId },
      data: { projectTypeCode, operatingOrganizationId },
    });
    count += 1;
  }
  logger.info({ count }, 'Backfilled Program projectTypeCode/operatingOrganizationId');
}

/**
 * PROVISIONAL scoring rule set for `HousingStabilityScoringService`
 * (assessment-and-ce-workspace design.md Decision 4) — mirrors the factors
 * from the deleted placeholder `scoring.service.ts`'s fixed-weight
 * `scoreAssessment` tally (chronic homelessness +30, months-homeless scaled
 * from the old capped-at-24-months x1.25 tally, no-income +20, DV survivor
 * +15) so behavior doesn't regress, just becomes data-driven and auditable.
 * Not a clinically validated weight set — see that change's Open Questions.
 *
 * The old tally's disability-count factor (`Math.min(disabilityCount, 3) *
 * 5`) is deliberately NOT seeded here: `ScoringRule.field` matches a single
 * scalar value (exact match or numeric range) on `Assessment` itself, and a
 * disability count is a COUNT OF CHILD `Disability` ROWS, not a scalar field
 * on the assessment — there's no clean way to express that in this schema's
 * field/matchValue/rangeMin/rangeMax shape. Left as an open gap for
 * `HousingStabilityScoringService` to special-case (e.g. a computed
 * pseudo-field the service populates before rule evaluation) rather than
 * force a bad fit here.
 */
const SCORING_RULES: {
  field: string;
  matchValue?: string;
  rangeMin?: number;
  rangeMax?: number;
  contribution: number;
}[] = [
  { field: 'chronicHomelessness', matchValue: '1', contribution: 30 },
  { field: 'monthsHomelessPast3Years', rangeMin: 0, rangeMax: 6, contribution: 5 },
  { field: 'monthsHomelessPast3Years', rangeMin: 7, rangeMax: 12, contribution: 10 },
  { field: 'monthsHomelessPast3Years', rangeMin: 13, rangeMax: 24, contribution: 15 },
  { field: 'incomeFromAnySource', matchValue: '0', contribution: 20 },
  { field: 'domesticViolenceSurvivor', matchValue: '1', contribution: 15 },
];

async function seedScoringRules() {
  let count = 0;
  for (const rule of SCORING_RULES) {
    const matchValue = rule.matchValue ?? null;
    const rangeMin = rule.rangeMin ?? null;
    const rangeMax = rule.rangeMax ?? null;
    const existing = await prisma.scoringRule.findFirst({
      where: { field: rule.field, matchValue, rangeMin, rangeMax },
    });
    if (existing) continue;
    await prisma.scoringRule.create({
      data: { field: rule.field, matchValue, rangeMin, rangeMax, contribution: rule.contribution, isActive: true },
    });
    count += 1;
  }
  logger.info({ count }, 'Seeded scoring rules (provisional)');
}

/**
 * `care_plan_template_rules` (assessment-and-ce-workspace design.md Decision
 * 5) — one row per existing published `CarePlanTemplate`, spread across
 * non-overlapping score bands covering the full 0-100 range with ascending
 * `priority`, so every possible score recommends at least one template.
 * Replaces `getRecommendedCarePlanTemplates`'s old "every published
 * template, no real signal" placeholder.
 */
async function seedCarePlanTemplateRules() {
  const templates = await prisma.carePlanTemplate.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
  });
  if (templates.length === 0) {
    logger.info('No published care plan templates found — skipping care plan template rules');
    return;
  }

  const bandSize = Math.ceil(100 / templates.length);
  let count = 0;
  for (let i = 0; i < templates.length; i += 1) {
    const template = templates[i];
    const existing = await prisma.carePlanTemplateRule.findFirst({ where: { templateId: template.id } });
    if (existing) continue;

    const scoreBandMin = i * bandSize;
    const scoreBandMax = i === templates.length - 1 ? 100 : (i + 1) * bandSize - 1;

    await prisma.carePlanTemplateRule.create({
      data: { templateId: template.id, scoreBandMin, scoreBandMax, priority: i + 1 },
    });
    count += 1;
  }
  logger.info({ count, templates: templates.length }, 'Seeded care plan template rules');
}

/**
 * Demo Coordinated Entry question bank (assessment-and-ce-workspace
 * design.md Decision 6) — 5 active questions, each with ascending-score
 * answer options (0/1/2/3). Placeholder content, not the real
 * VI-SPDAT-equivalent instrument — see that change's Open Questions. Max
 * possible total score is 5 questions x 3 = 15 (see `CE_SCORE_BANDS` below,
 * which covers exactly that range).
 */
const CE_QUESTIONS: {
  text: string;
  sequence: number;
  options: { text: string; score: number }[];
}[] = [
  {
    text: 'How long have you been experiencing homelessness?',
    sequence: 1,
    options: [
      { text: 'Less than 1 month', score: 0 },
      { text: '1 to 6 months', score: 1 },
      { text: '6 months to 1 year', score: 2 },
      { text: 'More than 1 year', score: 3 },
    ],
  },
  {
    text: 'Do you have a chronic health condition?',
    sequence: 2,
    options: [
      { text: 'No chronic condition', score: 0 },
      { text: 'Mild, well-managed condition', score: 1 },
      { text: 'Moderate condition requiring ongoing care', score: 2 },
      { text: 'Severe or multiple chronic conditions', score: 3 },
    ],
  },
  {
    text: 'Have you had contact with emergency services (police, ambulance, or ER) in the past 6 months?',
    sequence: 3,
    options: [
      { text: 'No contact', score: 0 },
      { text: 'One contact', score: 1 },
      { text: 'Two to three contacts', score: 2 },
      { text: 'Four or more contacts', score: 3 },
    ],
  },
  {
    text: 'Do you have a support network you can safely stay with?',
    sequence: 4,
    options: [
      { text: 'Yes, a stable support network', score: 0 },
      { text: 'Limited support, short-term only', score: 1 },
      { text: 'Minimal support available', score: 2 },
      { text: 'No support network', score: 3 },
    ],
  },
  {
    text: 'Are you currently able to meet your basic needs (food, hygiene, safety)?',
    sequence: 5,
    options: [
      { text: 'Yes, consistently', score: 0 },
      { text: 'Mostly, with occasional gaps', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'No, unable to meet basic needs', score: 3 },
    ],
  },
];

async function seedCeQuestions() {
  let questionCount = 0;
  let optionCount = 0;
  for (const question of CE_QUESTIONS) {
    let record = await prisma.ceQuestion.findFirst({ where: { text: question.text } });
    if (!record) {
      record = await prisma.ceQuestion.create({
        data: { text: question.text, sequence: question.sequence, isActive: true },
      });
      questionCount += 1;
    }

    for (const option of question.options) {
      const existingOption = await prisma.ceAnswerOption.findFirst({
        where: { questionId: record.id, text: option.text },
      });
      if (existingOption) continue;
      await prisma.ceAnswerOption.create({
        data: { questionId: record.id, text: option.text, score: option.score },
      });
      optionCount += 1;
    }
  }
  logger.info({ questionCount, optionCount }, 'Seeded coordinated entry questions (demo configuration)');
}

/**
 * `ce_score_bands` (demo configuration, assessment-and-ce-workspace
 * design.md Decision 6) — 3 inclusive [minScore, maxScore] bands covering
 * the full 0-15 possible total from `CE_QUESTIONS` above.
 * `recommendedProjectTypeCodes` is loosely coordinated with the
 * `PROGRAM_PROJECT_TYPES` backfill above so every tier matches at least one
 * seeded `Program`.
 */
const CE_SCORE_BANDS: {
  name: string;
  minScore: number;
  maxScore: number;
  description: string;
  badgeColor: string;
  recommendedProjectTypeCodes: string;
}[] = [
  {
    name: 'Low Priority',
    minScore: 0,
    maxScore: 5,
    description: 'Lower acuity — prevention and rapid re-housing programs are typically appropriate.',
    badgeColor: 'teal',
    recommendedProjectTypeCodes: 'RRH,TH',
  },
  {
    name: 'Medium Priority',
    minScore: 6,
    maxScore: 10,
    description: 'Moderate acuity — transitional and permanent supportive housing programs are typically appropriate.',
    badgeColor: 'gold',
    recommendedProjectTypeCodes: 'TH,PSH',
  },
  {
    name: 'High Priority',
    minScore: 11,
    maxScore: 15,
    description: 'High acuity — permanent supportive housing and emergency shelter should be prioritized.',
    badgeColor: 'coral',
    recommendedProjectTypeCodes: 'PSH,ES',
  },
];

async function seedCeScoreBands() {
  let count = 0;
  for (const band of CE_SCORE_BANDS) {
    const existing = await prisma.ceScoreBand.findFirst({ where: { name: band.name } });
    if (existing) continue;
    await prisma.ceScoreBand.create({ data: band });
    count += 1;
  }
  logger.info({ count }, 'Seeded coordinated entry score bands (demo configuration)');
}

/**
 * `ce_flag_overrides` — one row per intake flag (demo configuration,
 * assessment-and-ce-workspace design.md Decision 6). Flag string convention
 * (must match `CeFlag`/`CeAssessmentFlags` in packages/types/src/coordinatedEntry.ts
 * exactly, camelCase to match CeAssessment.flags' own JSON keys):
 * 'veteran' | 'unaccompaniedYouth' | 'safetyAlert'. Veteran and
 * Unaccompanied Youth are `behavior: 'add'`, triggered by the flag alone (no
 * `triggerQuestionId`/`triggerMinScore`); Safety Alert is
 * `behavior: 'replace'` and carries the message that replaces the standard
 * referral action.
 *
 * NOTE: `CeFlagOverride` has no column carrying *which* project types an
 * 'add'/'replace' override contributes to the working recommendation list —
 * only `behavior` (add/replace) and, for Safety Alert,
 * `externalReferralMessage`. `CoordinatedEntryService` will need to
 * special-case what Veteran/Unaccompanied Youth actually add (e.g. a fixed
 * project-type list per flag in code, or a future migration adding a
 * `recommendedProjectTypeCodes`-style column here mirroring
 * `CeScoreBand`'s).
 */
const CE_FLAG_OVERRIDES: { flag: string; behavior: string; externalReferralMessage?: string }[] = [
  { flag: 'veteran', behavior: 'add' },
  { flag: 'unaccompaniedYouth', behavior: 'add' },
  {
    flag: 'safetyAlert',
    behavior: 'replace',
    externalReferralMessage:
      'This client has flagged a safety concern — do not send a standard referral. Contact the DV crisis line directly.',
  },
];

async function seedCeFlagOverrides() {
  let count = 0;
  for (const override of CE_FLAG_OVERRIDES) {
    const existing = await prisma.ceFlagOverride.findFirst({ where: { flag: override.flag } });
    if (existing) continue;
    await prisma.ceFlagOverride.create({
      data: {
        flag: override.flag,
        behavior: override.behavior,
        externalReferralMessage: override.externalReferralMessage ?? null,
      },
    });
    count += 1;
  }
  logger.info({ count }, 'Seeded coordinated entry flag overrides (demo configuration)');
}

main()
  .catch((err) => {
    logger.error({ err }, 'Seeding failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
