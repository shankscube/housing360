import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Client } from '@housing360/types';
import { apiClient } from '../../api/client';

interface ClientsState {
  items: Client[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ClientsState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchClients = createAsyncThunk('clients/fetchClients', async () => {
  const response = await apiClient.get<Client[]>('/clients');
  return response.success ? response.data : [];
});

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch clients';
      });
  },
});

export default clientsSlice.reducer;
