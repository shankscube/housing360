import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CaseCreateInput,
  CaseDetail,
  CaseFilter,
  CaseFollowUpInput,
  CaseHudDataResponse,
  CaseKpiCounts,
  CaseListItem,
  CaseListQuery,
  CaseListResult,
  CaseUpdateInput,
  InteractionSummary,
  InteractionSummaryCreateInput,
  InteractionSummaryDetail,
  InteractionSummaryUpdateInput,
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CasesListState {
  items: CaseListItem[];
  total: number;
  page: number;
  pageSize: number;
  filter: CaseFilter;
  search: string;
  kpis: CaseKpiCounts | null;
  status: RequestStatus;
  error: string | null;
}

interface CaseInteractionSummariesState {
  items: InteractionSummary[];
  status: RequestStatus;
  error: string | null;
  search: string;
  selected: InteractionSummaryDetail | null;
  selectedStatus: RequestStatus;
}

interface CaseTasksState {
  items: Task[];
  status: RequestStatus;
  error: string | null;
}

interface CasesDetailState {
  case: CaseDetail | null;
  status: RequestStatus;
  error: string | null;
  hudData: CaseHudDataResponse | null;
  hudDataStatus: RequestStatus;
  hudDataError: string | null;
  interactionSummaries: CaseInteractionSummariesState;
  tasks: CaseTasksState;
}

interface CasesState {
  list: CasesListState;
  detail: CasesDetailState;
}

const initialState: CasesState = {
  list: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filter: 'all',
    search: '',
    kpis: null,
    status: 'idle',
    error: null,
  },
  detail: {
    case: null,
    status: 'idle',
    error: null,
    hudData: null,
    hudDataStatus: 'idle',
    hudDataError: null,
    interactionSummaries: {
      items: [],
      status: 'idle',
      error: null,
      search: '',
      selected: null,
      selectedStatus: 'idle',
    },
    tasks: {
      items: [],
      status: 'idle',
      error: null,
    },
  },
};

function buildListQueryString(query: CaseListQuery): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  if (query.filter !== undefined) params.set('filter', query.filter);
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchCases = createAsyncThunk(
  'cases/fetchCases',
  async (query: CaseListQuery, { rejectWithValue }) => {
    const response = await apiClient.get<CaseListResult>(`/api/cases${buildListQueryString(query)}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchCaseDetail = createAsyncThunk(
  'cases/fetchCaseDetail',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.get<CaseDetail>(`/api/cases/${id}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const createCase = createAsyncThunk(
  'cases/createCase',
  async (input: CaseCreateInput, { rejectWithValue }) => {
    const response = await apiClient.post<CaseDetail>('/api/cases', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const updateCase = createAsyncThunk(
  'cases/updateCase',
  async ({ id, input }: { id: string; input: CaseUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<CaseDetail>(`/api/cases/${id}`, input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchCaseHudData = createAsyncThunk(
  'cases/fetchCaseHudData',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.get<CaseHudDataResponse>(`/api/cases/${id}/hud-data`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const setCaseFollowUp = createAsyncThunk(
  'cases/setCaseFollowUp',
  async ({ id, input }: { id: string; input: CaseFollowUpInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<CaseDetail>(`/api/cases/${id}/follow-up`, input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchCaseInteractionSummaries = createAsyncThunk(
  'cases/fetchCaseInteractionSummaries',
  async ({ caseId, search }: { caseId: string; search?: string }, { rejectWithValue }) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await apiClient.get<InteractionSummary[]>(
      `/api/cases/${caseId}/interaction-summaries${qs}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const createCaseInteractionSummary = createAsyncThunk(
  'cases/createCaseInteractionSummary',
  async (input: InteractionSummaryCreateInput, { rejectWithValue }) => {
    const response = await apiClient.post<InteractionSummary>('/api/interaction-summaries', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const updateCaseInteractionSummary = createAsyncThunk(
  'cases/updateCaseInteractionSummary',
  async (
    { id, input }: { id: string; input: InteractionSummaryUpdateInput },
    { rejectWithValue }
  ) => {
    const response = await apiClient.patch<InteractionSummary>(`/api/interaction-summaries/${id}`, input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchInteractionSummaryDetail = createAsyncThunk(
  'cases/fetchInteractionSummaryDetail',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.get<InteractionSummaryDetail>(`/api/interaction-summaries/${id}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchCaseTasks = createAsyncThunk(
  'cases/fetchCaseTasks',
  async (caseId: string, { rejectWithValue }) => {
    const response = await apiClient.get<Task[]>(`/api/cases/${caseId}/tasks`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const createCaseTask = createAsyncThunk(
  'cases/createCaseTask',
  async (input: TaskCreateInput, { rejectWithValue }) => {
    const response = await apiClient.post<Task>('/api/tasks', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const updateCaseTask = createAsyncThunk(
  'cases/updateCaseTask',
  async ({ id, input }: { id: string; input: TaskUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<Task>(`/api/tasks/${id}`, input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const updateCaseTaskStatus = createAsyncThunk(
  'cases/updateCaseTaskStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    const response = await apiClient.patch<Task>(`/api/tasks/${id}/status`, { status });
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    setListFilter(state, action: PayloadAction<CaseFilter>) {
      state.list.filter = action.payload;
      state.list.page = 1;
    },
    setListPage(state, action: PayloadAction<number>) {
      state.list.page = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.list.search = action.payload;
      state.list.page = 1;
    },
    clearSelectedCase(state) {
      state.detail = { ...initialState.detail };
    },
    setInteractionSummarySearch(state, action: PayloadAction<string>) {
      state.detail.interactionSummaries.search = action.payload;
    },
    clearSelectedInteractionSummary(state) {
      state.detail.interactionSummaries.selected = null;
      state.detail.interactionSummaries.selectedStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending, (state) => {
        state.list.status = 'loading';
        state.list.error = null;
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.items = action.payload.items;
        state.list.total = action.payload.total;
        state.list.page = action.payload.page;
        state.list.pageSize = action.payload.pageSize;
        state.list.kpis = action.payload.kpis;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.list.status = 'failed';
        state.list.error = (action.payload as string | undefined) ?? 'Failed to fetch cases';
      })

      .addCase(fetchCaseDetail.pending, (state) => {
        state.detail.status = 'loading';
        state.detail.error = null;
      })
      .addCase(fetchCaseDetail.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.case = action.payload;
      })
      .addCase(fetchCaseDetail.rejected, (state, action) => {
        state.detail.status = 'failed';
        state.detail.error = (action.payload as string | undefined) ?? 'Failed to fetch case';
      })

      .addCase(createCase.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.case = action.payload;
      })

      .addCase(updateCase.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.case = action.payload;
      })

      .addCase(fetchCaseHudData.pending, (state) => {
        state.detail.hudDataStatus = 'loading';
        state.detail.hudDataError = null;
      })
      .addCase(fetchCaseHudData.fulfilled, (state, action) => {
        state.detail.hudDataStatus = 'succeeded';
        state.detail.hudData = action.payload;
      })
      .addCase(fetchCaseHudData.rejected, (state, action) => {
        state.detail.hudDataStatus = 'failed';
        state.detail.hudDataError = (action.payload as string | undefined) ?? 'Failed to fetch HUD Data checklist';
      })

      .addCase(setCaseFollowUp.fulfilled, (state, action) => {
        state.detail.case = action.payload;
      })

      .addCase(fetchCaseInteractionSummaries.pending, (state) => {
        state.detail.interactionSummaries.status = 'loading';
        state.detail.interactionSummaries.error = null;
      })
      .addCase(fetchCaseInteractionSummaries.fulfilled, (state, action) => {
        state.detail.interactionSummaries.status = 'succeeded';
        state.detail.interactionSummaries.items = action.payload;
      })
      .addCase(fetchCaseInteractionSummaries.rejected, (state, action) => {
        state.detail.interactionSummaries.status = 'failed';
        state.detail.interactionSummaries.error =
          (action.payload as string | undefined) ?? 'Failed to fetch interaction summaries';
      })

      .addCase(fetchInteractionSummaryDetail.pending, (state) => {
        state.detail.interactionSummaries.selectedStatus = 'loading';
      })
      .addCase(fetchInteractionSummaryDetail.fulfilled, (state, action) => {
        state.detail.interactionSummaries.selectedStatus = 'succeeded';
        state.detail.interactionSummaries.selected = action.payload;
      })
      .addCase(fetchInteractionSummaryDetail.rejected, (state) => {
        state.detail.interactionSummaries.selectedStatus = 'failed';
      })

      .addCase(fetchCaseTasks.pending, (state) => {
        state.detail.tasks.status = 'loading';
        state.detail.tasks.error = null;
      })
      .addCase(fetchCaseTasks.fulfilled, (state, action) => {
        state.detail.tasks.status = 'succeeded';
        state.detail.tasks.items = action.payload;
      })
      .addCase(fetchCaseTasks.rejected, (state, action) => {
        state.detail.tasks.status = 'failed';
        state.detail.tasks.error = (action.payload as string | undefined) ?? 'Failed to fetch tasks';
      })

      .addCase(createCaseTask.fulfilled, (state, action) => {
        state.detail.tasks.items = [action.payload, ...state.detail.tasks.items];
      })
      .addCase(updateCaseTask.fulfilled, (state, action) => {
        state.detail.tasks.items = state.detail.tasks.items.map((task) =>
          task.id === action.payload.id ? action.payload : task
        );
      })
      .addCase(updateCaseTaskStatus.fulfilled, (state, action) => {
        state.detail.tasks.items = state.detail.tasks.items.map((task) =>
          task.id === action.payload.id ? action.payload : task
        );
        if (state.detail.interactionSummaries.selected) {
          state.detail.interactionSummaries.selected.tasks =
            state.detail.interactionSummaries.selected.tasks.map((task) =>
              task.id === action.payload.id ? action.payload : task
            );
        }
      });
  },
});

export const {
  setListFilter,
  setListPage,
  setSearchTerm,
  clearSelectedCase,
  setInteractionSummarySearch,
  clearSelectedInteractionSummary,
} = casesSlice.actions;

export default casesSlice.reducer;
