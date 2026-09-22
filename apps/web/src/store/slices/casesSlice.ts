import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Case } from '@housing360/types';
import { apiClient } from '../../api/client';

interface CasesState {
  items: Case[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CasesState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchCases = createAsyncThunk('cases/fetchCases', async () => {
  const response = await apiClient.get<Case[]>('/cases');
  return response.success ? response.data : [];
});

const casesSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCases.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch cases';
      });
  },
});

export default casesSlice.reducer;
