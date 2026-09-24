export interface PartnerAgency {
  id: string;
  name: string;
  address: string | null;
  contactEmail: string | null;
  /** `false` when `contactEmail` is null — the Refer to Partner flow's "can't be reached yet" flag. */
  isReachable: boolean;
  serviceDomains: string[];
}
