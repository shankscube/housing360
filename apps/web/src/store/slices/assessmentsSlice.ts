import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Assessment } from '@housing360/types';
import { apiClient } from '../../api/client';

interface AssessmentsState {
  items: Assessment[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AssessmentsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchAssessments = createAsyncThunk('assessments/fetchAssessments', async () => {
  const response = await apiClient.get<Assessment[]>('/assessments');
  return response.success ? response.data : [];
});

const assessmentsSlice = createSlice({
  name: 'assessments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssessments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAssessments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch assessments';
      });
  },
});

export default assessmentsSlice.reducer;
