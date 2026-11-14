import { Loader2 } from 'lucide-react';
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './auth/RequireAuth';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Screens ported from legacy/web/src (see docs/frontend-migration.md). Each one is a separate
// chunk so a customer never downloads the technician portal and vice versa.
const DashboardPage = lazy(() => import('./features/dashboard/DashboardPage'));
const CleaningPage = lazy(() => import('./features/cleaning/CleaningPage'));
const RepairPage = lazy(() => import('./features/repair/RepairPage'));
const AppliancePage = lazy(() => import('./features/appliance/AppliancePage'));
const BookingPage = lazy(() => import('./features/booking/BookingPage'));
const TrackingPage = lazy(() => import('./features/tracking/TrackingPage'));
const PaymentPage = lazy(() => import('./features/payment/PaymentPage'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const TechnicianPage = lazy(() => import('./features/technician/TechnicianPage'));

function Screen({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16 text-sm font-semibold text-slate-500">
          <Loader2 className="mr-2 animate-spin" size={18} />
          Đang tải màn hình...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

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
        <Route
          index
          element={
            <Screen>
              <DashboardPage />
            </Screen>
          }
        />
        <Route
          path="cleaning/*"
          element={
            <Screen>
              <CleaningPage />
            </Screen>
          }
        />
        <Route
          path="repair/*"
          element={
            <Screen>
              <RepairPage />
            </Screen>
          }
        />
        <Route
          path="appliance/*"
          element={
            <Screen>
              <AppliancePage />
            </Screen>
          }
        />
        <Route
          path="booking/*"
          element={
            <Screen>
              <BookingPage />
            </Screen>
          }
        />
        <Route
          path="tracking/*"
          element={
            <Screen>
              <TrackingPage />
            </Screen>
          }
        />
        <Route
          path="payment/*"
          element={
            <Screen>
              <PaymentPage />
            </Screen>
          }
        />
        <Route
          path="profile/*"
          element={
            <Screen>
              <ProfilePage />
            </Screen>
          }
        />
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
        path="/technician/*"
        element={
          <RequireAuth roles={['TECHNICIAN']}>
            <Screen>
              <TechnicianPage />
            </Screen>
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
