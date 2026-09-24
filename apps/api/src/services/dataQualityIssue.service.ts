import {
  countDataQualityIssues,
  createDataQualityIssues,
  findDataQualityAlertsForHome,
} from '../models/dataQualityIssue.model';
import { findOldestClientIds } from '../models/client.model';

/**
 * PROVISIONAL — `DataQualityIssue` is a minimal read model standing in for a
 * future real Data Quality rule engine (home-dashboard design.md Decision 3).
 * The rows below are fixed demo titles attached to real clients — they are
 * NOT derived from any actual HUD data-completeness check. This file is
 * expected to be deleted outright, not extended, once the real rule engine
 * change lands.
 */
const DEMO_ISSUE_TITLES = [
  'Prior Living Situation Required',
  'Duplicate Person Account Suspected',
  'Missing SSN Documentation',
  'Disability Verification Needed',
];

const MIN_DEMO_DAYS_OPEN = 1;
const MAX_DEMO_DAYS_OPEN = 30;

function randomOpenedAt(): Date {
  const daysAgo =
    Math.floor(Math.random() * (MAX_DEMO_DAYS_OPEN - MIN_DEMO_DAYS_OPEN + 1)) + MIN_DEMO_DAYS_OPEN;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Idempotent no-op once any `DataQualityIssue` row exists, or before any
 * `Client` exists yet — the "zero clients" case is a real empty state, not
 * something this backfills around. See the file header and design.md
 * Decision 3 for why this can't run at `prisma/seed.ts` time instead.
 */
export async function ensureDemoDataQualityIssues(): Promise<void> {
  const existingCount = await countDataQualityIssues();
  if (existingCount > 0) return;

  const clientIds = await findOldestClientIds(DEMO_ISSUE_TITLES.length);
  if (clientIds.length === 0) return;

  const rows = clientIds.map((clientId, index) => ({
    // In-bounds by construction (`% length`), so the non-null assertion is safe.
    title: DEMO_ISSUE_TITLES[index % DEMO_ISSUE_TITLES.length]!,
    clientId,
    openedAt: randomOpenedAt(),
  }));
  await createDataQualityIssues(rows);
}

function computeDaysOpen(openedAt: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.floor((Date.now() - openedAt.getTime()) / msPerDay));
}

export interface HomeDataQualityAlert {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  daysOpen: number;
}

export async function getDataQualityAlertsForHome(limit = 4): Promise<HomeDataQualityAlert[]> {
  await ensureDemoDataQualityIssues();
  const rows = await findDataQualityAlertsForHome(limit);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    clientId: row.clientId,
    clientName: `${row.client.firstName} ${row.client.lastName}`,
    daysOpen: computeDaysOpen(row.openedAt),
  }));
}
