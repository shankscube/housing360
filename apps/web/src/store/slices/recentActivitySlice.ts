import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RecentActivityFilter, RecentActivityItem, RecentActivityResponse } from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface RecentActivityState {
  items: RecentActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  filter: RecentActivityFilter;
  status: RequestStatus;
  error: string | null;
}

const initialState: RecentActivityState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filter: 'all',
  status: 'idle',
  error: null,
};

interface FetchRecentActivityQuery {
  type?: RecentActivityFilter;
  page?: number;
  pageSize?: number;
}

function buildListQueryString(query: FetchRecentActivityQuery): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  if (query.type !== undefined) params.set('type', query.type);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchRecentActivity = createAsyncThunk(
  'recentActivity/fetchRecentActivity',
  async (query: FetchRecentActivityQuery, { rejectWithValue }) => {
    const response = await apiClient.get<RecentActivityResponse>(
      `/api/recent-activity${buildListQueryString(query)}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const recentActivitySlice = createSlice({
  name: 'recentActivity',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<RecentActivityFilter>) {
      state.filter = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Failed to fetch recent activity';
      });
  },
});

export const { setFilter, setPage } = recentActivitySlice.actions;

export default recentActivitySlice.reducer;
