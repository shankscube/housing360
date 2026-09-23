import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Assessment,
  AssessmentInput,
  AssessmentUpdateInput,
  Client,
  ClientIntakeInput,
  ClientIntakeSnapshot,
  ClientListItem,
  ClientSearchResultItem,
  ClientUpdateInput,
  Disability,
  DisabilityInput,
  DuplicateClientCandidates,
  EntryAssessmentStatus,
  FamilyMemberInput,
  HudOptionsResponse,
  InteractionSummary,
  InteractionSummaryInput,
  Program,
  ProgramEnrollment,
  ProgramEnrollmentInput,
  ProgramEnrollmentUpdateInput,
} from '@housing360/types';
import {
  addDisability as apiAddDisability,
  addHouseholdMembers as apiAddHouseholdMembers,
  createClientIntake,
  createEnrollment,
  createHousehold as apiCreateHousehold,
  createAssessment,
  createInteractionSummary as apiCreateInteractionSummary,
  ensureCase as apiEnsureCase,
  extractErrorData,
  getActivePrograms,
  getClientEnrollments,
  getClientIntakeSnapshot,
  getEntryAssessment,
  getHudOptions,
  removeDisability as apiRemoveDisability,
  searchClients as apiSearchClients,
  updateAssessment,
  updateClientIntake,
  updateEnrollment,
} from '../../api/client';

// -----------------------------------------------------------------------------
// `intake` slice — drives the client-intake-wizard feature (features/intake/).
// Step numbering is 1-8, matching the wizard's own "Step N of 8" UI and the
// spec's "steps 4-7" / "step 1" language (see spec.md) — NOT 0-indexed.
//   1 Client Basic Information   5 Income & Benefits/Insurance
//   2 Family Members             6 Health & DV (also persists 4-6 in one call)
//   3 Program & Enrollment       7 Disabilities
//   4 Living Situation           8 Interaction Summary
// -----------------------------------------------------------------------------

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
type ClientSaveStatus = RequestStatus | 'duplicates_found';

export type IntakePhase = 'search' | 'form' | 'finished';

/** Distinguishable rejection shape for `saveClientBasicInfo` — see design.md's 409/`allowDuplicate` decision. */
export type SaveClientBasicInfoRejection =
  | { kind: 'duplicate'; candidates: ClientListItem[] }
  | { kind: 'error'; message: string };

interface IntakeIds {
  clientId: string | null;
  householdId: string | null;
  caseId: string | null;
  enrollmentId: string | null;
  assessmentId: string | null;
  interactionSummaryId: string | null;
}

interface IntakeSearchState {
  searchTerm: string;
  searchResults: ClientSearchResultItem[];
  searchStatus: RequestStatus;
  searchError: string | null;
}

interface IntakeSnapshotState {
  data: ClientIntakeSnapshot | null;
  status: RequestStatus;
  error: string | null;
}

interface IntakeClientSaveState {
  status: ClientSaveStatus;
  error: string | null;
  duplicateCandidates: ClientListItem[];
}

interface IntakeHouseholdState {
  status: RequestStatus;
  error: string | null;
}

interface IntakeProgramsState {
  items: Program[];
  status: RequestStatus;
  error: string | null;
}

interface IntakeEnrollmentsState {
  items: ProgramEnrollment[];
  primaryEnrollmentId: string | null;
  status: RequestStatus;
  error: string | null;
}

interface IntakeAssessmentState {
  current: Assessment | null;
  /** Status message driver for the Program & Enrollment step (spec: resuming/editing/not-yet-recorded). */
  entryStatus: EntryAssessmentStatus | null;
  status: RequestStatus;
  error: string | null;
}

interface IntakeDisabilitiesState {
  items: Disability[];
  status: RequestStatus;
  error: string | null;
}

interface IntakeInteractionSummaryState {
  current: InteractionSummary | null;
  status: RequestStatus;
  error: string | null;
}

interface IntakeHudOptionsState {
  data: HudOptionsResponse | null;
  status: RequestStatus;
  error: string | null;
}

interface IntakeState {
  phase: IntakePhase;
  currentStep: number;
  furthestStep: number;
  completedSteps: number[];
  ids: IntakeIds;
  /** The current client's full record, once known — set on snapshot load (existing client) or first successful save (new client). Convenience for steps that need e.g. the client's name (step 3's enrollment-name default) without a second fetch. */
  client: Client | null;
  search: IntakeSearchState;
  snapshot: IntakeSnapshotState;
  clientSave: IntakeClientSaveState;
  household: IntakeHouseholdState;
  programs: IntakeProgramsState;
  enrollments: IntakeEnrollmentsState;
  assessment: IntakeAssessmentState;
  disabilities: IntakeDisabilitiesState;
  interactionSummary: IntakeInteractionSummaryState;
  hudOptions: IntakeHudOptionsState;
}

const initialState: IntakeState = {
  phase: 'search',
  currentStep: 1,
  furthestStep: 1,
  completedSteps: [],
  client: null,
  ids: {
    clientId: null,
    householdId: null,
    caseId: null,
    enrollmentId: null,
    assessmentId: null,
    interactionSummaryId: null,
  },
  search: {
    searchTerm: '',
    searchResults: [],
    searchStatus: 'idle',
    searchError: null,
  },
  snapshot: {
    data: null,
    status: 'idle',
    error: null,
  },
  clientSave: {
    status: 'idle',
    error: null,
    duplicateCandidates: [],
  },
  household: {
    status: 'idle',
    error: null,
  },
  programs: {
    items: [],
    status: 'idle',
    error: null,
  },
  enrollments: {
    items: [],
    primaryEnrollmentId: null,
    status: 'idle',
    error: null,
  },
  assessment: {
    current: null,
    entryStatus: null,
    status: 'idle',
    error: null,
  },
  disabilities: {
    items: [],
    status: 'idle',
    error: null,
  },
  interactionSummary: {
    current: null,
    status: 'idle',
    error: null,
  },
  hudOptions: {
    data: null,
    status: 'idle',
    error: null,
  },
};

// -----------------------------------------------------------------------------
// Thunks — every call goes through src/api/client.ts, never a direct fetch.
// -----------------------------------------------------------------------------

export const searchClients = createAsyncThunk(
  'intake/searchClients',
  async (name: string, { rejectWithValue }) => {
    const response = await apiSearchClients(name);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const loadIntakeSnapshot = createAsyncThunk(
  'intake/loadIntakeSnapshot',
  async (clientId: string, { rejectWithValue }) => {
    const response = await getClientIntakeSnapshot(clientId);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export interface SaveClientBasicInfoArgs {
  clientId: string | null;
  input: ClientIntakeInput | ClientUpdateInput;
  allowDuplicate?: boolean;
}

export const saveClientBasicInfo = createAsyncThunk<
  import('@housing360/types').Client,
  SaveClientBasicInfoArgs,
  { rejectValue: SaveClientBasicInfoRejection }
>('intake/saveClientBasicInfo', async ({ clientId, input, allowDuplicate }, { rejectWithValue }) => {
  const body = { ...input, allowDuplicate };
  const response = clientId
    ? await updateClientIntake(clientId, body as ClientUpdateInput & { allowDuplicate?: boolean })
    : await createClientIntake(body as ClientIntakeInput);

  if (!response.success) {
    if (response.code === 409) {
      const data = extractErrorData<DuplicateClientCandidates>(response);
      return rejectWithValue({ kind: 'duplicate', candidates: data?.candidates ?? [] });
    }
    return rejectWithValue({ kind: 'error', message: response.message });
  }
  return response.data;
});

export const createHousehold = createAsyncThunk(
  'intake/createHousehold',
  async (clientId: string, { rejectWithValue }) => {
    const response = await apiCreateHousehold(clientId);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export interface AddHouseholdMembersArgs {
  householdId: string;
  members: FamilyMemberInput[];
}

export const addHouseholdMembers = createAsyncThunk(
  'intake/addHouseholdMembers',
  async ({ householdId, members }: AddHouseholdMembersArgs, { rejectWithValue }) => {
    const response = await apiAddHouseholdMembers(householdId, members);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const loadPrograms = createAsyncThunk('intake/loadPrograms', async (_: void, { rejectWithValue }) => {
  const response = await getActivePrograms();
  if (!response.success) return rejectWithValue(response.message);
  return response.data;
});

export const loadEnrollments = createAsyncThunk(
  'intake/loadEnrollments',
  async (clientId: string, { rejectWithValue }) => {
    const response = await getClientEnrollments(clientId);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export interface SaveEnrollmentArgs {
  enrollmentId: string | null;
  input: ProgramEnrollmentInput | ProgramEnrollmentUpdateInput;
}

export const saveEnrollment = createAsyncThunk(
  'intake/saveEnrollment',
  async ({ enrollmentId, input }: SaveEnrollmentArgs, { rejectWithValue }) => {
    const response = enrollmentId
      ? await updateEnrollment(enrollmentId, input as ProgramEnrollmentUpdateInput)
      : await createEnrollment(input as ProgramEnrollmentInput);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const ensureCase = createAsyncThunk(
  'intake/ensureCase',
  async (input: { clientId: string; enrollmentId: string }, { rejectWithValue }) => {
    const response = await apiEnsureCase(input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const loadEntryAssessment = createAsyncThunk(
  'intake/loadEntryAssessment',
  async (enrollmentId: string, { rejectWithValue }) => {
    const response = await getEntryAssessment(enrollmentId);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export interface SaveEntryAssessmentArgs {
  assessmentId: string | null;
  input: AssessmentInput | AssessmentUpdateInput;
}

export const saveEntryAssessment = createAsyncThunk(
  'intake/saveEntryAssessment',
  async ({ assessmentId, input }: SaveEntryAssessmentArgs, { rejectWithValue }) => {
    const response = assessmentId
      ? await updateAssessment(assessmentId, input as AssessmentUpdateInput)
      : await createAssessment(input as AssessmentInput);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export interface AddDisabilityArgs {
  assessmentId: string;
  input: Omit<DisabilityInput, 'assessmentId'>;
}

export const addDisability = createAsyncThunk(
  'intake/addDisability',
  async ({ assessmentId, input }: AddDisabilityArgs, { rejectWithValue }) => {
    const response = await apiAddDisability(assessmentId, input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const removeDisability = createAsyncThunk(
  'intake/removeDisability',
  async (id: string, { rejectWithValue }) => {
    const response = await apiRemoveDisability(id);
    if (!response.success) return rejectWithValue(response.message);
    return id;
  }
);

export const saveInteractionSummary = createAsyncThunk(
  'intake/saveInteractionSummary',
  async (input: InteractionSummaryInput, { rejectWithValue }) => {
    const response = await apiCreateInteractionSummary(input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const loadHudOptions = createAsyncThunk('intake/loadHudOptions', async (_: void, { rejectWithValue }) => {
  const response = await getHudOptions();
  if (!response.success) return rejectWithValue(response.message);
  return response.data;
});

// -----------------------------------------------------------------------------
// Slice
// -----------------------------------------------------------------------------

const intakeSlice = createSlice({
  name: 'intake',
  initialState,
  reducers: {
    setPhase(state, action: PayloadAction<IntakePhase>) {
      state.phase = action.payload;
    },
    setCurrentStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
      if (action.payload > state.furthestStep) {
        state.furthestStep = action.payload;
      }
    },
    markStepComplete(state, action: PayloadAction<number>) {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    /** Resets completion for steps 4-7 (Living Situation/Income/Health/Disabilities) only — used when switching the active enrollment. */
    resetSectionSteps(state) {
      state.completedSteps = state.completedSteps.filter((step) => step < 4 || step > 7);
    },
    /**
     * Sets the wizard's active enrollment and, when a snapshot has been
     * loaded, pre-fills the case/assessment/disabilities ids and data known
     * for that enrollment. Callers pair this with `resetSectionSteps` when
     * the switch happens after steps 4-7 were already touched (see spec:
     * "Switching enrollment resets section step completion").
     */
    setActiveEnrollment(state, action: PayloadAction<string | null>) {
      const enrollmentId = action.payload;
      state.ids.enrollmentId = enrollmentId;
      const snapshot = state.snapshot.data;
      if (enrollmentId && snapshot) {
        state.ids.caseId = snapshot.caseIdByEnrollment[enrollmentId] ?? null;
        state.assessment.entryStatus = snapshot.entryAssessmentByEnrollment[enrollmentId] ?? null;
        state.ids.assessmentId = snapshot.entryAssessmentByEnrollment[enrollmentId]?.assessmentId ?? null;
        state.disabilities.items = snapshot.disabilitiesByEnrollment[enrollmentId] ?? [];
      } else {
        state.ids.caseId = null;
        state.assessment.entryStatus = null;
        state.ids.assessmentId = null;
        state.disabilities.items = [];
      }
    },
    /** Full reset — e.g. the wizard is closed/reopened for a different flow. */
    resetIntake() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // searchClients
      .addCase(searchClients.pending, (state, action) => {
        state.search.searchStatus = 'loading';
        state.search.searchError = null;
        state.search.searchTerm = action.meta.arg;
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.search.searchStatus = 'succeeded';
        state.search.searchResults = action.payload;
      })
      .addCase(searchClients.rejected, (state, action) => {
        state.search.searchStatus = 'failed';
        state.search.searchError = (action.payload as string | undefined) ?? 'Failed to search clients';
      })

      // loadIntakeSnapshot
      .addCase(loadIntakeSnapshot.pending, (state) => {
        state.snapshot.status = 'loading';
        state.snapshot.error = null;
      })
      .addCase(loadIntakeSnapshot.fulfilled, (state, action) => {
        state.snapshot.status = 'succeeded';
        state.snapshot.data = action.payload;
        state.ids.clientId = action.payload.clientId;
        state.ids.householdId = action.payload.householdId;
        state.client = action.payload.client;
      })
      .addCase(loadIntakeSnapshot.rejected, (state, action) => {
        state.snapshot.status = 'failed';
        state.snapshot.error = (action.payload as string | undefined) ?? 'Failed to load client intake snapshot';
      })

      // saveClientBasicInfo
      .addCase(saveClientBasicInfo.pending, (state) => {
        state.clientSave.status = 'loading';
        state.clientSave.error = null;
      })
      .addCase(saveClientBasicInfo.fulfilled, (state, action) => {
        state.clientSave.status = 'succeeded';
        state.clientSave.duplicateCandidates = [];
        state.ids.clientId = action.payload.id;
        state.client = action.payload;
      })
      .addCase(saveClientBasicInfo.rejected, (state, action) => {
        if (action.payload?.kind === 'duplicate') {
          state.clientSave.status = 'duplicates_found';
          state.clientSave.duplicateCandidates = action.payload.candidates;
          state.clientSave.error = null;
        } else {
          state.clientSave.status = 'failed';
          state.clientSave.error = action.payload?.message ?? 'Failed to save client';
        }
      })

      // createHousehold
      .addCase(createHousehold.pending, (state) => {
        state.household.status = 'loading';
        state.household.error = null;
      })
      .addCase(createHousehold.fulfilled, (state, action) => {
        state.household.status = 'succeeded';
        state.ids.householdId = action.payload.id;
      })
      .addCase(createHousehold.rejected, (state, action) => {
        state.household.status = 'failed';
        state.household.error = (action.payload as string | undefined) ?? 'Failed to create household';
      })

      // addHouseholdMembers
      .addCase(addHouseholdMembers.pending, (state) => {
        state.household.status = 'loading';
        state.household.error = null;
      })
      .addCase(addHouseholdMembers.fulfilled, (state) => {
        state.household.status = 'succeeded';
      })
      .addCase(addHouseholdMembers.rejected, (state, action) => {
        state.household.status = 'failed';
        state.household.error = (action.payload as string | undefined) ?? 'Failed to add family members';
      })

      // loadPrograms
      .addCase(loadPrograms.pending, (state) => {
        state.programs.status = 'loading';
        state.programs.error = null;
      })
      .addCase(loadPrograms.fulfilled, (state, action) => {
        state.programs.status = 'succeeded';
        state.programs.items = action.payload;
      })
      .addCase(loadPrograms.rejected, (state, action) => {
        state.programs.status = 'failed';
        state.programs.error = (action.payload as string | undefined) ?? 'Failed to load programs';
      })

      // loadEnrollments
      .addCase(loadEnrollments.pending, (state) => {
        state.enrollments.status = 'loading';
        state.enrollments.error = null;
      })
      .addCase(loadEnrollments.fulfilled, (state, action) => {
        state.enrollments.status = 'succeeded';
        state.enrollments.items = action.payload;
        const primary = action.payload.find((e) => e.isPrimary) ?? action.payload[0] ?? null;
        state.enrollments.primaryEnrollmentId = primary?.id ?? null;
      })
      .addCase(loadEnrollments.rejected, (state, action) => {
        state.enrollments.status = 'failed';
        state.enrollments.error = (action.payload as string | undefined) ?? 'Failed to load enrollments';
      })

      // saveEnrollment
      .addCase(saveEnrollment.pending, (state) => {
        state.enrollments.status = 'loading';
        state.enrollments.error = null;
      })
      .addCase(saveEnrollment.fulfilled, (state, action) => {
        state.enrollments.status = 'succeeded';
        state.ids.enrollmentId = action.payload.id;
        const idx = state.enrollments.items.findIndex((e) => e.id === action.payload.id);
        if (idx >= 0) {
          state.enrollments.items[idx] = action.payload;
        } else {
          state.enrollments.items.push(action.payload);
        }
        if (action.payload.isPrimary) {
          state.enrollments.primaryEnrollmentId = action.payload.id;
        }
      })
      .addCase(saveEnrollment.rejected, (state, action) => {
        state.enrollments.status = 'failed';
        state.enrollments.error = (action.payload as string | undefined) ?? 'Failed to save enrollment';
      })

      // ensureCase
      .addCase(ensureCase.fulfilled, (state, action) => {
        state.ids.caseId = action.payload.id;
      })

      // loadEntryAssessment
      .addCase(loadEntryAssessment.pending, (state) => {
        state.assessment.status = 'loading';
        state.assessment.error = null;
      })
      .addCase(loadEntryAssessment.fulfilled, (state, action) => {
        state.assessment.status = 'succeeded';
        state.assessment.current = action.payload;
        state.ids.assessmentId = action.payload?.id ?? null;
      })
      .addCase(loadEntryAssessment.rejected, (state, action) => {
        state.assessment.status = 'failed';
        state.assessment.error = (action.payload as string | undefined) ?? 'Failed to load entry assessment';
      })

      // saveEntryAssessment
      .addCase(saveEntryAssessment.pending, (state) => {
        state.assessment.status = 'loading';
        state.assessment.error = null;
      })
      .addCase(saveEntryAssessment.fulfilled, (state, action) => {
        state.assessment.status = 'succeeded';
        state.assessment.current = action.payload;
        state.ids.assessmentId = action.payload.id;
      })
      .addCase(saveEntryAssessment.rejected, (state, action) => {
        state.assessment.status = 'failed';
        state.assessment.error = (action.payload as string | undefined) ?? 'Failed to save entry assessment';
      })

      // addDisability
      .addCase(addDisability.pending, (state) => {
        state.disabilities.status = 'loading';
        state.disabilities.error = null;
      })
      .addCase(addDisability.fulfilled, (state, action) => {
        state.disabilities.status = 'succeeded';
        state.disabilities.items.push(action.payload);
      })
      .addCase(addDisability.rejected, (state, action) => {
        state.disabilities.status = 'failed';
        state.disabilities.error = (action.payload as string | undefined) ?? 'Failed to add disability';
      })

      // removeDisability
      .addCase(removeDisability.fulfilled, (state, action) => {
        state.disabilities.items = state.disabilities.items.filter((d) => d.id !== action.payload);
      })
      .addCase(removeDisability.rejected, (state, action) => {
        state.disabilities.status = 'failed';
        state.disabilities.error = (action.payload as string | undefined) ?? 'Failed to remove disability';
      })

      // saveInteractionSummary
      .addCase(saveInteractionSummary.pending, (state) => {
        state.interactionSummary.status = 'loading';
        state.interactionSummary.error = null;
      })
      .addCase(saveInteractionSummary.fulfilled, (state, action) => {
        state.interactionSummary.status = 'succeeded';
        state.interactionSummary.current = action.payload;
        state.ids.interactionSummaryId = action.payload.id;
      })
      .addCase(saveInteractionSummary.rejected, (state, action) => {
        state.interactionSummary.status = 'failed';
        state.interactionSummary.error =
          (action.payload as string | undefined) ?? 'Failed to save interaction summary';
      })

      // loadHudOptions
      .addCase(loadHudOptions.pending, (state) => {
        state.hudOptions.status = 'loading';
        state.hudOptions.error = null;
      })
      .addCase(loadHudOptions.fulfilled, (state, action) => {
        state.hudOptions.status = 'succeeded';
        state.hudOptions.data = action.payload;
      })
      .addCase(loadHudOptions.rejected, (state, action) => {
        state.hudOptions.status = 'failed';
        state.hudOptions.error = (action.payload as string | undefined) ?? 'Failed to load HUD option lists';
      });
  },
});

export const {
  setPhase,
  setCurrentStep,
  markStepComplete,
  resetSectionSteps,
  setActiveEnrollment,
  resetIntake,
} = intakeSlice.actions;

export default intakeSlice.reducer;
