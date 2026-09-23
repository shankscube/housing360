import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  Client,
  ClientFilter,
  ClientIntakeInput,
  ClientListItem,
  ClientListQuery,
  ClientListResult,
  CreateClientResult,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ClientsListState {
  items: ClientListItem[];
  total: number;
  page: number;
  pageSize: number;
  filter: ClientFilter;
  search: string;
  status: RequestStatus;
  error: string | null;
}

interface ClientsDetailState {
  client: Client | null;
  status: RequestStatus;
  error: string | null;
}

interface ClientsIntakeFormState {
  candidates: ClientListItem[];
  status: 'idle' | 'submitting' | 'duplicates_found' | 'succeeded' | 'failed';
  error: string | null;
}

interface ClientsState {
  list: ClientsListState;
  detail: ClientsDetailState;
  intakeForm: ClientsIntakeFormState;
}

const initialState: ClientsState = {
  list: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filter: 'all',
    search: '',
    status: 'idle',
    error: null,
  },
  detail: {
    client: null,
    status: 'idle',
    error: null,
  },
  intakeForm: {
    candidates: [],
    status: 'idle',
    error: null,
  },
};

function buildListQueryString(query: ClientListQuery): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  if (query.filter !== undefined) params.set('filter', query.filter);
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (query: ClientListQuery, { rejectWithValue }) => {
    const response = await apiClient.get<ClientListResult>(`/api/clients${buildListQueryString(query)}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchClientById = createAsyncThunk(
  'clients/fetchClientById',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.get<Client>(`/api/clients/${id}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (input: ClientIntakeInput, { rejectWithValue }) => {
    const response = await apiClient.post<CreateClientResult>('/api/clients', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setListFilter(state, action: PayloadAction<ClientFilter>) {
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
    selectClient(state, action: PayloadAction<Client>) {
      state.detail.client = action.payload;
      state.detail.status = 'succeeded';
      state.detail.error = null;
    },
    clearSelectedClient(state) {
      state.detail = { ...initialState.detail };
    },
    setDuplicateCandidates(state, action: PayloadAction<ClientListItem[]>) {
      state.intakeForm.candidates = action.payload;
      state.intakeForm.status = 'duplicates_found';
    },
    resetIntakeForm(state) {
      state.intakeForm = { ...initialState.intakeForm };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.list.status = 'loading';
        state.list.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.items = action.payload.items;
        state.list.total = action.payload.total;
        state.list.page = action.payload.page;
        state.list.pageSize = action.payload.pageSize;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.list.status = 'failed';
        state.list.error = (action.payload as string | undefined) ?? 'Failed to fetch clients';
      })

      .addCase(fetchClientById.pending, (state) => {
        state.detail.status = 'loading';
        state.detail.error = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.client = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.detail.status = 'failed';
        state.detail.error = (action.payload as string | undefined) ?? 'Failed to fetch client';
      })

      .addCase(createClient.pending, (state) => {
        state.intakeForm.status = 'submitting';
        state.intakeForm.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        if (action.payload.status === 'duplicates_found') {
          state.intakeForm.status = 'duplicates_found';
          state.intakeForm.candidates = action.payload.candidates;
        } else {
          state.intakeForm.status = 'succeeded';
          state.intakeForm.candidates = [];
        }
      })
      .addCase(createClient.rejected, (state, action) => {
        state.intakeForm.status = 'failed';
        state.intakeForm.error = (action.payload as string | undefined) ?? 'Failed to create client';
      });
  },
});

export const {
  setListFilter,
  setListPage,
  setSearchTerm,
  selectClient,
  clearSelectedClient,
  setDuplicateCandidates,
  resetIntakeForm,
} = clientsSlice.actions;

export default clientsSlice.reducer;
