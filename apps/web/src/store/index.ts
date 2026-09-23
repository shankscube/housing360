import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import casesReducer from './slices/casesSlice';
import assessmentsReducer from './slices/assessmentsSlice';
import coordinatedEntryReducer from './slices/coordinatedEntrySlice';
import dashboardReducer from './slices/dashboardSlice';
import intakeReducer from './slices/intakeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    cases: casesReducer,
    assessments: assessmentsReducer,
    coordinatedEntry: coordinatedEntryReducer,
    dashboard: dashboardReducer,
    intake: intakeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
