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

main()
  .catch((err) => {
    logger.error({ err }, 'Seeding failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
