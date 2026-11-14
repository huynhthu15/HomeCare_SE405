import { loginSchema, registerSchema } from '@homecare/shared';
import {
  Eye,
  EyeOff,
  Home,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import type { ZodType } from 'zod';
import { homePathFor, useAuth } from '../auth/auth-context';
import { ApiError } from '../lib/api-client';

type View = 'login' | 'register';
type FieldErrors = Record<string, string>;

function validate<T>(schema: ZodType<T>, data: unknown): { data?: T; errors: FieldErrors } {
  const parsed = schema.safeParse(data);
  if (parsed.success) return { data: parsed.data, errors: {} };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return { errors };
}

export function LoginPage() {
  const { user, status, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<View>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });

  if (status === 'authenticated' && user) return <Navigate to={homePathFor(user.role)} replace />;

  const from = (location.state as { from?: string } | null)?.from;

  const run = async (action: () => Promise<{ role: Parameters<typeof homePathFor>[0] }>) => {
    setBusy(true);
    setMessage('');
    try {
      const signedIn = await action();
      navigate(from && signedIn.role === 'CUSTOMER' ? from : homePathFor(signedIn.role), {
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      setMessage(err instanceof ApiError ? err.message : 'Không thể kết nối máy chủ');
    } finally {
      setBusy(false);
    }
  };

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    const { data, errors: fieldErrors } = validate(loginSchema, loginForm);
    setErrors(fieldErrors);
    if (data) void run(() => login(data));
  };

  const onRegister = (e: FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirm) {
      setErrors({ confirm: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    const { confirm: _confirm, phone, ...rest } = registerForm;
    const { data, errors: fieldErrors } = validate(registerSchema, {
      ...rest,
      ...(phone ? { phone } : {}),
    });
    setErrors(fieldErrors);
    if (data) void run(() => register(data));
  };

  const switchView = (next: View) => {
    setView(next);
    setErrors({});
    setMessage('');
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px]">
        <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-8 text-white lg:block lg:px-14">
          <div className="absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-lg font-bold">HomeCare</p>
                <p className="text-sm text-slate-300">Nền tảng chăm sóc nhà ở</p>
              </div>
            </div>
            <div className="max-w-2xl py-16">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Quản lý dịch vụ tại nhà
              </p>
              <h1 className="mt-4 text-5xl font-bold leading-tight">
                Theo dõi lịch hẹn, thiết bị và thanh toán trong một tài khoản.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                Khách hàng đặt lịch nhanh hơn, kỹ thuật viên tiếp nhận và cập nhật công việc theo
                thời gian thực.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <RoleCard
                  icon={<Home size={22} />}
                  title="Khách hàng"
                  detail="Đặt dịch vụ, theo dõi kỹ thuật viên, thanh toán an toàn."
                />
                <RoleCard
                  icon={<Wrench size={22} />}
                  title="Kỹ thuật viên"
                  detail="Đăng nhập bằng mã KTV trên ứng dụng di động."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-4 py-8 sm:px-8">
          <div className="w-full rounded-[28px] bg-white p-6 shadow-xl shadow-slate-200/80 sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
              {(['login', 'register'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchView(v)}
                  className={`h-10 rounded-xl text-sm font-bold transition ${view === v ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                >
                  {v === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>

            {view === 'login' ? (
              <form onSubmit={onLogin} noValidate className="space-y-4">
                <h2 className="text-2xl font-bold">Chào mừng trở lại</h2>
                <Field
                  label="Email hoặc mã kỹ thuật viên"
                  icon={<Mail size={18} />}
                  error={errors.identifier}
                >
                  <input
                    autoComplete="username"
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    placeholder="ban@example.com hoặc TECH-088"
                    className={inputClass}
                  />
                </Field>
                <PasswordField
                  value={loginForm.password}
                  show={showPassword}
                  setShow={setShowPassword}
                  error={errors.password}
                  autoComplete="current-password"
                  onChange={(password) => setLoginForm({ ...loginForm, password })}
                />
                <StatusMessage message={message} />
                <SubmitButton busy={busy} label="Đăng nhập" />
              </form>
            ) : (
              <form onSubmit={onRegister} noValidate className="space-y-4">
                <h2 className="text-2xl font-bold">Tạo tài khoản khách hàng</h2>
                <Field label="Họ và tên" icon={<User size={18} />} error={errors.fullName}>
                  <input
                    autoComplete="name"
                    value={registerForm.fullName}
                    onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Email" icon={<Mail size={18} />} error={errors.email}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field
                  label="Số điện thoại (không bắt buộc)"
                  icon={<Phone size={18} />}
                  error={errors.phone}
                >
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <PasswordField
                  value={registerForm.password}
                  show={showPassword}
                  setShow={setShowPassword}
                  error={errors.password}
                  autoComplete="new-password"
                  hint="Tối thiểu 8 ký tự, có chữ và số"
                  onChange={(password) => setRegisterForm({ ...registerForm, password })}
                />
                <Field label="Xác nhận mật khẩu" icon={<Lock size={18} />} error={errors.confirm}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={registerForm.confirm}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <StatusMessage message={message} />
                <SubmitButton busy={busy} label="Tạo tài khoản" />
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  'h-11 w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400';

function Field({
  label,
  icon,
  error,
  children,
}: {
  label: string;
  icon: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span
        className={`mt-1.5 flex items-center gap-2 rounded-xl border bg-white px-3 transition focus-within:border-slate-900 ${error ? 'border-rose-400' : 'border-slate-200'}`}
      >
        <span className="text-slate-400">{icon}</span>
        {children}
      </span>
      {error && <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  );
}

function PasswordField(props: {
  value: string;
  show: boolean;
  setShow: (v: boolean) => void;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  autoComplete: string;
}) {
  return (
    <div>
      <Field label="Mật khẩu" icon={<Lock size={18} />} error={props.error}>
        <input
          type={props.show ? 'text' : 'password'}
          autoComplete={props.autoComplete}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => props.setShow(!props.show)}
          className="text-slate-400 hover:text-slate-700"
          aria-label={props.show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {props.show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </Field>
      {props.hint && !props.error && <p className="mt-1 text-xs text-slate-500">{props.hint}</p>}
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
      {message}
    </p>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {busy && <Loader2 size={18} className="animate-spin" />}
      {label}
    </button>
  );
}

function RoleCard({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-white">
        {icon}
        <p className="font-bold">{title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}
