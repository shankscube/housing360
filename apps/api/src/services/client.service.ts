import type {
  Client,
  ClientIntakeInput,
  ClientIntakeSnapshot,
  ClientListItem,
  ClientListQuery,
  ClientListResult,
  ClientSearchResultItem,
  ClientUpdateInput,
  EntryAssessmentStatus,
  IntakeEnrollmentSummary,
} from '@housing360/types';
import {
  type ClientWriteData,
  createClient as createClientRow,
  enrichListRows,
  findClientById,
  findClients,
  findDuplicateCandidates,
  findHouseholdMembers,
  searchClientsByName,
  updateClient as updateClientRow,
} from '../models/client.model';
import {
  disclosureFieldToColumns,
  sexToPrisma,
  ssnFieldToColumns,
  toClient,
  toClientListItem,
  toClientSearchResultItem,
  toHouseholdMemberSummary,
} from '../models/client.mapper';
import { findEnrollmentsByClient } from '../models/enrollment.model';
import { findCaseByClientAndEnrollment } from '../models/case.model';
import { findAssessmentByEnrollmentAndStage, type AssessmentRow } from '../models/assessment.model';
import { findDisabilitiesByAssessmentId } from '../models/disability.model';
import { toDisability } from '../models/disability.mapper';
import { hashSsn } from '../utils/ssn';
import { AppError } from '../utils/AppError';

const ENTRY_STAGE = 1;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function normalizePagination(query: ClientListQuery): { page: number; pageSize: number } {
  const page =
    query.page !== undefined && Number.isFinite(query.page) && query.page > 0
      ? Math.floor(query.page)
      : DEFAULT_PAGE;
  const pageSize =
    query.pageSize !== undefined && Number.isFinite(query.pageSize) && query.pageSize > 0
      ? Math.min(Math.floor(query.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  return { page, pageSize };
}

export async function listClients(query: ClientListQuery): Promise<ClientListResult> {
  const { page, pageSize } = normalizePagination(query);
  const filter = query.filter ?? 'all';

  const { rows, total } = await findClients({ page, pageSize, filter, search: query.search });
  const enrichedRows = await enrichListRows(rows);
  const items: ClientListItem[] = enrichedRows.map(toClientListItem);

  return { items, total, page, pageSize };
}

export async function getClientById(id: string): Promise<Client> {
  const row = await findClientById(id);
  if (!row) {
    throw new AppError(404, 'Client not found');
  }
  return toClient(row);
}

export async function searchClients(name: string): Promise<ClientSearchResultItem[]> {
  const rows = await searchClientsByName(name);
  return rows.map(toClientSearchResultItem);
}

export async function createClient(input: ClientIntakeInput): Promise<Client> {
  // A duplicate can only be matched on name + DOB + SSN hash when both DOB
  // and SSN are actual disclosed values — a withheld field can't be compared.
  const canCheckDuplicates = input.ssn.status === 'provided' && input.dob.status === 'provided';

  if (canCheckDuplicates && input.allowDuplicate !== true) {
    const candidateRows = await findDuplicateCandidates({
      firstName: input.firstName,
      lastName: input.lastName,
      dob: input.dob.value ?? undefined,
      ssnHash: input.ssn.value ? hashSsn(input.ssn.value) : undefined,
    });
    if (candidateRows.length > 0) {
      const enrichedCandidates = await enrichListRows(candidateRows);
      const candidates: ClientListItem[] = enrichedCandidates.map(toClientListItem);
      throw new AppError(409, 'Duplicate candidates found', [], { candidates });
    }
  }

  // TODO(household-duplicate-alert): no automated alert today for a person registered in more than one household — see proposal.md's carried-forward gap

  const ssnColumns = ssnFieldToColumns(input.ssn);
  const dobColumns = disclosureFieldToColumns(input.dob);

  // `householdId`/`relationshipToHoh` are intentionally NOT set here — a
  // household is created after its head client already exists
  // (`POST /api/households`), which sets both in one transaction. See
  // design.md's Household decision.
  const row = await createClientRow({
    firstName: input.firstName,
    lastName: input.lastName,
    title: input.title ?? null,
    nameDataQuality: input.nameDataQuality ?? null,
    sex: sexToPrisma(input.sex),
    raceEthnicity: input.raceEthnicity,
    ssnDataQuality: input.ssnDataQuality ?? null,
    ssnEncrypted: ssnColumns.ssnEncrypted,
    ssnHash: ssnColumns.ssnHash,
    ssnLast4: ssnColumns.ssnLast4,
    ssnDisclosure: ssnColumns.ssnDisclosure,
    dob: dobColumns.value,
    dobDataQuality: input.dobDataQuality ?? null,
    dobDisclosure: dobColumns.status,
    mobile: input.mobile ?? null,
    email: input.email ?? null,
    veteranStatus: input.veteranStatus ?? null,
    militaryBranch: input.veteranDetails?.militaryBranch ?? null,
    yearEnteredService: input.veteranDetails?.yearEnteredService ?? null,
    dischargeStatus: input.veteranDetails?.dischargeStatus ?? null,
    ww2: input.veteranDetails?.ww2 ?? null,
    koreanWar: input.veteranDetails?.koreanWar ?? null,
    vietnamWar: input.veteranDetails?.vietnamWar ?? null,
    otherTheater: input.veteranDetails?.otherTheater ?? null,
    relationshipToHoh: input.relationshipToHoh ?? null,
  });

  return toClient(row);
}

export async function updateClient(id: string, input: ClientUpdateInput): Promise<Client> {
  const existing = await findClientById(id);
  if (!existing) {
    throw new AppError(404, 'Client not found');
  }

  // Head-of-household validation is gone from this layer entirely — it's now
  // structurally impossible to change who's head of an existing household
  // (no `householdId`/head-changing field exists on `ClientUpdateInput`);
  // head is fixed at `Household` creation time. See design.md.

  const data: Partial<ClientWriteData> = {};
  if (input.firstName !== undefined) {
    data.firstName = input.firstName;
  }
  if (input.lastName !== undefined) {
    data.lastName = input.lastName;
  }
  if (input.title !== undefined) {
    data.title = input.title;
  }
  if (input.nameDataQuality !== undefined) {
    data.nameDataQuality = input.nameDataQuality;
  }
  if (input.sex !== undefined) {
    data.sex = sexToPrisma(input.sex);
  }
  if (input.raceEthnicity !== undefined) {
    data.raceEthnicity = input.raceEthnicity;
  }
  if (input.ssnDataQuality !== undefined) {
    data.ssnDataQuality = input.ssnDataQuality;
  }
  if (input.ssn !== undefined) {
    const ssnColumns = ssnFieldToColumns(input.ssn);
    data.ssnEncrypted = ssnColumns.ssnEncrypted;
    data.ssnHash = ssnColumns.ssnHash;
    data.ssnLast4 = ssnColumns.ssnLast4;
    data.ssnDisclosure = ssnColumns.ssnDisclosure;
  }
  if (input.dobDataQuality !== undefined) {
    data.dobDataQuality = input.dobDataQuality;
  }
  if (input.dob !== undefined) {
    const dobColumns = disclosureFieldToColumns(input.dob);
    data.dob = dobColumns.value;
    data.dobDisclosure = dobColumns.status;
  }
  if (input.mobile !== undefined) {
    data.mobile = input.mobile;
  }
  if (input.email !== undefined) {
    data.email = input.email;
  }
  if (input.veteranStatus !== undefined) {
    data.veteranStatus = input.veteranStatus;
  }
  if (input.veteranDetails !== undefined) {
    if (input.veteranDetails.militaryBranch !== undefined) {
      data.militaryBranch = input.veteranDetails.militaryBranch;
    }
    if (input.veteranDetails.yearEnteredService !== undefined) {
      data.yearEnteredService = input.veteranDetails.yearEnteredService;
    }
    if (input.veteranDetails.dischargeStatus !== undefined) {
      data.dischargeStatus = input.veteranDetails.dischargeStatus;
    }
    if (input.veteranDetails.ww2 !== undefined) {
      data.ww2 = input.veteranDetails.ww2;
    }
    if (input.veteranDetails.koreanWar !== undefined) {
      data.koreanWar = input.veteranDetails.koreanWar;
    }
    if (input.veteranDetails.vietnamWar !== undefined) {
      data.vietnamWar = input.veteranDetails.vietnamWar;
    }
    if (input.veteranDetails.otherTheater !== undefined) {
      data.otherTheater = input.veteranDetails.otherTheater;
    }
  }
  if (input.relationshipToHoh !== undefined) {
    data.relationshipToHoh = input.relationshipToHoh;
  }

  const row = await updateClientRow(id, data);
  return toClient(row);
}

/** A handful of representative fields per section — good enough to answer "has this
 * section been touched at all", not an exhaustive field-by-field completeness check. */
function sectionsWithValues(row: AssessmentRow) {
  return {
    livingSituation: row.situationCategory !== null,
    incomeBenefitsInsurance:
      row.incomeFromAnySource !== null ||
      row.benefitsFromAnySource !== null ||
      row.insuranceFromAnySource !== null,
    healthDv: row.generalHealthStatus !== null || row.domesticViolenceSurvivor !== null,
  };
}

/**
 * Feeds the intake wizard's "selecting an existing client pre-fills the form"
 * flow: household id, every enrollment (flagging the primary one), and
 * per-enrollment case/Entry-Assessment/disability state — see the
 * `client-intake` capability spec's "Selecting an Existing Client Pre-Fills
 * the Wizard" requirement.
 */
export async function getClientIntakeSnapshot(clientId: string): Promise<ClientIntakeSnapshot> {
  const client = await findClientById(clientId);
  if (!client) {
    throw new AppError(404, 'Client not found');
  }

  const householdMembers = client.householdId
    ? (await findHouseholdMembers(client.householdId, clientId)).map(toHouseholdMemberSummary)
    : [];

  const enrollmentRows = await findEnrollmentsByClient(clientId);
  const enrollments: IntakeEnrollmentSummary[] = enrollmentRows.map((row) => ({
    id: row.id,
    programId: row.programId,
    programName: row.program.name,
    name: row.name,
    status: row.status,
    isPrimary: row.isPrimary,
    startDate: row.startDate.toISOString(),
  }));

  // Falls back to the first enrollment when none is flagged primary — matches
  // the wizard's own "selects the primary (or first, if none is marked
  // primary)" behavior described in proposal.md.
  const primaryEnrollmentId = enrollments.find((e) => e.isPrimary)?.id ?? enrollments[0]?.id ?? null;

  const caseIdByEnrollment: Record<string, string> = {};
  const entryAssessmentByEnrollment: Record<string, EntryAssessmentStatus> = {};
  const disabilitiesByEnrollment: Record<string, ReturnType<typeof toDisability>[]> = {};

  await Promise.all(
    enrollments.map(async (enrollment) => {
      const caseRow = await findCaseByClientAndEnrollment(clientId, enrollment.id);
      if (caseRow) {
        caseIdByEnrollment[enrollment.id] = caseRow.id;
      }

      const assessmentRow = await findAssessmentByEnrollmentAndStage(enrollment.id, ENTRY_STAGE);
      if (!assessmentRow) {
        entryAssessmentByEnrollment[enrollment.id] = {
          exists: false,
          status: 'none',
          assessmentId: null,
          sectionsWithValues: { livingSituation: false, incomeBenefitsInsurance: false, healthDv: false },
        };
        disabilitiesByEnrollment[enrollment.id] = [];
        return;
      }

      entryAssessmentByEnrollment[enrollment.id] = {
        exists: true,
        status: assessmentRow.status === 'complete' ? 'complete' : 'in_progress',
        assessmentId: assessmentRow.id,
        sectionsWithValues: sectionsWithValues(assessmentRow),
      };

      const disabilityRows = await findDisabilitiesByAssessmentId(assessmentRow.id);
      disabilitiesByEnrollment[enrollment.id] = disabilityRows.map(toDisability);
    })
  );

  return {
    clientId,
    client: toClient(client),
    householdId: client.householdId,
    householdMembers,
    enrollments,
    primaryEnrollmentId,
    caseIdByEnrollment,
    entryAssessmentByEnrollment,
    disabilitiesByEnrollment,
  };
}
