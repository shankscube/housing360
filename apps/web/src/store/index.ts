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
import searchReducer from './slices/searchSlice';
import notificationsReducer from './slices/notificationsSlice';
import tasksReducer from './slices/tasksSlice';
import calendarReducer from './slices/calendarSlice';
import recentActivityReducer from './slices/recentActivitySlice';

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
    search: searchReducer,
    notifications: notificationsReducer,
    tasks: tasksReducer,
    calendar: calendarReducer,
    recentActivity: recentActivityReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
