import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  ExternalReferralInput,
  PartnerAgency,
  Referral,
  ReferralDeclineInput,
  ReferralInput,
  ReferralUpdateInput,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ReferralsState {
  partnerAgencies: PartnerAgency[];
  partnerAgenciesStatus: RequestStatus;
  organizations: PartnerAgency[];
  caseReferrals: Referral[];
  caseReferralsStatus: RequestStatus;
}

const initialState: ReferralsState = {
  partnerAgencies: [],
  partnerAgenciesStatus: 'idle',
  organizations: [],
  caseReferrals: [],
  caseReferralsStatus: 'idle',
};

export const fetchPartnerAgencies = createAsyncThunk(
  'referrals/fetchPartnerAgencies',
  async (domain: string, { rejectWithValue }) => {
    const response = await apiClient.get<PartnerAgency[]>(
      `/api/partner-agencies?domain=${encodeURIComponent(domain)}`
    );
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

/** The New/Edit Referral modal's Provider/Referrer pickers — every partner org, no domain filter. */
export const fetchAllOrganizations = createAsyncThunk(
  'referrals/fetchAllOrganizations',
  async (_: void, { rejectWithValue }) => {
    const response = await apiClient.get<PartnerAgency[]>('/api/partner-agencies');
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const createExternalReferral = createAsyncThunk(
  'referrals/createExternal',
  async (input: ExternalReferralInput, { rejectWithValue }) => {
    const response = await apiClient.post<Referral>('/api/referrals/external', input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchCaseReferrals = createAsyncThunk(
  'referrals/fetchByCase',
  async (caseId: string, { rejectWithValue }) => {
    const response = await apiClient.get<Referral[]>(`/api/cases/${caseId}/referrals`);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const createReferral = createAsyncThunk(
  'referrals/create',
  async (input: ReferralInput, { rejectWithValue }) => {
    const response = await apiClient.post<Referral>('/api/referrals', input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const updateReferral = createAsyncThunk(
  'referrals/update',
  async ({ id, input }: { id: string; input: ReferralUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<Referral>(`/api/referrals/${id}`, input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const acceptReferral = createAsyncThunk(
  'referrals/accept',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.post<Referral>(`/api/referrals/${id}/accept`);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const declineReferral = createAsyncThunk(
  'referrals/decline',
  async ({ id, input }: { id: string; input: ReferralDeclineInput }, { rejectWithValue }) => {
    const response = await apiClient.post<Referral>(`/api/referrals/${id}/decline`, input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

const referralsSlice = createSlice({
  name: 'referrals',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartnerAgencies.pending, (state) => {
        state.partnerAgenciesStatus = 'loading';
      })
      .addCase(fetchPartnerAgencies.fulfilled, (state, action) => {
        state.partnerAgenciesStatus = 'succeeded';
        state.partnerAgencies = action.payload;
      })
      .addCase(fetchPartnerAgencies.rejected, (state) => {
        state.partnerAgenciesStatus = 'failed';
      })

      .addCase(fetchAllOrganizations.fulfilled, (state, action) => {
        state.organizations = action.payload;
      })

      .addCase(fetchCaseReferrals.pending, (state) => {
        state.caseReferralsStatus = 'loading';
      })
      .addCase(fetchCaseReferrals.fulfilled, (state, action) => {
        state.caseReferralsStatus = 'succeeded';
        state.caseReferrals = action.payload;
      })
      .addCase(fetchCaseReferrals.rejected, (state) => {
        state.caseReferralsStatus = 'failed';
      })

      .addCase(createReferral.fulfilled, (state, action) => {
        state.caseReferrals = [action.payload, ...state.caseReferrals];
      })
      .addCase(updateReferral.fulfilled, (state, action) => {
        state.caseReferrals = state.caseReferrals.map((r) => (r.id === action.payload.id ? action.payload : r));
      })
      .addCase(acceptReferral.fulfilled, (state, action) => {
        state.caseReferrals = state.caseReferrals.map((r) => (r.id === action.payload.id ? action.payload : r));
      })
      .addCase(declineReferral.fulfilled, (state, action) => {
        state.caseReferrals = state.caseReferrals.map((r) => (r.id === action.payload.id ? action.payload : r));
      });
  },
});

export default referralsSlice.reducer;
