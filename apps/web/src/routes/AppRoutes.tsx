import { Route, Routes } from 'react-router-dom';
import { RouteGuard } from './RouteGuard';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { MyClientsPage } from './pages/MyClientsPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { AssessmentDetailPage } from '../features/assessments/AssessmentDetailPage';
import { CoordinatedEntryPage } from './pages/CoordinatedEntryPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RouteGuard />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/clients" element={<MyClientsPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/assessments" element={<AssessmentsPage />} />
          <Route path="/assessments/:id" element={<AssessmentDetailPage />} />
          <Route path="/coordinated-entry" element={<CoordinatedEntryPage />} />

          <Route
            path="/resource-directory"
            element={<PlaceholderPage title="Resource Directory" />}
          />

          <Route path="/referrals" element={<PlaceholderPage title="Referrals" />} />
          <Route
            path="/referrals/internal"
            element={<PlaceholderPage title="Referrals — Internal" />}
          />
          <Route
            path="/referrals/outbound"
            element={<PlaceholderPage title="Referrals — Outbound" />}
          />

          <Route
            path="/shelter-management"
            element={<PlaceholderPage title="Shelter Management" />}
          />
          <Route
            path="/shelter-management/beds"
            element={<PlaceholderPage title="Shelter Management — Beds" />}
          />
          <Route
            path="/shelter-management/daily-log"
            element={<PlaceholderPage title="Shelter Management — Daily Log" />}
          />

          <Route
            path="/insights/data-quality"
            element={<PlaceholderPage title="Insights — Data Quality" />}
          />
          <Route path="/insights/reports" element={<PlaceholderPage title="Insights — Reports" />} />

          <Route
            path="/tools/data-import"
            element={<PlaceholderPage title="Tools — Data Import" />}
          />
          <Route path="/tools/training" element={<PlaceholderPage title="Tools — Training" />} />
        </Route>
      </Route>
    </Routes>
  );
}
