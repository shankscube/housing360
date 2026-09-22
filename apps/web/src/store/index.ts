import { configureStore } from '@reduxjs/toolkit';
import clientsReducer from './slices/clientsSlice';
import casesReducer from './slices/casesSlice';
import assessmentsReducer from './slices/assessmentsSlice';
import coordinatedEntryReducer from './slices/coordinatedEntrySlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    clients: clientsReducer,
    cases: casesReducer,
    assessments: assessmentsReducer,
    coordinatedEntry: coordinatedEntryReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
