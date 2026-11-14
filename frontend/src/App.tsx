import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { customerModules } from './config/modules';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TechnicianHomePage } from './pages/technician/TechnicianHomePage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth roles={['CUSTOMER']}>
            <CustomerLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        {customerModules
          .filter((m) => m.path !== '/')
          .map((m) => (
            <Route
              key={m.path}
              path={`${m.path.slice(1)}/*`}
              element={<ComingSoonPage module={m} />}
            />
          ))}
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth roles={['ADMIN']}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>

      <Route
        path="/technician"
        element={
          <RequireAuth roles={['TECHNICIAN']}>
            <TechnicianHomePage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
