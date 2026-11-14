import type { AuthUser } from '@homecare/shared';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { Link } from 'react-router';
import { customerModules } from '../config/modules';
import { api } from '../lib/api-client';

/**
 * Starter dashboard. TODO(TV1): rebuild from legacy/web/src/customer/pages/Dashboard.jsx once
 * the profile / booking / payments endpoints exist (one aggregated GET /dashboard query).
 */
export function DashboardPage() {
  const me = useQuery({ queryKey: ['auth', 'me'], queryFn: () => api<AuthUser>('/auth/me') });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-950 p-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">Xin chào</p>
        <h2 className="mt-1 text-2xl font-bold">{me.data?.fullName ?? '...'}</h2>
        <p className="mt-2 text-sm text-slate-300">{me.data?.email}</p>
      </section>

      <section>
        <h3 className="text-lg font-bold">Tiến độ chuyển đổi các phân hệ</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {customerModules
            .filter((m) => m.path !== '/')
            .map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.path}
                  to={m.path}
                  className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Icon size={20} className="text-sky-600" />
                    {m.ready ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <Clock3 size={14} /> {m.owner}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-bold">{m.label}</p>
                  <p className="mt-1 text-xs text-slate-500">API: {m.apiModule}</p>
                </Link>
              );
            })}
        </div>
      </section>
    </div>
  );
}
