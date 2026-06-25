import React, { Suspense, lazy, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  Loader2,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  User,
  UserPlus,
  Wrench,
} from "lucide-react";

const CustomerDashboard = lazy(() => import("customerDashboard/CustomerApp"));
const TechnicianApp = lazy(() => import("technician/Routes"));

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const defaultLogin = {
  identifier: "",
  password: "",
};

const defaultRegister = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function readPortalSession() {
  try {
    const session = JSON.parse(localStorage.getItem("portal_session") || "null");
    if (!session?.role) {
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem("portal_session");
    return null;
  }
}

async function requestJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Đăng nhập thất bại");
  }

  return payload;
}

function saveCustomerSession(data) {
  localStorage.setItem("auth_token", data.token);
  localStorage.setItem("auth_user", JSON.stringify(data.user));
  localStorage.removeItem("technician_token");
  localStorage.removeItem("technician_session");
  window.dispatchEvent(new Event("homecare-auth-changed"));

  const session = {
    role: "customer",
    name: data.user.name || data.user.email,
    id: data.user.id,
    signedInAt: new Date().toISOString(),
  };

  localStorage.setItem("portal_session", JSON.stringify(session));
  return session;
}

function saveTechnicianSession(data) {
  localStorage.setItem("technician_token", data.token);
  localStorage.setItem(
    "technician_session",
    JSON.stringify({
      technicianId: data.technician.id,
      name: data.technician.name,
      signedInAt: new Date().toISOString(),
    })
  );
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  window.dispatchEvent(new Event("homecare-auth-changed"));

  const session = {
    role: "technician",
    name: data.technician.name,
    id: data.technician.id,
    signedInAt: new Date().toISOString(),
  };

  localStorage.setItem("portal_session", JSON.stringify(session));
  return session;
}

export default function RootShell() {
  const [session, setSession] = useState(() => readPortalSession());
  const [view, setView] = useState("login");
  const [form, setForm] = useState(defaultLogin);
  const [registerForm, setRegisterForm] = useState(defaultRegister);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const updateMessage = (nextMessage) => {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(""), 4200);
  };

  useEffect(() => {
    const syncSession = () => {
      const current = readPortalSession();

      if (current?.role === "customer" && !localStorage.getItem("auth_token")) {
        localStorage.removeItem("portal_session");
        setSession(null);
        return;
      }

      if (current?.role === "technician" && !localStorage.getItem("technician_token")) {
        localStorage.removeItem("portal_session");
        setSession(null);
        return;
      }

      setSession(current);
    };

    window.addEventListener("storage", syncSession);
    window.addEventListener("homecare-auth-changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
    window.removeEventListener("homecare-auth-changed", syncSession);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("portal_session");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("technician_token");
    localStorage.removeItem("technician_session");
    window.dispatchEvent(new Event("homecare-auth-changed"));
    setSession(null);
  };

  if (session) {
    const RemoteApp = session.role === "technician" ? TechnicianApp : CustomerDashboard;

    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-bold text-slate-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Đang tải dashboard...
          </div>
        }
      >
        <RemoteApp onLogout={handleLogout} />
      </Suspense>
    );
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      try {
        const customer = await requestJson("/auth/login", {
          email: form.identifier,
          password: form.password,
        });
        setSession(saveCustomerSession(customer));
        return;
      } catch {
        const technician = await requestJson("/technician/login", {
          code: form.identifier,
          password: form.password,
        });
        setSession(saveTechnicianSession(technician));
      }
    } catch (error) {
      updateMessage(error instanceof Error ? error.message : "Không thể đăng nhập.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      updateMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const customer = await requestJson("/auth/register", {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
      });
      setSession(saveCustomerSession(customer));
      updateMessage("Đăng ký thành công.");
    } catch (error) {
      updateMessage(error instanceof Error ? error.message : "Đăng ký thất bại.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setForgotSent(true);
      updateMessage(`Đã gửi hướng dẫn khôi phục tới ${forgotEmail}.`);
    } catch {
      updateMessage("Không thể gửi email khôi phục.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px]">
        <section className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10 lg:px-14">
          <div className="absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(160deg,rgba(255,255,255,0.10),rgba(148,163,184,0.08)_45%,transparent_75%)]" />
          <div className="absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex min-h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-black/10">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-lg font-bold">HomeCare</p>
                <p className="text-sm text-slate-300">Nền tảng chăm sóc nhà ở</p>
              </div>
            </div>

            <div className="max-w-2xl py-14">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Quản lý dịch vụ tại nhà
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Theo dõi lịch hẹn, thiết bị và thanh toán trong một tài khoản.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                HomeCare giúp khách hàng đặt lịch nhanh hơn, đồng thời hỗ trợ đội kỹ thuật tiếp nhận và cập nhật công việc theo đúng lịch trình.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <RoleCard icon={<Home size={22} />} title="Khách hàng" detail="Quản lý nhà, thiết bị, lịch hẹn, hóa đơn và thông báo dịch vụ." />
                <RoleCard icon={<Wrench size={22} />} title="Kỹ thuật viên" detail="Xem lịch làm việc, nhận yêu cầu và cập nhật tiến độ phục vụ." />
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur sm:grid-cols-3">
              <TrustMetric value="24/7" label="Tiếp nhận yêu cầu" />
              <TrustMetric value="15 phút" label="Xác nhận lịch" />
              <TrustMetric value="T+1" label="Đối soát thanh toán" />
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 py-8 text-slate-950 sm:px-8">
          <div className="w-full rounded-[28px] border border-white bg-white p-6 shadow-xl shadow-slate-200/80 sm:p-8">
              {view !== "forgot" && (
                <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className={`h-10 rounded-xl text-sm font-bold transition ${
                      view === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className={`h-10 rounded-xl text-sm font-bold transition ${
                      view === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    Đăng ký
                  </button>
                </div>
              )}

              {view === "login" && (
                <form onSubmit={handleLogin}>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Chào mừng trở lại
                    </p>
                    <h2 className="mt-2 text-3xl font-bold">Đăng nhập HomeCare</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Sử dụng email khách hàng hoặc mã nhân sự để vào đúng không gian làm việc của bạn.
                    </p>
                  </div>

                  <TextField
                    className="mt-8"
                    label="Email hoặc mã nhân sự"
                    icon={<Mail size={18} />}
                    value={form.identifier}
                    onChange={(value) => setForm((current) => ({ ...current, identifier: value }))}
                    placeholder="name@example.com hoặc HC-TECH-001"
                  />

                  <PasswordField
                    className="mt-4"
                    label="Mật khẩu"
                    value={form.password}
                    show={showPassword}
                    setShow={setShowPassword}
                    onChange={(value) => setForm((current) => ({ ...current, password: value }))}
                  />

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-600">
                      <input type="checkbox" />
                      Ghi nhớ đăng nhập
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotSent(false);
                        setView("forgot");
                      }}
                      className="font-bold text-slate-800 hover:text-slate-950"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  <StatusMessage message={message} />

                  <SubmitButton busy={busy} idleText="Đăng nhập" busyText="Đang xác thực..." icon={<ArrowRight size={18} />} />
                </form>
              )}

              {view === "register" && (
                <form onSubmit={handleRegister}>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      Tạo tài khoản khách hàng
                    </p>
                    <h2 className="mt-2 text-3xl font-bold">Bắt đầu với HomeCare</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Tạo tài khoản để đặt lịch, theo dõi thiết bị và quản lý thanh toán cho gia đình bạn.
                    </p>
                  </div>

                  <TextField
                    className="mt-8"
                    label="Họ và tên"
                    icon={<User size={18} />}
                    value={registerForm.name}
                    onChange={(value) => setRegisterForm((current) => ({ ...current, name: value }))}
                    placeholder="Nguyễn Văn A"
                  />
                  <TextField
                    className="mt-4"
                    label="Email"
                    icon={<Mail size={18} />}
                    value={registerForm.email}
                    onChange={(value) => setRegisterForm((current) => ({ ...current, email: value }))}
                    placeholder="example@gmail.com"
                    type="email"
                  />
                  <PasswordField
                    className="mt-4"
                    label="Mật khẩu"
                    value={registerForm.password}
                    show={showPassword}
                    setShow={setShowPassword}
                    onChange={(value) => setRegisterForm((current) => ({ ...current, password: value }))}
                  />
                  <PasswordField
                    className="mt-4"
                    label="Xác nhận mật khẩu"
                    value={registerForm.confirmPassword}
                    show={showPassword}
                    setShow={setShowPassword}
                    onChange={(value) => setRegisterForm((current) => ({ ...current, confirmPassword: value }))}
                  />

                  <label className="mt-4 flex items-start gap-3 text-sm text-slate-600">
                    <input type="checkbox" className="mt-1" required />
                    <span>Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật của HomeCare.</span>
                  </label>

                  <StatusMessage message={message} />

                  <SubmitButton busy={busy} idleText="Tạo tài khoản" busyText="Đang đăng ký..." icon={<UserPlus size={18} />} />
                </form>
              )}

              {view === "forgot" && (
                <form onSubmit={handleForgotPassword}>
                  {!forgotSent ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                          Khôi phục tài khoản
                        </p>
                        <h2 className="mt-2 text-3xl font-bold">Quên mật khẩu</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn.
                        </p>
                      </div>
                      <TextField
                        className="mt-8"
                        label="Email"
                        icon={<Mail size={18} />}
                        value={forgotEmail}
                        onChange={setForgotEmail}
                        placeholder="example@gmail.com"
                        type="email"
                      />
                      <StatusMessage message={message} />
                      <SubmitButton busy={busy} idleText="Gửi liên kết" busyText="Đang gửi..." icon={<Send size={18} />} />
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                        <Send size={30} />
                      </div>
                      <h2 className="mt-5 text-3xl font-bold">Kiểm tra email của bạn</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến:
                      </p>
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-800">
                        {forgotEmail}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
                  >
                    <ArrowLeft size={18} />
                    Quay lại đăng nhập
                  </button>
                </form>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}

function TextField({ className = "", label, icon, value, onChange, placeholder, type = "text" }) {
  return (
    <label className={`${className} block`}>
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-200"
          placeholder={placeholder}
          type={type}
          required
        />
      </div>
    </label>
  );
}

function PasswordField({ className = "", label, value, show, setShow, onChange }) {
  return (
    <label className={`${className} block`}>
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-200"
          placeholder="••••••••"
          type={show ? "text" : "password"}
          required
        />
        <button
          type="button"
          onClick={() => setShow((visible) => !visible)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </label>
  );
}

function StatusMessage({ message }) {
  if (!message) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      {message}
    </div>
  );
}

function SubmitButton({ busy, idleText, busyText, icon }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {busy ? <Loader2 className="animate-spin" size={18} /> : icon}
      {busy ? busyText : idleText}
    </button>
  );
}

function RoleCard({ icon, title, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-slate-100">
        {icon}
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
    </div>
  );
}

function TrustMetric({ value, label }) {
  return (
    <div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-300">{label}</p>
    </div>
  );
}
