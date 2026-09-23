export interface Disability {
  id: string;
  assessmentId: string;
  disabilityType: string;
  response: string;
  indefiniteAndImpairs: string | null;
  /** HIV/AIDS-only — populated only when disabilityType is "hivAids" and response is "Yes". */
  antiRetroviral: string | null;
  tCellAvailable: string | null;
  tCellCount: number | null;
  tCellSource: string | null;
  viralLoadAvailable: string | null;
  viralLoad: string | null;
  viralLoadSource: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DisabilityInput = Omit<Disability, 'id' | 'createdAt' | 'updatedAt'>;
