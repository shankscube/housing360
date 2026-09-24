import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type {
  CarePlanCreateInput,
  CarePlanDetail,
  CarePlanTemplate,
  CarePlanTemplateListItem,
  CarePlanUpdateInput,
  GoalAssignment,
  GoalAssignmentCreateInput,
  GoalAssignmentUpdateInput,
  GoalDefinition,
  ServiceGap,
  Task,
  TaskCreateInput,
} from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface CarePlansState {
  plans: CarePlanDetail[];
  plansStatus: RequestStatus;
  templates: CarePlanTemplateListItem[];
  recommendedTemplates: CarePlanTemplateListItem[];
  templatesStatus: RequestStatus;
  selectedTemplate: CarePlanTemplate | null;
  goalDefinitions: GoalDefinition[];
  serviceGaps: ServiceGap[];
  serviceGapsStatus: RequestStatus;
}

const initialState: CarePlansState = {
  plans: [],
  plansStatus: 'idle',
  templates: [],
  recommendedTemplates: [],
  templatesStatus: 'idle',
  selectedTemplate: null,
  goalDefinitions: [],
  serviceGaps: [],
  serviceGapsStatus: 'idle',
};

export const fetchCarePlansByCase = createAsyncThunk(
  'carePlans/fetchByCase',
  async (caseId: string, { rejectWithValue }) => {
    const response = await apiClient.get<CarePlanDetail[]>(`/api/cases/${caseId}/care-plans`);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchCarePlanTemplates = createAsyncThunk(
  'carePlans/fetchTemplates',
  async ({ published, search }: { published?: boolean; search?: string }, { rejectWithValue }) => {
    const params = new URLSearchParams();
    if (published !== undefined) params.set('published', String(published));
    if (search) params.set('search', search);
    const qs = params.toString();
    const response = await apiClient.get<CarePlanTemplateListItem[]>(
      `/api/care-plan-templates${qs ? `?${qs}` : ''}`
    );
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchRecommendedCarePlanTemplates = createAsyncThunk(
  'carePlans/fetchRecommendedTemplates',
  async (caseId: string, { rejectWithValue }) => {
    const response = await apiClient.get<CarePlanTemplateListItem[]>(
      `/api/cases/${caseId}/recommended-care-plan-templates`
    );
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchCarePlanTemplateDetail = createAsyncThunk(
  'carePlans/fetchTemplateDetail',
  async (templateId: string, { rejectWithValue }) => {
    const response = await apiClient.get<CarePlanTemplate>(`/api/care-plan-templates/${templateId}`);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchGoalDefinitions = createAsyncThunk(
  'carePlans/fetchGoalDefinitions',
  async (_: void, { rejectWithValue }) => {
    const response = await apiClient.get<GoalDefinition[]>('/api/goal-definitions');
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const createCarePlan = createAsyncThunk(
  'carePlans/create',
  async (input: CarePlanCreateInput, { rejectWithValue }) => {
    const response = await apiClient.post<CarePlanDetail>('/api/care-plans', input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const updateCarePlan = createAsyncThunk(
  'carePlans/update',
  async ({ id, input }: { id: string; input: CarePlanUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<CarePlanDetail>(`/api/care-plans/${id}`, input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const addGoalToCarePlan = createAsyncThunk(
  'carePlans/addGoal',
  async (input: GoalAssignmentCreateInput, { rejectWithValue }) => {
    const response = await apiClient.post<GoalAssignment>(
      `/api/care-plans/${input.carePlanId}/goals`,
      input
    );
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const updateGoalAssignment = createAsyncThunk(
  'carePlans/updateGoal',
  async ({ id, input }: { id: string; input: GoalAssignmentUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<GoalAssignment>(`/api/goal-assignments/${id}`, input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const addTaskToGoal = createAsyncThunk(
  'carePlans/addTaskToGoal',
  async (
    { goalId, input }: { goalId: string; input: Omit<TaskCreateInput, 'clientId' | 'caseId' | 'goalAssignmentId'> },
    { rejectWithValue }
  ) => {
    const response = await apiClient.post<Task>(`/api/goal-assignments/${goalId}/tasks`, input);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const updateGoalTaskStatus = createAsyncThunk(
  'carePlans/updateGoalTaskStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    const response = await apiClient.patch<Task>(`/api/tasks/${id}/status`, { status });
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

export const fetchServiceGaps = createAsyncThunk(
  'carePlans/fetchServiceGaps',
  async (caseId: string, { rejectWithValue }) => {
    const response = await apiClient.get<ServiceGap[]>(`/api/cases/${caseId}/service-gaps`);
    if (!response.success) return rejectWithValue(response.message);
    return response.data;
  }
);

const carePlansSlice = createSlice({
  name: 'carePlans',
  initialState,
  reducers: {
    clearSelectedTemplate(state) {
      state.selectedTemplate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCarePlansByCase.pending, (state) => {
        state.plansStatus = 'loading';
      })
      .addCase(fetchCarePlansByCase.fulfilled, (state, action) => {
        state.plansStatus = 'succeeded';
        state.plans = action.payload;
      })
      .addCase(fetchCarePlansByCase.rejected, (state) => {
        state.plansStatus = 'failed';
      })

      .addCase(fetchCarePlanTemplates.fulfilled, (state, action) => {
        state.templatesStatus = 'succeeded';
        state.templates = action.payload;
      })
      .addCase(fetchRecommendedCarePlanTemplates.fulfilled, (state, action) => {
        state.recommendedTemplates = action.payload;
      })
      .addCase(fetchCarePlanTemplateDetail.fulfilled, (state, action) => {
        state.selectedTemplate = action.payload;
      })
      .addCase(fetchGoalDefinitions.fulfilled, (state, action) => {
        state.goalDefinitions = action.payload;
      })

      .addCase(createCarePlan.fulfilled, (state, action) => {
        state.plans = [action.payload, ...state.plans];
      })
      .addCase(updateCarePlan.fulfilled, (state, action) => {
        state.plans = state.plans.map((plan) => (plan.id === action.payload.id ? action.payload : plan));
      })

      .addCase(updateGoalTaskStatus.fulfilled, (state, action) => {
        state.plans = state.plans.map((plan) => ({
          ...plan,
          goals: plan.goals.map((goal) => ({
            ...goal,
            tasks: goal.tasks.map((task) => (task.id === action.payload.id ? action.payload : task)),
          })),
        }));
      })

      .addCase(fetchServiceGaps.pending, (state) => {
        state.serviceGapsStatus = 'loading';
      })
      .addCase(fetchServiceGaps.fulfilled, (state, action) => {
        state.serviceGapsStatus = 'succeeded';
        state.serviceGaps = action.payload;
      })
      .addCase(fetchServiceGaps.rejected, (state) => {
        state.serviceGapsStatus = 'failed';
      });
  },
});

export const { clearSelectedTemplate } = carePlansSlice.actions;
export default carePlansSlice.reducer;
