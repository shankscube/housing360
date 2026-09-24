export type SearchResultType = 'client' | 'case' | 'referral' | 'task' | 'assessment';

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface SearchResponse {
  groups: {
    clients: SearchResultItem[];
    cases: SearchResultItem[];
    referrals: SearchResultItem[];
    tasks: SearchResultItem[];
    assessments: SearchResultItem[];
  };
}
