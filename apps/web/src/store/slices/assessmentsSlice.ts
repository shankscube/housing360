import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AssessmentDetail,
  AssessmentFilter,
  AssessmentInput,
  AssessmentKpiCounts,
  AssessmentListItem,
  AssessmentListQuery,
  AssessmentListResult,
  AssessmentTypeFilter,
  AssessmentUpdateInput,
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

interface AssessmentsState {
  list: AssessmentsListState;
  detail: AssessmentsDetailState;
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

export const createAssessment = createAsyncThunk(
  'assessments/createAssessment',
  async (input: AssessmentInput & { status?: string }, { rejectWithValue }) => {
    const response = await apiClient.post<AssessmentDetail>('/api/assessments', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const updateAssessment = createAsyncThunk(
  'assessments/updateAssessment',
  async ({ id, input }: { id: string; input: AssessmentUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<AssessmentDetail>(`/api/assessments/${id}`, input);
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

      .addCase(createAssessment.fulfilled, (state, action) => {
        state.detail.assessment = action.payload;
      })
      .addCase(updateAssessment.fulfilled, (state, action) => {
        state.detail.assessment = action.payload;
      });
  },
});

export const { setListFilter, setListTypeFilter, setListPage, setSearchTerm, clearSelectedAssessment } =
  assessmentsSlice.actions;

export default assessmentsSlice.reducer;
