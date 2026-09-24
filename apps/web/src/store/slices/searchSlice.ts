import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { SearchResponse } from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface SearchState {
  query: string;
  results: SearchResponse | null;
  status: RequestStatus;
  error: string | null;
}

const initialState: SearchState = {
  query: '',
  results: null,
  status: 'idle',
  error: null,
};

const EMPTY_SEARCH_RESPONSE: SearchResponse = {
  groups: {
    clients: [],
    cases: [],
    referrals: [],
    tasks: [],
    assessments: [],
  },
};

/**
 * Below the 2-character minimum (global-search spec's "frontend does not
 * call the API below the threshold" requirement), this short-circuits
 * before ever touching the network and resolves to an empty-groups shape so
 * the reducer/UI always has a consistent result to render (never "no
 * matches" flashing from a `null` state).
 */
export const runSearch = createAsyncThunk('search/runSearch', async (query: string) => {
  if (query.trim().length < 2) {
    return EMPTY_SEARCH_RESPONSE;
  }
  const response = await apiClient.get<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.success) {
    throw new Error(response.message);
  }
  return response.data;
});

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery(state, action: { payload: string }) {
      state.query = action.payload;
    },
    clearResults(state) {
      state.results = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runSearch.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(runSearch.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload;
      })
      .addCase(runSearch.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Search failed';
      });
  },
});

export const { setQuery, clearResults } = searchSlice.actions;
export default searchSlice.reducer;
