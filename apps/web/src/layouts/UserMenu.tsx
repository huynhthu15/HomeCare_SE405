import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/auth-context';

const roleLabel = {
  CUSTOMER: 'Khách hàng',
  TECHNICIAN: 'Kỹ thuật viên',
  ADMIN: 'Quản trị',
} as const;

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
        {user.fullName.split(' ').at(-1)?.[0]?.toUpperCase() ?? 'U'}
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block max-w-40 truncate text-sm font-semibold">{user.fullName}</span>
        <span className="block text-xs text-slate-500">{roleLabel[user.role]}</span>
      </span>
      <button
        type="button"
        onClick={() => void onLogout()}
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        title="Đăng xuất"
        aria-label="Đăng xuất"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
