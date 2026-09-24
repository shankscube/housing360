import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  Bed,
  BedAssignment,
  BedNight,
  Benefit,
  BenefitAssignmentDetail,
  ProgramEnrollment,
  ServiceDisbursement,
  ServiceDisbursementInput,
  ServiceDisbursementUpdateInput,
} from '@housing360/types';
import { apiClient, getClientEnrollments } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ServicesState {
  enrollments: ProgramEnrollment[];
  enrollmentsStatus: RequestStatus;
  /** Keyed by enrollment id — each enrollment's assigned services, fetched on expand. */
  servicesByEnrollment: Record<string, BenefitAssignmentDetail[]>;
  assignableBenefitsByEnrollment: Record<string, Benefit[]>;
  availableBeds: Bed[];
  availableBedsStatus: RequestStatus;
  bedNightsByAssignment: Record<string, BedNight[]>;
}

const initialState: ServicesState = {
  enrollments: [],
  enrollmentsStatus: 'idle',
  servicesByEnrollment: {},
  assignableBenefitsByEnrollment: {},
  availableBeds: [],
  availableBedsStatus: 'idle',
  bedNightsByAssignment: {},
};

export const fetchClientEnrollmentsForServices = createAsyncThunk(
  'services/fetchClientEnrollments',
  async (clientId: string, { rejectWithValue }) => {
    const response = await getClientEnrollments(clientId);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchServicesByEnrollment = createAsyncThunk(
  'services/fetchByEnrollment',
  async (enrollmentId: string, { rejectWithValue }) => {
    const response = await apiClient.get<BenefitAssignmentDetail[]>(`/api/enrollments/${enrollmentId}/services`);
    if (!response.success) return rejectWithValue(response.message);
    return { enrollmentId, services: response.data };
  }
);

export const fetchAssignableBenefits = createAsyncThunk(
  'services/fetchAssignableBenefits',
  async (enrollmentId: string, { rejectWithValue }) => {
    const response = await apiClient.get<Benefit[]>(`/api/enrollments/${enrollmentId}/assignable-benefits`);
    if (!response.success) return rejectWithValue(response.message);
    return { enrollmentId, benefits: response.data };
  }
);

export const assignService = createAsyncThunk(
  'services/assign',
  async ({ enrollmentId, benefitId }: { enrollmentId: string; benefitId: string }, { rejectWithValue }) => {
    const response = await apiClient.post<BenefitAssignmentDetail>(`/api/enrollments/${enrollmentId}/services`, {
      benefitId,
    });
    if (!response.success) return rejectWithValue(response.message);
    return { enrollmentId, assignment: response.data };
  }
);

export const createDisbursement = createAsyncThunk(
  'services/createDisbursement',
  async (
    { benefitAssignmentId, enrollmentId, input }: { benefitAssignmentId: string; enrollmentId: string; input: ServiceDisbursementInput },
    { rejectWithValue }
  ) => {
    const response = await apiClient.post<ServiceDisbursement>(
      `/api/benefit-assignments/${benefitAssignmentId}/disbursements`,
      input
    );
    if (!response.success) return rejectWithValue(response.message);
    return { enrollmentId, benefitAssignmentId, disbursement: response.data };
  }
);

export const updateDisbursement = createAsyncThunk(
  'services/updateDisbursement',
  async (
    {
      id,
      enrollmentId,
      benefitAssignmentId,
      input,
    }: { id: string; enrollmentId: string; benefitAssignmentId: string; input: ServiceDisbursementUpdateInput },
    { rejectWithValue }
  ) => {
    const response = await apiClient.patch<ServiceDisbursement>(`/api/disbursements/${id}`, input);
    if (!response.success) return rejectWithValue(response.message);
    return { enrollmentId, benefitAssignmentId, disbursement: response.data };
  }
);

export const fetchAvailableBeds = createAsyncThunk(
  'services/fetchAvailableBeds',
  async ({ programId, date, shift }: { programId: string; date: string; shift: string }, { rejectWithValue }) => {
    const response = await apiClient.get<Bed[]>(
      `/api/programs/${encodeURIComponent(programId)}/beds/available?date=${date}&shift=${shift}`
    );
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const assignBed = createAsyncThunk(
  'services/assignBed',
  async (
    { programEnrollmentId, bedId, shift, date }: { programEnrollmentId: string; bedId: string; shift: string; date?: string },
    { rejectWithValue }
  ) => {
    const response = await apiClient.post<BedAssignment>('/api/bed-assignments', {
      programEnrollmentId,
      bedId,
      shift,
      date,
    });
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchBedNights = createAsyncThunk(
  'services/fetchBedNights',
  async (bedAssignmentId: string, { rejectWithValue }) => {
    const response = await apiClient.get<BedNight[]>(`/api/bed-assignments/${bedAssignmentId}/nights`);
    if (!response.success) return rejectWithValue(response.message);
    return { bedAssignmentId, nights: response.data };
  }
);

export const logBedNight = createAsyncThunk(
  'services/logBedNight',
  async (
    { bedAssignmentId, logDate, shift, status }: { bedAssignmentId: string; logDate: string; shift: string; status: string },
    { rejectWithValue }
  ) => {
    const response = await apiClient.post<BedNight>('/api/bed-nights', { bedAssignmentId, logDate, shift, status });
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const updateBedNight = createAsyncThunk(
  'services/updateBedNight',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    const response = await apiClient.patch<BedNight>(`/api/bed-nights/${id}`, { status });
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

function upsertDisbursement(
  state: ServicesState,
  enrollmentId: string,
  benefitAssignmentId: string,
  disbursement: ServiceDisbursement
) {
  const services = state.servicesByEnrollment[enrollmentId];
  if (!services) return;
  state.servicesByEnrollment[enrollmentId] = services.map((service) =>
    service.id === benefitAssignmentId
      ? {
          ...service,
          disbursements: service.disbursements.some((d) => d.id === disbursement.id)
            ? service.disbursements.map((d) => (d.id === disbursement.id ? disbursement : d))
            : [disbursement, ...service.disbursements],
        }
      : service
  );
}

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientEnrollmentsForServices.pending, (state) => {
        state.enrollmentsStatus = 'loading';
      })
      .addCase(fetchClientEnrollmentsForServices.fulfilled, (state, action) => {
        state.enrollmentsStatus = 'succeeded';
        state.enrollments = action.payload;
      })
      .addCase(fetchClientEnrollmentsForServices.rejected, (state) => {
        state.enrollmentsStatus = 'failed';
      })

      .addCase(fetchServicesByEnrollment.fulfilled, (state, action) => {
        state.servicesByEnrollment[action.payload.enrollmentId] = action.payload.services;
      })
      .addCase(fetchAssignableBenefits.fulfilled, (state, action) => {
        state.assignableBenefitsByEnrollment[action.payload.enrollmentId] = action.payload.benefits;
      })
      .addCase(assignService.fulfilled, (state, action) => {
        const existing = state.servicesByEnrollment[action.payload.enrollmentId] ?? [];
        state.servicesByEnrollment[action.payload.enrollmentId] = [action.payload.assignment, ...existing];
      })

      .addCase(createDisbursement.fulfilled, (state, action) => {
        upsertDisbursement(state, action.payload.enrollmentId, action.payload.benefitAssignmentId, action.payload.disbursement);
      })
      .addCase(updateDisbursement.fulfilled, (state, action) => {
        upsertDisbursement(state, action.payload.enrollmentId, action.payload.benefitAssignmentId, action.payload.disbursement);
      })

      .addCase(fetchAvailableBeds.pending, (state) => {
        state.availableBedsStatus = 'loading';
      })
      .addCase(fetchAvailableBeds.fulfilled, (state, action) => {
        state.availableBedsStatus = 'succeeded';
        state.availableBeds = action.payload;
      })
      .addCase(fetchAvailableBeds.rejected, (state) => {
        state.availableBedsStatus = 'failed';
      })

      .addCase(fetchBedNights.fulfilled, (state, action) => {
        state.bedNightsByAssignment[action.payload.bedAssignmentId] = action.payload.nights;
      })
      .addCase(logBedNight.fulfilled, (state, action) => {
        const existing = state.bedNightsByAssignment[action.payload.bedAssignmentId] ?? [];
        state.bedNightsByAssignment[action.payload.bedAssignmentId] = existing.some((n) => n.id === action.payload.id)
          ? existing.map((n) => (n.id === action.payload.id ? action.payload : n))
          : [action.payload, ...existing];
      })
      .addCase(updateBedNight.fulfilled, (state, action) => {
        const assignmentId = action.payload.bedAssignmentId;
        const existing = state.bedNightsByAssignment[assignmentId] ?? [];
        state.bedNightsByAssignment[assignmentId] = existing.map((n) =>
          n.id === action.payload.id ? action.payload : n
        );
      });
  },
});

export default servicesSlice.reducer;
