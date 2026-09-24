import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { HomeDashboardResponse } from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface DashboardState {
  home: HomeDashboardResponse | null;
  status: RequestStatus;
  error: string | null;
}

const initialState: DashboardState = {
  home: null,
  status: 'idle',
  error: null,
};

export const fetchHomeDashboard = createAsyncThunk(
  'dashboard/fetchHomeDashboard',
  async (_arg: void, { rejectWithValue }) => {
    const response = await apiClient.get<HomeDashboardResponse>('/api/dashboard/home');
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeDashboard.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHomeDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.home = action.payload;
      })
      .addCase(fetchHomeDashboard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Failed to fetch the Home dashboard';
      });
  },
});

export default dashboardSlice.reducer;
