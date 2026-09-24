import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CeAssessmentDetail,
  CeAssessmentInput,
  CeQuestion,
  CeReferralInput,
  ClientSearchResultItem,
  PriorityQueueFilter,
  PriorityQueueQuery,
  PriorityQueueItem,
  Referral,
  RecommendedProgram,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AsyncSlice<T> {
  data: T;
  status: RequestStatus;
  error: string | null;
}

/** `'ALL'` represents "no quick filter active" — the priority queue endpoint
 * itself just omits `filter` in that case (see `buildPriorityQueueQueryString`). */
export type PriorityQueueFilterOption = PriorityQueueFilter | 'ALL';

interface PriorityQueueState {
  items: PriorityQueueItem[];
  total: number;
  page: number;
  pageSize: number;
  status: RequestStatus;
  error: string | null;
  filter: PriorityQueueFilterOption;
  search: string;
}

interface CoordinatedEntryState {
  client: ClientSearchResultItem | null;
  questions: AsyncSlice<CeQuestion[]>;
  assessment: AsyncSlice<CeAssessmentDetail | null>;
  recommendedPrograms: AsyncSlice<RecommendedProgram[]>;
  referral: AsyncSlice<Referral | null>;
  priorityQueue: PriorityQueueState;
}

const initialState: CoordinatedEntryState = {
  client: null,
  questions: { data: [], status: 'idle', error: null },
  assessment: { data: null, status: 'idle', error: null },
  recommendedPrograms: { data: [], status: 'idle', error: null },
  referral: { data: null, status: 'idle', error: null },
  priorityQueue: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    status: 'idle',
    error: null,
    filter: 'ALL',
    search: '',
  },
};

export const fetchCeQuestions = createAsyncThunk(
  'coordinatedEntry/fetchCeQuestions',
  async (_: void, { rejectWithValue }) => {
    const response = await apiClient.get<CeQuestion[]>('/api/ce/questions');
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const submitCeAssessment = createAsyncThunk(
  'coordinatedEntry/submitCeAssessment',
  async (input: CeAssessmentInput, { rejectWithValue }) => {
    const response = await apiClient.post<CeAssessmentDetail>('/api/ce/assessments', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchRecommendedPrograms = createAsyncThunk(
  'coordinatedEntry/fetchRecommendedPrograms',
  async (projectType: string, { rejectWithValue }) => {
    const response = await apiClient.get<RecommendedProgram[]>(
      `/api/ce/recommended-programs?projectType=${encodeURIComponent(projectType)}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const sendCeReferral = createAsyncThunk(
  'coordinatedEntry/sendCeReferral',
  async (input: CeReferralInput, { rejectWithValue }) => {
    const response = await apiClient.post<Referral>('/api/ce/referrals', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

function buildPriorityQueueQueryString(query: PriorityQueueQuery): string {
  const params = new URLSearchParams();
  if (query.filter) params.set('filter', query.filter);
  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchPriorityQueue = createAsyncThunk(
  'coordinatedEntry/fetchPriorityQueue',
  async (query: PriorityQueueQuery, { rejectWithValue }) => {
    const response = await apiClient.get<{
      items: PriorityQueueItem[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/ce/priority-queue${buildPriorityQueueQueryString(query)}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const coordinatedEntrySlice = createSlice({
  name: 'coordinatedEntry',
  initialState,
  reducers: {
    selectCoordinatedEntryClient(state, action: PayloadAction<ClientSearchResultItem | null>) {
      state.client = action.payload;
    },
    resetCoordinatedEntryFlow(state) {
      state.client = null;
      state.assessment = { ...initialState.assessment };
      state.recommendedPrograms = { ...initialState.recommendedPrograms };
      state.referral = { ...initialState.referral };
    },
    setPriorityQueueFilter(state, action: PayloadAction<PriorityQueueFilterOption>) {
      state.priorityQueue.filter = action.payload;
      state.priorityQueue.page = 1;
    },
    setPriorityQueueSearch(state, action: PayloadAction<string>) {
      state.priorityQueue.search = action.payload;
      state.priorityQueue.page = 1;
    },
    setPriorityQueuePage(state, action: PayloadAction<number>) {
      state.priorityQueue.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCeQuestions.pending, (state) => {
        state.questions.status = 'loading';
        state.questions.error = null;
      })
      .addCase(fetchCeQuestions.fulfilled, (state, action) => {
        state.questions.status = 'succeeded';
        state.questions.data = action.payload;
      })
      .addCase(fetchCeQuestions.rejected, (state, action) => {
        state.questions.status = 'failed';
        state.questions.error = (action.payload as string | undefined) ?? 'Failed to fetch Coordinated Entry questions';
      })

      .addCase(submitCeAssessment.pending, (state) => {
        state.assessment.status = 'loading';
        state.assessment.error = null;
      })
      .addCase(submitCeAssessment.fulfilled, (state, action) => {
        state.assessment.status = 'succeeded';
        state.assessment.data = action.payload;
      })
      .addCase(submitCeAssessment.rejected, (state, action) => {
        state.assessment.status = 'failed';
        state.assessment.error =
          (action.payload as string | undefined) ?? 'Failed to submit the Coordinated Entry assessment';
      })

      .addCase(fetchRecommendedPrograms.pending, (state) => {
        state.recommendedPrograms.status = 'loading';
        state.recommendedPrograms.error = null;
      })
      .addCase(fetchRecommendedPrograms.fulfilled, (state, action) => {
        state.recommendedPrograms.status = 'succeeded';
        state.recommendedPrograms.data = action.payload;
      })
      .addCase(fetchRecommendedPrograms.rejected, (state, action) => {
        state.recommendedPrograms.status = 'failed';
        state.recommendedPrograms.error =
          (action.payload as string | undefined) ?? 'Failed to fetch recommended programs';
      })

      .addCase(sendCeReferral.pending, (state) => {
        state.referral.status = 'loading';
        state.referral.error = null;
      })
      .addCase(sendCeReferral.fulfilled, (state, action) => {
        state.referral.status = 'succeeded';
        state.referral.data = action.payload;
      })
      .addCase(sendCeReferral.rejected, (state, action) => {
        state.referral.status = 'failed';
        state.referral.error = (action.payload as string | undefined) ?? 'Failed to send referral';
      })

      .addCase(fetchPriorityQueue.pending, (state) => {
        state.priorityQueue.status = 'loading';
        state.priorityQueue.error = null;
      })
      .addCase(fetchPriorityQueue.fulfilled, (state, action) => {
        state.priorityQueue.status = 'succeeded';
        state.priorityQueue.items = action.payload.items;
        state.priorityQueue.total = action.payload.total;
        state.priorityQueue.page = action.payload.page;
        state.priorityQueue.pageSize = action.payload.pageSize;
      })
      .addCase(fetchPriorityQueue.rejected, (state, action) => {
        state.priorityQueue.status = 'failed';
        state.priorityQueue.error =
          (action.payload as string | undefined) ?? 'Failed to fetch the priority queue';
      });
  },
});

export const {
  selectCoordinatedEntryClient,
  resetCoordinatedEntryFlow,
  setPriorityQueueFilter,
  setPriorityQueueSearch,
  setPriorityQueuePage,
} = coordinatedEntrySlice.actions;

export default coordinatedEntrySlice.reducer;
