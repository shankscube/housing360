import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import casesReducer from './slices/casesSlice';
import assessmentsReducer from './slices/assessmentsSlice';
import coordinatedEntryReducer from './slices/coordinatedEntrySlice';
import dashboardReducer from './slices/dashboardSlice';
import intakeReducer from './slices/intakeSlice';
import carePlansReducer from './slices/carePlansSlice';
import referralsReducer from './slices/referralsSlice';
import servicesReducer from './slices/servicesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    cases: casesReducer,
    assessments: assessmentsReducer,
    coordinatedEntry: coordinatedEntryReducer,
    dashboard: dashboardReducer,
    intake: intakeReducer,
    carePlans: carePlansReducer,
    referrals: referralsReducer,
    services: servicesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
