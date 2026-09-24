import type { RecentActivityFilter, RecentActivityItem, RecentActivityResponse } from '@housing360/types';
import { findRecentActivityForUser } from '../models/recordActivity.model';
import { resolveActivityDisplays } from '../models/activityDisplay.model';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizePagination(params: { page?: number; pageSize?: number }): { page: number; pageSize: number } {
  const page =
    params.page !== undefined && Number.isFinite(params.page) && params.page > 0
      ? Math.floor(params.page)
      : DEFAULT_PAGE;
  const pageSize =
    params.pageSize !== undefined && Number.isFinite(params.pageSize) && params.pageSize > 0
      ? Math.min(Math.floor(params.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

/** Maps the plural, user-facing filter value to the singular `recordType` stored in `record_activity`. */
function toRecordType(filter: RecentActivityFilter | undefined): string | undefined {
  switch (filter) {
    case 'cases':
      return 'case';
    case 'referrals':
      return 'referral';
    case 'clients':
      return 'client';
    case 'assessments':
      return 'assessment';
    case 'all':
    default:
      return undefined;
  }
}

export async function listRecentActivity(
  userId: number,
  params: { type?: RecentActivityFilter; page?: number; pageSize?: number }
): Promise<RecentActivityResponse> {
  const { page, pageSize } = normalizePagination(params);
  const recordType = toRecordType(params.type);

  const { rows, total } = await findRecentActivityForUser(userId, recordType, page, pageSize);
  const displays = await resolveActivityDisplays(rows);

  const items: RecentActivityItem[] = [];
  for (const row of rows) {
    const display = displays.get(`${row.recordType}:${row.recordId}`);
    if (!display) {
      // Record was deleted since the activity was logged — skip rather than error.
      continue;
    }
    items.push({
      recordType: row.recordType as RecentActivityItem['recordType'],
      recordId: row.recordId,
      title: display.title,
      subtitle: display.subtitle,
      icon: display.icon,
      action: row.action,
      at: row.at.toISOString(),
    });
  }

  return { items, total, page, pageSize };
}

/** Home dashboard's "Recently Accessed" panel: the requesting user's `limit` newest distinct-record items, unfiltered by type. */
export async function listRecentActivityForHome(userId: number, limit = 5): Promise<RecentActivityItem[]> {
  const { items } = await listRecentActivity(userId, { type: undefined, page: 1, pageSize: limit });
  return items;
}
