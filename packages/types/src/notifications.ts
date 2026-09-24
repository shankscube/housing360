export interface PendingReferralItem {
  id: string;
  title: string;
  client: string;
  program: string | null;
}

export interface StatusUpdateItem {
  id: string;
  referralId: string;
  title: string;
  statusLabel: string;
  changedAt: string;
}

export interface NotificationsResponse {
  pendingReferrals: PendingReferralItem[];
  statusUpdates: StatusUpdateItem[];
}
