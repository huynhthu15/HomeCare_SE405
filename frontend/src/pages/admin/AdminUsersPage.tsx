import type { UserRole, UserStatus } from '@homecare/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Lock, Search, Unlock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../auth/auth-context';
import { ApiError, api } from '../../lib/api-client';

interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  technicianCode: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

const roleLabel: Record<UserRole, string> = {
  CUSTOMER: 'Khách hàng',
  TECHNICIAN: 'Kỹ thuật viên',
  ADMIN: 'Quản trị',
};
const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');

  const users = useQuery({
    queryKey: ['admin', 'users', { q, role, page }],
    queryFn: () =>
      api<Page<AdminUser>>('/admin/users', {
        query: { q: q || undefined, role: role || undefined, page, pageSize: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  });

  const setStatus = useMutation({
    mutationFn: (input: { id: string; status: UserStatus; reason: string }) =>
      api<AdminUser>(`/admin/users/${input.id}/status`, {
        method: 'PATCH',
        body: { status: input.status, reason: input.reason },
      }),
    onSuccess: () => {
      setPending(null);
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const totalPages = users.data
    ? Math.max(1, Math.ceil(users.data.total / users.data.pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Người dùng</h1>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tên, email, mã KTV"
              className="h-10 w-48 text-sm outline-none"
            />
          </label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as UserRole | '');
              setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">Tất cả vai trò</option>
            {Object.entries(roleLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Đăng nhập</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Lần đăng nhập cuối</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {users.data?.items.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                <td className="px-4 py-3 text-slate-600">{u.technicianCode ?? u.email}</td>
                <td className="px-4 py-3">{roleLabel[u.role]}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
                  >
                    {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('vi-VN') : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me?.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setPending(u);
                        setReason('');
                        setStatus.reset();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      {u.status === 'ACTIVE' ? (
                        <>
                          <Lock size={14} /> Khóa
                        </>
                      ) : (
                        <>
                          <Unlock size={14} /> Mở khóa
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Tổng: {users.data?.total ?? 0}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="px-2 py-1.5">
            {page}/{totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              {pending.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'} tài khoản {pending.fullName}
            </h2>
            {pending.status === 'ACTIVE' && (
              <p className="mt-2 text-sm text-slate-600">
                Mọi phiên đăng nhập của người dùng này sẽ bị thu hồi ngay lập tức.
              </p>
            )}
            <label className="mt-4 block text-sm font-semibold">
              Lý do (bắt buộc, được ghi vào audit log)
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm font-normal"
              />
            </label>
            {setStatus.error && (
              <p className="mt-2 text-sm font-semibold text-rose-600">
                {setStatus.error instanceof ApiError ? setStatus.error.message : 'Có lỗi xảy ra'}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={reason.trim().length < 3 || setStatus.isPending}
                onClick={() =>
                  setStatus.mutate({
                    id: pending.id,
                    status: pending.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE',
                    reason,
                  })
                }
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
