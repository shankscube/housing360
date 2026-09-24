import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Task, TaskFilter, TaskListItem, TaskListQuery, TaskListResult, TaskUpdateInput } from '@housing360/types';
import { apiClient } from '../../api/client';

type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface TasksListState {
  items: TaskListItem[];
  total: number;
  page: number;
  pageSize: number;
  filter: TaskFilter;
  search: string;
  status: RequestStatus;
  error: string | null;
}

interface TasksDetailState {
  task: Task | null;
  status: RequestStatus;
  error: string | null;
}

interface TasksState {
  list: TasksListState;
  detail: TasksDetailState;
}

const initialState: TasksState = {
  list: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 20,
    filter: 'all',
    search: '',
    status: 'idle',
    error: null,
  },
  detail: {
    task: null,
    status: 'idle',
    error: null,
  },
};

function buildListQueryString(query: TaskListQuery): string {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize));
  if (query.filter !== undefined) params.set('filter', query.filter);
  if (query.search) params.set('search', query.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (query: TaskListQuery, { rejectWithValue }) => {
    const response = await apiClient.get<TaskListResult>(`/api/tasks${buildListQueryString(query)}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const fetchTaskDetail = createAsyncThunk(
  'tasks/fetchTaskDetail',
  async (id: string, { rejectWithValue }) => {
    const response = await apiClient.get<Task>(`/api/tasks/${id}`);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, input }: { id: string; input: TaskUpdateInput }, { rejectWithValue }) => {
    const response = await apiClient.patch<Task>(`/api/tasks/${id}`, input);
    if (!response.success) {
      return rejectWithValue(response.message);
    }
    return response.data;
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setListFilter(state, action: PayloadAction<TaskFilter>) {
      state.list.filter = action.payload;
      state.list.page = 1;
    },
    setListPage(state, action: PayloadAction<number>) {
      state.list.page = action.payload;
    },
    setSearchTerm(state, action: PayloadAction<string>) {
      state.list.search = action.payload;
      state.list.page = 1;
    },
    clearSelectedTask(state) {
      state.detail = { ...initialState.detail };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.list.status = 'loading';
        state.list.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.list.status = 'succeeded';
        state.list.items = action.payload.items;
        state.list.total = action.payload.total;
        state.list.page = action.payload.page;
        state.list.pageSize = action.payload.pageSize;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.list.status = 'failed';
        state.list.error = (action.payload as string | undefined) ?? 'Failed to fetch tasks';
      })

      .addCase(fetchTaskDetail.pending, (state) => {
        state.detail.status = 'loading';
        state.detail.error = null;
      })
      .addCase(fetchTaskDetail.fulfilled, (state, action) => {
        state.detail.status = 'succeeded';
        state.detail.task = action.payload;
      })
      .addCase(fetchTaskDetail.rejected, (state, action) => {
        state.detail.status = 'failed';
        state.detail.error = (action.payload as string | undefined) ?? 'Failed to fetch task';
      })

      .addCase(updateTask.fulfilled, (state, action) => {
        state.detail.task = action.payload;
        state.list.items = state.list.items.map((task) =>
          task.id === action.payload.id ? { ...task, ...action.payload } : task
        );
      });
  },
});

export const { setListFilter, setListPage, setSearchTerm, clearSelectedTask } = tasksSlice.actions;

export default tasksSlice.reducer;
