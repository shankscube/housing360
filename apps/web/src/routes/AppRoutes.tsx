import { NavLink, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MyClientsPage } from './pages/MyClientsPage';
import { CasesPage } from './pages/CasesPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { CoordinatedEntryPage } from './pages/CoordinatedEntryPage';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/clients', label: 'My Clients' },
  { to: '/cases', label: 'Cases' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/coordinated-entry', label: 'Coordinated Entry' },
];

export function AppRoutes() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <nav className="flex gap-md border-b border-neutral-200 bg-white p-md">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'text-primary-700 font-semibold' : 'text-neutral-700'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/clients" element={<MyClientsPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/coordinated-entry" element={<CoordinatedEntryPage />} />
      </Routes>
    </div>
  );
}
