import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AppointmentItem } from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CalendarState {
  appointments: AppointmentItem[];
  status: RequestStatus;
  error: string | null;
}

const initialState: CalendarState = {
  appointments: [],
  status: 'idle',
  error: null,
};

export const fetchAppointments = createAsyncThunk(
  'calendar/fetchAppointments',
  async ({ from, to }: { from: string; to: string }, { rejectWithValue }) => {
    const response = await apiClient.get<AppointmentItem[]>(
      `/api/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppointments.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string | undefined) ?? 'Failed to fetch appointments';
      });
  },
});

export default calendarSlice.reducer;
