import type { PartnerAgency } from '@housing360/types';
import type { OrganizationRow } from './organization.model';

/** No contact email → flagged unreachable, per the Refer to Partner Agency flow (design.md Decision 7). */
export function toPartnerAgency(row: OrganizationRow): PartnerAgency {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    contactEmail: row.contactEmail,
    isReachable: row.contactEmail !== null,
    serviceDomains: row.serviceDomains.map((d) => d.serviceDomain),
  };
}
