import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { DashboardSummary } from '@housing360/types';
import { apiClient } from '../../api/client';

interface DashboardState {
  summary: DashboardSummary | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  status: 'idle',
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk('dashboard/fetchSummary', async () => {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return response.success ? response.data : null;
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch dashboard summary';
      });
  },
});

export default dashboardSlice.reducer;
