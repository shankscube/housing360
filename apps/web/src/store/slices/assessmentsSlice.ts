import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Assessment,
  AssessmentDetail,
  AssessmentEligibility,
  AssessmentFilter,
  AssessmentInput,
  AssessmentKpiCounts,
  AssessmentListItem,
  AssessmentListQuery,
  AssessmentListResult,
  AssessmentTypeFilter,
  AssessmentUpdateInput,
  Disability,
  DisabilityInput,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AssessmentsListState {
  items: AssessmentListItem[];
  total: number;
  page: number;
  pageSize: number;
  filter: AssessmentFilter;
  typeFilter: AssessmentTypeFilter;
  search: string;
  kpis: AssessmentKpiCounts | null;
  status: RequestStatus;
  error: string | null;
}

interface AssessmentsDetailState {
  assessment: AssessmentDetail | null;
  status: RequestStatus;
  error: string | null;
}

/** `assessment-and-ce-workspace` — the Launch Assessment modal's step 3 fetch.
 * Scoped to a single active fetch (not keyed by enrollment id) since only one
 * Launch modal is ever open at a time — the same "one active editing surface"
 * assumption `useAssessmentFormDraft` documents for the form draft itself. */
interface AssessmentsEligibilityState {
  items: AssessmentEligibility[];
  status: RequestStatus;
  error: string | null;
}

/** `assessment-and-ce-workspace` — the Assessment form modal's "Carry forward
 * previous answers" fetch. Same single-active-instance assumption as above. */
interface AssessmentsLatestValuesState {
  data: Assessment | null;
  status: RequestStatus;
  error: string | null;
}

interface AssessmentsState {
  list: AssessmentsListState;
  detail: AssessmentsDetailState;
  eligibility: AssessmentsEligibilityState;
  latestValues: AssessmentsLatestValuesState;
}

const initialState: AssessmentsState = {
  list: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filter: 'all',
    typeFilter: 'all',
    search: '',
    kpis: null,
    status: 'idle',
    error: null,
  },
  detail: {
    assessment: null,
    status: 'idle',
    error: null,
  },
  eligibility: {
    items: [],
    status: 'idle',
    error: null,
  },
  latestValues: {
    data: null,
    status: 'idle',
    error: null,
  },
};

function buildListQueryString(query: AssessmentListQuery): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  if (query.filter !== undefined) params.set('filter', query.filter);
  if (query.typeFilter !== undefined) params.set('typeFilter', query.typeFilter);
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchAssessments = createAsyncThunk(
  'assessments/fetchAssessments',
  async (query: AssessmentListQuery, { rejectWithValue }) => {
    const response = await apiClient.get<AssessmentListResult>(
      `/api/assessments${buildListQueryString(query)}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchAssessmentDetail = createAsyncThunk(
  'assessments/fetchAssessmentDetail',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.get<AssessmentDetail>(`/api/assessments/${id}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

/** `POST /api/assessments` actually returns the plain `Assessment` shape
 * (`assessment.controller.ts`'s `createAssessmentHandler` -> `toAssessment`),
 * not `AssessmentDetail` — fixed here (was previously mistyped) since the new
 * Assessment form modal is this thunk's first real consumer and needs the
 * accurate shape (no `clientName`/`contributions`/etc. on this response). */
export const createAssessment = createAsyncThunk(
  'assessments/createAssessment',
  async (input: AssessmentInput & { status?: string }, { rejectWithValue }) => {
    const response = await apiClient.post<Assessment>('/api/assessments', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

/** `PATCH /api/assessments/:id` — see `createAssessment`'s doc comment; same
 * plain-`Assessment` response shape fix applies here. */
export const updateAssessment = createAsyncThunk(
  'assessments/updateAssessment',
  async ({ id, input }: { id: string; input: AssessmentUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<Assessment>(`/api/assessments/${id}`, input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

/** `GET /api/enrollments/:id/assessment-eligibility` — the Launch Assessment
 * modal's step 3. */
export const fetchAssessmentEligibility = createAsyncThunk(
  'assessments/fetchAssessmentEligibility',
  async (enrollmentId: string, { rejectWithValue }) => {
    const response = await apiClient.get<AssessmentEligibility[]>(
      `/api/enrollments/${enrollmentId}/assessment-eligibility`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

/** `GET /api/enrollments/:id/latest-assessment-values` — "Carry forward
 * previous answers," fetched only when the user clicks the button (never
 * auto-applied — see the Assessment form modal). */
export const fetchLatestAssessmentValues = createAsyncThunk(
  'assessments/fetchLatestAssessmentValues',
  async (enrollmentId: string, { rejectWithValue }) => {
    const response = await apiClient.get<Assessment | null>(
      `/api/enrollments/${enrollmentId}/latest-assessment-values`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

/** `DELETE /api/assessments/:id` — limited to drafts server-side (409s on a
 * completed assessment; the UI never offers this action on a completed row,
 * so that path is defensive-only here). */
export const discardAssessment = createAsyncThunk(
  'assessments/discardAssessment',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.delete<null>(`/api/assessments/${id}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return id;
  }
);

/** `PUT /api/assessments/:id/disabilities` — replaces the assessment's full
 * disability set in one call, for the Assessment form modal's
 * `DisabilitiesEditor` (which is pure list state — this is what actually
 * persists it on Save Draft/Complete). */
export const replaceAssessmentDisabilities = createAsyncThunk(
  'assessments/replaceAssessmentDisabilities',
  async (
    { assessmentId, disabilities }: { assessmentId: string; disabilities: Omit<DisabilityInput, 'assessmentId'>[] },
    { rejectWithValue }
  ) => {
    const response = await apiClient.put<Disability[]>(`/api/assessments/${assessmentId}/disabilities`, disabilities);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState,
  reducers: {
    setListFilter(state, action: PayloadAction<AssessmentFilter>) {
      state.list.filter = action.payload;
      state.list.page = 1;
    },
    setListTypeFilter(state, action: PayloadAction<AssessmentTypeFilter>) {
      state.list.typeFilter = action.payload;
      state.list.page = 1;
    },
    setListPage(state, action: PayloadAction<number>) {
      state.list.page = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.list.search = action.payload;
      state.list.page = 1;
    },
    clearSelectedAssessment(state) {
      state.detail = { ...initialState.detail };
    },
    /** Reset before/after the Launch Assessment modal opens/closes so a stale
     * previous enrollment's eligibility never flashes for the next one. */
    clearEligibility(state) {
      state.eligibility = { ...initialState.eligibility };
    },
    /** Reset when the Assessment form modal closes, so "Carry forward" data
     * from one session never leaks into the next. */
    clearLatestValues(state) {
      state.latestValues = { ...initialState.latestValues };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessments.pending, (state) => {
        state.list.status = 'loading';
        state.list.error = null;
      })
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.items = action.payload.items;
        state.list.total = action.payload.total;
        state.list.page = action.payload.page;
        state.list.pageSize = action.payload.pageSize;
        state.list.kpis = action.payload.kpis;
      })
      .addCase(fetchAssessments.rejected, (state, action) => {
        state.list.status = 'failed';
        state.list.error = (action.payload as string | undefined) ?? 'Failed to fetch assessments';
      })

      .addCase(fetchAssessmentDetail.pending, (state) => {
        state.detail.status = 'loading';
        state.detail.error = null;
      })
      .addCase(fetchAssessmentDetail.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.assessment = action.payload;
      })
      .addCase(fetchAssessmentDetail.rejected, (state, action) => {
        state.detail.status = 'failed';
        state.detail.error = (action.payload as string | undefined) ?? 'Failed to fetch assessment';
      })

      // createAssessment/updateAssessment intentionally have no extraReducer
      // here: their response is the plain `Assessment` shape (see the thunks'
      // doc comments), not the richer `AssessmentDetail` `state.detail`
      // holds — callers (the Assessment form modal) consume the thunk's own
      // result via `.unwrap()`/matcher rather than reading it back from
      // state, and re-fetch `fetchAssessmentDetail`/`fetchAssessments` where
      // a refreshed view is actually needed.

      .addCase(fetchAssessmentEligibility.pending, (state) => {
        state.eligibility.status = 'loading';
        state.eligibility.error = null;
      })
      .addCase(fetchAssessmentEligibility.fulfilled, (state, action) => {
        state.eligibility.status = 'succeeded';
        state.eligibility.items = action.payload;
      })
      .addCase(fetchAssessmentEligibility.rejected, (state, action) => {
        state.eligibility.status = 'failed';
        state.eligibility.error = (action.payload as string | undefined) ?? 'Failed to fetch assessment eligibility';
      })

      .addCase(fetchLatestAssessmentValues.pending, (state) => {
        state.latestValues.status = 'loading';
        state.latestValues.error = null;
      })
      .addCase(fetchLatestAssessmentValues.fulfilled, (state, action) => {
        state.latestValues.status = 'succeeded';
        state.latestValues.data = action.payload;
      })
      .addCase(fetchLatestAssessmentValues.rejected, (state, action) => {
        state.latestValues.status = 'failed';
        state.latestValues.error = (action.payload as string | undefined) ?? 'Failed to fetch latest assessment values';
      })

      .addCase(discardAssessment.fulfilled, (state, action) => {
        state.list.items = state.list.items.filter((item) => item.id !== action.payload);
      });
  },
});

export const {
  setListFilter,
  setListTypeFilter,
  setListPage,
  setSearchTerm,
  clearSelectedAssessment,
  clearEligibility,
  clearLatestValues,
} = assessmentsSlice.actions;

export default assessmentsSlice.reducer;
