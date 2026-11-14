import type { UserRole } from '@homecare/shared';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { homePathFor, useAuth } from './auth-context';

/**
 * Client-side route guard. This is UX only — the API enforces every permission again,
 * so hiding a route here is never the security boundary.
 */
export function RequireAuth({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Đang khôi phục phiên đăng nhập...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <>{children}</>;
}
