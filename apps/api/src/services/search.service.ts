import type { SearchResponse, SearchResultItem } from '@housing360/types';
import {
  searchAssessments,
  searchCases,
  searchClients,
  searchReferrals,
  searchTasks,
} from '../models/search.model';

function clientName(client: { firstName: string; lastName: string }): string {
  return `${client.firstName} ${client.lastName}`;
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Runs all 5 per-entity searches in parallel and maps each row to the
 * shared `SearchResultItem` shape. A group with zero matches is an empty
 * array, never omitted or an error — see global-search's spec.
 */
export async function globalSearch(query: string): Promise<SearchResponse> {
  const [clients, cases, referrals, tasks, assessments] = await Promise.all([
    searchClients(query),
    searchCases(query),
    searchReferrals(query),
    searchTasks(query),
    searchAssessments(query),
  ]);

  const clientItems: SearchResultItem[] = clients.map((client) => ({
    type: 'client',
    id: client.id,
    title: clientName(client),
    // Never any SSN representation, masked or plain — DOB only.
    subtitle: client.dob ?? 'DOB not provided',
    icon: 'users',
  }));

  const caseItems: SearchResultItem[] = cases.map((caseRow) => ({
    type: 'case',
    id: caseRow.id,
    title: caseRow.subject || caseRow.caseNumber,
    subtitle: `${caseRow.caseNumber} · ${clientName(caseRow.client)}`,
    icon: 'cases',
  }));

  const referralItems: SearchResultItem[] = referrals.map((referral) => ({
    type: 'referral',
    id: referral.id,
    title: referral.title,
    subtitle: clientName(referral.client),
    icon: 'refer',
  }));

  const taskItems: SearchResultItem[] = tasks.map((task) => ({
    type: 'task',
    id: task.id,
    title: task.subject,
    subtitle: clientName(task.client),
    icon: 'clipboard',
  }));

  const assessmentItems: SearchResultItem[] = assessments.map((assessment) => ({
    type: 'assessment',
    id: assessment.id,
    title: `${capitalize(assessment.type ?? 'Entry')} Assessment — ${clientName(assessment.client)}`,
    subtitle: clientName(assessment.client),
    icon: 'assess',
  }));

  return {
    groups: {
      clients: clientItems,
      cases: caseItems,
      referrals: referralItems,
      tasks: taskItems,
      assessments: assessmentItems,
    },
  };
}
