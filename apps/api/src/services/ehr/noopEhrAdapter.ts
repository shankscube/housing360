import type { EhrAdapter } from './EhrAdapter';

/**
 * Always returns empty — no real EHR integration exists yet. This is what
 * makes the Health and Wellness tab render "No clinical data on file for
 * this client yet." for every client today.
 */
export const noopEhrAdapter: EhrAdapter = {
  async getClinicalSummary() {
    return null;
  },
  async listRecentEncounters() {
    return [];
  },
};
