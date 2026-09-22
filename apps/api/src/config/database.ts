import './loadEnv';
import { env } from './env';

export type DatabaseEngine = 'mysql' | 'postgresql' | 'mongodb';

function detectEngine(): DatabaseEngine {
  const url = process.env.DATABASE_URL;
  if (url?.startsWith('postgres://') || url?.startsWith('postgresql://')) {
    return 'postgresql';
  }
  if (url?.startsWith('mysql://')) {
    return 'mysql';
  }
  if (process.env.MONGODB_URI || process.env.MONGO_URL) {
    return 'mongodb';
  }
  // Only the generic DB_HOST/PORT/USER/PASSWORD/NAME vars are present with no
  // engine-identifying signal — ambiguous, so default to MySQL per project convention.
  return 'mysql';
}

function buildMysqlUrl(): string {
  const { host, port, user, password, name } = env.db;
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

export const databaseEngine = detectEngine();

if (databaseEngine !== 'mysql') {
  throw new Error(
    `Detected database engine "${databaseEngine}" from .env, but this scaffold only wires MySQL via Prisma. ` +
      'Update apps/api/prisma/schema.prisma and apps/api/src/config/database.ts to add support for it.'
  );
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = buildMysqlUrl();
}
