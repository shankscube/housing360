import type { PartnerAgency } from '@housing360/types';
import { findOrganizationsByServiceDomain } from '../models/organization.model';
import { toPartnerAgency } from '../models/organization.mapper';

export async function listPartnerAgencies(domain?: string): Promise<PartnerAgency[]> {
  const rows = await findOrganizationsByServiceDomain(domain);
  return rows.map(toPartnerAgency);
}
