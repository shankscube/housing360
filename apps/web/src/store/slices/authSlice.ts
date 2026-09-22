import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AuthenticatedUser } from '@housing360/types';
import { apiClient } from '../../api/client';

interface AuthState {
  currentUser: AuthenticatedUser | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  /** Whether the initial session check (fetchCurrentUser on app load) has completed. */
  initialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  currentUser: null,
  status: 'idle',
  initialized: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    const response = await apiClient.post<AuthenticatedUser>('/auth/login', credentials);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await apiClient.post('/auth/logout');
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  const response = await apiClient.get<AuthenticatedUser>('/auth/me');
  return response.success ? response.data : null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUser = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Login failed';
      })
      .addCase(logout.fulfilled, (state) => {
        state.currentUser = null;
        state.status = 'idle';
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.initialized = true;
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = 'failed';
        state.initialized = true;
        state.currentUser = null;
      });
  },
});

export default authSlice.reducer;
