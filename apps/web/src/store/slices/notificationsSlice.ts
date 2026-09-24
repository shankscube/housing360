import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { NotificationsResponse, PendingReferralItem, StatusUpdateItem } from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface NotificationsState {
  pendingReferrals: PendingReferralItem[];
  statusUpdates: StatusUpdateItem[];
  status: RequestStatus;
  error: string | null;
}

const initialState: NotificationsState = {
  pendingReferrals: [],
  statusUpdates: [],
  status: 'idle',
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_arg: void, { rejectWithValue }) => {
    const response = await apiClient.get<NotificationsResponse>('/api/notifications');
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const markStatusUpdatesSeen = createAsyncThunk(
  'notifications/markStatusUpdatesSeen',
  async (_arg: void, { rejectWithValue }) => {
    const response = await apiClient.post<null>('/api/notifications/status-updates/seen');
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.pendingReferrals = action.payload.pendingReferrals;
        state.statusUpdates = action.payload.statusUpdates;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Failed to fetch notifications';
      })
      .addCase(markStatusUpdatesSeen.fulfilled, (state) => {
        // Optimistic clear — matches the spec's "clears the update from
        // future notification loads" scenario without waiting for a refetch.
        state.statusUpdates = [];
      });
  },
});

export default notificationsSlice.reducer;
