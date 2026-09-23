import type {
  ApiResponse,
  Assessment,
  AssessmentInput,
  AssessmentUpdateInput,
  Case,
  Client,
  ClientIntakeInput,
  ClientSearchResultItem,
  ClientUpdateInput,
  Disability,
  DisabilityInput,
  EnsureCaseInput,
  FamilyMemberInput,
  Household,
  HudOptionsResponse,
  InteractionSummary,
  InteractionSummaryInput,
  Program,
  ProgramEnrollment,
  ProgramEnrollmentInput,
  ProgramEnrollmentUpdateInput,
  ClientIntakeSnapshot,
} from '@housing360/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  });
  return (await response.json()) as ApiResponse<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/**
 * `ApiErrorResponse` (packages/types/src/api.ts) doesn't type an optional
 * `data` field, but `sendError`/`AppError` (apps/api) do attach one for
 * structured error payloads (e.g. a 409 duplicate-check's candidates). This
 * reads it out without widening the shared type — packages/types is
 * read-only for this change.
 */
export function extractErrorData<D>(response: { success: false; data?: unknown }): D | undefined {
  return response.data as D | undefined;
}

// ---------------------------------------------------------------------------
// client-intake-wizard endpoints — one typed wrapper per endpoint, built on
// the same `apiClient` verbs the rest of the app uses (see clientsSlice.ts).
// ---------------------------------------------------------------------------

export function searchClients(name: string) {
  return apiClient.get<ClientSearchResultItem[]>(`/api/clients/search?name=${encodeURIComponent(name)}`);
}

export function getClientIntakeSnapshot(clientId: string) {
  return apiClient.get<ClientIntakeSnapshot>(`/api/clients/${clientId}/intake-snapshot`);
}

/** Body carries `allowDuplicate` per the 409-duplicate-check contract (see design.md). */
export function createClientIntake(input: ClientIntakeInput) {
  return apiClient.post<Client>('/api/clients', input);
}

export function updateClientIntake(id: string, input: ClientUpdateInput & { allowDuplicate?: boolean }) {
  return apiClient.patch<Client>(`/api/clients/${id}`, input);
}

export function createHousehold(clientId: string) {
  return apiClient.post<Household>('/api/households', { clientId });
}

/** Returns the created family members as full `Client` rows. */
export function addHouseholdMembers(householdId: string, members: FamilyMemberInput[]) {
  return apiClient.post<Client[]>(`/api/households/${householdId}/members`, { members });
}

export function getActivePrograms() {
  return apiClient.get<Program[]>('/api/programs?active=true');
}

export function getClientEnrollments(clientId: string) {
  return apiClient.get<ProgramEnrollment[]>(`/api/clients/${clientId}/enrollments`);
}

export function createEnrollment(input: ProgramEnrollmentInput) {
  return apiClient.post<ProgramEnrollment>('/api/enrollments', input);
}

export function updateEnrollment(id: string, input: ProgramEnrollmentUpdateInput) {
  return apiClient.patch<ProgramEnrollment>(`/api/enrollments/${id}`, input);
}

export function ensureCase(input: EnsureCaseInput) {
  return apiClient.post<Case>('/api/cases/ensure', input);
}

export function getEntryAssessment(enrollmentId: string) {
  return apiClient.get<Assessment | null>(`/api/enrollments/${enrollmentId}/assessments?stage=entry`);
}

export function createAssessment(input: AssessmentInput) {
  return apiClient.post<Assessment>('/api/assessments', input);
}

export function updateAssessment(id: string, input: AssessmentUpdateInput) {
  return apiClient.patch<Assessment>(`/api/assessments/${id}`, input);
}

export function addDisability(assessmentId: string, input: Omit<DisabilityInput, 'assessmentId'>) {
  return apiClient.post<Disability>(`/api/assessments/${assessmentId}/disabilities`, input);
}

export function removeDisability(id: string) {
  return apiClient.delete<null>(`/api/disabilities/${id}`);
}

export function createInteractionSummary(input: InteractionSummaryInput) {
  return apiClient.post<InteractionSummary>('/api/interaction-summaries', input);
}

export function getHudOptions() {
  return apiClient.get<HudOptionsResponse>('/api/reference/hud-options');
}
