export type RecentActivityFilter = 'all' | 'cases' | 'referrals' | 'clients' | 'assessments';
export type RecentActivityRecordType = 'client' | 'case' | 'referral' | 'assessment';

export interface RecentActivityItem {
  recordType: RecentActivityRecordType;
  recordId: string;
  title: string;
  subtitle: string;
  icon: string;
  action: string;
  at: string;
}

export interface RecentActivityResponse {
  items: RecentActivityItem[];
  total: number;
  page: number;
  pageSize: number;
}
