import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ClientSearchResultItem,
  CoordinatedEntryReferralInput,
  PartnerAgency,
  PrioritizationListItem,
  PrioritizationListQuery,
  Program,
  Referral,
  VulnerabilityAssessment,
  VulnerabilityAssessmentInput,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface AsyncSlice<T> {
  data: T;
  status: RequestStatus;
  error: string | null;
}

interface CoordinatedEntryState {
  client: ClientSearchResultItem | null;
  vulnerabilityAssessment: AsyncSlice<VulnerabilityAssessment | null>;
  recommendedPrograms: AsyncSlice<Program[]>;
  partnerAgencies: AsyncSlice<PartnerAgency[]>;
  referral: AsyncSlice<Referral | null>;
  prioritizationList: {
    items: PrioritizationListItem[];
    status: RequestStatus;
    error: string | null;
    filters: PrioritizationListQuery;
  };
}

const initialState: CoordinatedEntryState = {
  client: null,
  vulnerabilityAssessment: { data: null, status: 'idle', error: null },
  recommendedPrograms: { data: [], status: 'idle', error: null },
  partnerAgencies: { data: [], status: 'idle', error: null },
  referral: { data: null, status: 'idle', error: null },
  prioritizationList: {
    items: [],
    status: 'idle',
    error: null,
    filters: {
      topFive: false,
      veteran: false,
      unaccompaniedYouth: false,
      safetyAlert: false,
      awaitingReferral: false,
    },
  },
};

export const submitVulnerabilityAssessment = createAsyncThunk(
  'coordinatedEntry/submitVulnerabilityAssessment',
  async (input: VulnerabilityAssessmentInput, { rejectWithValue }) => {
    const response = await apiClient.post<VulnerabilityAssessment>(
      '/api/coordinated-entry/vulnerability-assessment',
      input
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchRecommendedPrograms = createAsyncThunk(
  'coordinatedEntry/fetchRecommendedPrograms',
  async (clientId: string, { rejectWithValue }) => {
    const response = await apiClient.get<Program[]>(
      `/api/coordinated-entry/recommended-programs?clientId=${encodeURIComponent(clientId)}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchPartnerAgencies = createAsyncThunk(
  'coordinatedEntry/fetchPartnerAgencies',
  async (domain: string | undefined, { rejectWithValue }) => {
    const qs = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    const response = await apiClient.get<PartnerAgency[]>(`/api/coordinated-entry/partner-agencies${qs}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const sendCoordinatedEntryReferral = createAsyncThunk(
  'coordinatedEntry/sendReferral',
  async (input: CoordinatedEntryReferralInput, { rejectWithValue }) => {
    const response = await apiClient.post<Referral>('/api/coordinated-entry/referrals', input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

function buildPrioritizationQueryString(query: PrioritizationListQuery): string {
  const params = new URLSearchParams();
  if (query.topFive) params.set('topFive', 'true');
  if (query.veteran) params.set('veteran', 'true');
  if (query.unaccompaniedYouth) params.set('unaccompaniedYouth', 'true');
  if (query.safetyAlert) params.set('safetyAlert', 'true');
  if (query.awaitingReferral) params.set('awaitingReferral', 'true');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchPrioritizationList = createAsyncThunk(
  'coordinatedEntry/fetchPrioritizationList',
  async (query: PrioritizationListQuery, { rejectWithValue }) => {
    const response = await apiClient.get<PrioritizationListItem[]>(
      `/api/coordinated-entry/prioritization-list${buildPrioritizationQueryString(query)}`
    );
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const coordinatedEntrySlice = createSlice({
  name: 'coordinatedEntry',
  initialState,
  reducers: {
    selectCoordinatedEntryClient(state, action: PayloadAction<ClientSearchResultItem | null>) {
      state.client = action.payload;
    },
    resetCoordinatedEntryFlow(state) {
      state.client = null;
      state.vulnerabilityAssessment = { ...initialState.vulnerabilityAssessment };
      state.recommendedPrograms = { ...initialState.recommendedPrograms };
      state.partnerAgencies = { ...initialState.partnerAgencies };
      state.referral = { ...initialState.referral };
    },
    togglePrioritizationFilter(
      state,
      action: PayloadAction<keyof PrioritizationListQuery>
    ) {
      const key = action.payload;
      state.prioritizationList.filters[key] = !state.prioritizationList.filters[key];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitVulnerabilityAssessment.pending, (state) => {
        state.vulnerabilityAssessment.status = 'loading';
        state.vulnerabilityAssessment.error = null;
      })
      .addCase(submitVulnerabilityAssessment.fulfilled, (state, action) => {
        state.vulnerabilityAssessment.status = 'succeeded';
        state.vulnerabilityAssessment.data = action.payload;
      })
      .addCase(submitVulnerabilityAssessment.rejected, (state, action) => {
        state.vulnerabilityAssessment.status = 'failed';
        state.vulnerabilityAssessment.error =
          (action.payload as string | undefined) ?? 'Failed to submit vulnerability assessment';
      })

      .addCase(fetchRecommendedPrograms.pending, (state) => {
        state.recommendedPrograms.status = 'loading';
        state.recommendedPrograms.error = null;
      })
      .addCase(fetchRecommendedPrograms.fulfilled, (state, action) => {
        state.recommendedPrograms.status = 'succeeded';
        state.recommendedPrograms.data = action.payload;
      })
      .addCase(fetchRecommendedPrograms.rejected, (state, action) => {
        state.recommendedPrograms.status = 'failed';
        state.recommendedPrograms.error =
          (action.payload as string | undefined) ?? 'Failed to fetch recommended programs';
      })

      .addCase(fetchPartnerAgencies.pending, (state) => {
        state.partnerAgencies.status = 'loading';
        state.partnerAgencies.error = null;
      })
      .addCase(fetchPartnerAgencies.fulfilled, (state, action) => {
        state.partnerAgencies.status = 'succeeded';
        state.partnerAgencies.data = action.payload;
      })
      .addCase(fetchPartnerAgencies.rejected, (state, action) => {
        state.partnerAgencies.status = 'failed';
        state.partnerAgencies.error = (action.payload as string | undefined) ?? 'Failed to fetch partner agencies';
      })

      .addCase(sendCoordinatedEntryReferral.pending, (state) => {
        state.referral.status = 'loading';
        state.referral.error = null;
      })
      .addCase(sendCoordinatedEntryReferral.fulfilled, (state, action) => {
        state.referral.status = 'succeeded';
        state.referral.data = action.payload;
      })
      .addCase(sendCoordinatedEntryReferral.rejected, (state, action) => {
        state.referral.status = 'failed';
        state.referral.error = (action.payload as string | undefined) ?? 'Failed to send referral';
      })

      .addCase(fetchPrioritizationList.pending, (state) => {
        state.prioritizationList.status = 'loading';
        state.prioritizationList.error = null;
      })
      .addCase(fetchPrioritizationList.fulfilled, (state, action) => {
        state.prioritizationList.status = 'succeeded';
        state.prioritizationList.items = action.payload;
      })
      .addCase(fetchPrioritizationList.rejected, (state, action) => {
        state.prioritizationList.status = 'failed';
        state.prioritizationList.error =
          (action.payload as string | undefined) ?? 'Failed to fetch prioritization list';
      });
  },
});

export const { selectCoordinatedEntryClient, resetCoordinatedEntryFlow, togglePrioritizationFilter } =
  coordinatedEntrySlice.actions;

export default coordinatedEntrySlice.reducer;
