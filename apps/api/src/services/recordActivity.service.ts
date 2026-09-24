import { insertRecordActivity } from '../models/recordActivity.model';
import { logger } from '../utils/logger';

export type RecordActivityType = 'client' | 'case' | 'referral' | 'assessment';
export type RecordActivityAction = 'viewed' | 'modified';

/**
 * Fire-and-forget — a logging failure must never break the client/case/
 * referral/assessment operation that triggered it (home-workspace design.md
 * Decision 1 / activity-feed spec's "logging failure never blocks" scenario).
 */
export function recordActivity(
  userId: number,
  recordType: RecordActivityType,
  recordId: string,
  action: RecordActivityAction
): void {
  void insertRecordActivity(userId, recordType, recordId, action).catch((err) => {
    logger.error({ err, userId, recordType, recordId, action }, 'Failed to write record_activity row');
  });
}
