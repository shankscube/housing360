import type { NotificationsResponse } from '@housing360/types';
import {
  findPendingReferralsForUser,
  findUnseenStatusUpdatesForSender,
  markStatusUpdatesSeen,
} from '../models/referralStatusEvent.model';

function humanizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export async function getNotifications(userId: number): Promise<NotificationsResponse> {
  const [pendingReferrals, statusUpdates] = await Promise.all([
    findPendingReferralsForUser(userId),
    findUnseenStatusUpdatesForSender(userId),
  ]);

  return {
    pendingReferrals: pendingReferrals.map((referral) => ({
      id: referral.id,
      title: referral.title,
      client: `${referral.client.firstName} ${referral.client.lastName}`,
      program: referral.program?.name ?? null,
    })),
    statusUpdates: statusUpdates.map((update) => ({
      id: update.id,
      referralId: update.referralId,
      title: update.referralTitle,
      statusLabel: humanizeStatus(update.toStatus),
      changedAt: update.changedAt.toISOString(),
    })),
  };
}

export async function markSeen(userId: number): Promise<void> {
  await markStatusUpdatesSeen(userId);
}
