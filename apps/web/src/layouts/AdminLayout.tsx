import { Activity, CreditCard, Route as RouteIcon, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { UserMenu } from './UserMenu';

const adminNav = [
  { to: '/admin/users', label: 'Người dùng', icon: Users, ready: true, owner: 'TV1' },
  { to: '/admin/dispatch', label: 'Điều phối', icon: RouteIcon, ready: false, owner: 'TV2' },
  {
    to: '/admin/payments',
    label: 'Đối soát thanh toán',
    icon: CreditCard,
    ready: false,
    owner: 'TV3',
  },
  { to: '/admin/live', label: 'Bản đồ realtime', icon: Activity, ready: false, owner: 'TV4' },
];

/** Operations console (admin / dispatcher). Each owner adds their screen to `adminNav`. */
export function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white font-bold text-slate-950">
              HC
            </span>
            <div>
              <p className="font-bold">HomeCare Operations</p>
              <p className="text-xs text-slate-400">Bảng điều hành nội bộ</p>
            </div>
          </div>
          <div className="text-slate-950">
            <UserMenu />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {adminNav.map(({ to, label, icon: Icon, ready, owner }) =>
            ready ? (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${isActive ? 'border-sky-400 text-white' : 'border-transparent text-slate-400 hover:text-white'}`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ) : (
              <span
                key={to}
                className="flex shrink-0 cursor-not-allowed items-center gap-2 px-3 py-3 text-sm font-semibold text-slate-600"
                title={`Đang phát triển — ${owner}`}
              >
                <Icon size={16} />
                {label}
                <span className="rounded bg-slate-800 px-1.5 text-[10px] text-slate-400">
                  {owner}
                </span>
              </span>
            ),
          )}
        </nav>
      </header>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
