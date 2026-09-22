import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { CoordinatedEntryEntry } from '@housing360/types';
import { apiClient } from '../../api/client';

interface CoordinatedEntryState {
  items: CoordinatedEntryEntry[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CoordinatedEntryState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchCoordinatedEntryEntries = createAsyncThunk(
  'coordinatedEntry/fetchEntries',
  async () => {
    const response = await apiClient.get<CoordinatedEntryEntry[]>('/coordinated-entry');
    return response.success ? response.data : [];
  }
);

const coordinatedEntrySlice = createSlice({
  name: 'coordinatedEntry',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoordinatedEntryEntries.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCoordinatedEntryEntries.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCoordinatedEntryEntries.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch coordinated entry entries';
      });
  },
});

export default coordinatedEntrySlice.reducer;
