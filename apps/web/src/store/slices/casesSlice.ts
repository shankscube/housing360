import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CaseCreateInput,
  CaseDetail,
  CaseFilter,
  CaseHudDataResponse,
  CaseKpiCounts,
  CaseListItem,
  CaseListQuery,
  CaseListResult,
  CaseUpdateInput,
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

interface CasesDetailState {
  case: CaseDetail | null;
  status: RequestStatus;
  error: string | null;
  hudData: CaseHudDataResponse | null;
  hudDataStatus: RequestStatus;
  hudDataError: string | null;
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
      });
  },
});

export const { setListFilter, setListPage, setSearchTerm, clearSelectedCase } = casesSlice.actions;

export default casesSlice.reducer;
