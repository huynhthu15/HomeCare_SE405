import { NavLink, Outlet, useLocation } from 'react-router';
import { customerModules, moduleFor } from '../config/modules';
import { UserMenu } from './UserMenu';

export function CustomerLayout() {
  const { pathname } = useLocation();
  const page = moduleFor(pathname);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 font-bold text-white">
              HC
            </span>
            <span>
              <span className="block font-bold">HomeCare</span>
              <span className="block text-xs text-slate-500">Super App</span>
            </span>
          </div>
          <nav className="mt-6 space-y-1">
            {customerModules.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {!item.ready && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      {item.owner}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200">
          <div className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{page.title}</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{page.description}</p>
            </div>
            <UserMenu />
          </div>
          {/* Mobile navigation */}
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden">
            {customerModules.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-sky-600 text-white' : 'bg-white text-slate-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
