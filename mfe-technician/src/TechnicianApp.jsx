import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  ClipboardList,
  Coins,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  Route,
  Send,
  ShieldCheck,
  Star,
  UploadCloud,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import "./index.css";

const fallbackTechnicianProfile = {
  id: "TECH-088",
  name: "Phạm Quốc Việt",
  role: "Kỹ thuật viên điện lạnh & vệ sinh",
  phone: "0908 234 567",
  email: "viet.technician@homecare.vn",
  area: "Quận 4, Quận 7, TP Thủ Đức",
  experience: "5 năm kinh nghiệm",
  completedJobs: 1284,
  certificates: ["An toàn điện dân dụng", "Vệ sinh HVAC", "Sửa chữa thiết bị gia dụng"],
  rating: 4.9,
  reviews: [
    "Đúng giờ, giải thích lỗi rõ ràng và xử lý nhanh.",
    "Có ảnh trước/sau đầy đủ, khu vực làm việc rất gọn.",
    "Thái độ chuyên nghiệp, tư vấn cách sử dụng thiết bị tốt.",
  ],
};

const initialJobs = [
  {
    id: "HC-2408",
    service: "Vệ sinh máy lạnh",
    customer: "Nguyễn Minh Khang",
    phone: "0912 456 789",
    address: "12 Nguyễn Văn Linh, Quận 7",
    time: "Hôm nay, 10:00",
    status: "Chờ nhận",
    fee: 180000,
    distance: "2.4 km",
    priority: "Gấp",
    note: "Máy lạnh phòng ngủ, cần dung dịch không mùi.",
    checklist: ["Chụp ảnh trước", "Vệ sinh lưới lọc", "Kiểm tra dàn lạnh", "Chạy thử sau xử lý"],
  },
  {
    id: "HC-2411",
    service: "Sửa máy giặt",
    customer: "Trần Thu Hà",
    phone: "0903 112 224",
    address: "88 Hoàng Diệu, Quận 4",
    time: "Hôm nay, 13:30",
    status: "Đã nhận",
    fee: 260000,
    distance: "4.1 km",
    priority: "Tiêu chuẩn",
    note: "Máy báo lỗi E2, khách có mặt sau 13:00.",
    checklist: ["Chẩn đoán lỗi", "Báo linh kiện", "Cập nhật trạng thái", "Xác nhận nghiệm thu"],
  },
  {
    id: "HC-2415",
    service: "Giặt sofa - nệm",
    customer: "Lê Bảo An",
    phone: "0988 661 552",
    address: "21 Mai Chí Thọ, TP Thủ Đức",
    time: "Hôm nay, 16:00",
    status: "Đang thực hiện",
    fee: 320000,
    distance: "6.8 km",
    priority: "Tiêu chuẩn",
    note: "Sofa vải màu xám, có vết cà phê.",
    checklist: ["Chụp ảnh trước", "Hút bụi sâu", "Giặt hơi nước", "Chụp ảnh sau"],
  },
  {
    id: "HC-2422",
    service: "Vệ sinh bếp",
    customer: "Hoàng Ngọc Mai",
    phone: "0937 888 120",
    address: "5 Nguyễn Thị Thập, Quận 7",
    time: "Ngày mai, 09:00",
    status: "Chờ nhận",
    fee: 240000,
    distance: "3.2 km",
    priority: "Tiêu chuẩn",
    note: "Cần vệ sinh máy hút mùi và mặt đá.",
    checklist: ["Xác nhận lịch", "Vệ sinh bếp", "Khử mùi", "Bàn giao"],
  },
];

const schedule = [
  { time: "08:30", label: "Check-in kho dụng cụ", detail: "Nhận bộ dụng cụ và hóa chất" },
  { time: "10:00", label: "HC-2408 - Vệ sinh máy lạnh", detail: "Quận 7" },
  { time: "13:30", label: "HC-2411 - Sửa máy giặt", detail: "Quận 4" },
  { time: "16:00", label: "HC-2415 - Giặt sofa - nệm", detail: "TP Thủ Đức" },
];

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: BriefcaseBusiness },
  { id: "jobs", label: "Công việc", icon: ClipboardList },
  { id: "location", label: "Vị trí", icon: Navigation },
  { id: "report", label: "Báo cáo", icon: ClipboardCheck },
  { id: "profile", label: "Hồ sơ", icon: UserRound },
];

const statusOptions = ["Đã nhận", "Đang di chuyển", "Đang thực hiện", "Hoàn thành"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const createTimeLabel = () =>
  new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const getTechnicianHeaders = () => {
  const token = localStorage.getItem("technician_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function technicianRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getTechnicianHeaders(),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Không thể kết nối backend technician");
  }

  return payload;
}

function readTechnicianSession() {
  try {
    const token = localStorage.getItem("technician_token");
    const session = JSON.parse(localStorage.getItem("technician_session") || "null");
    return token && session ? session : null;
  } catch {
    localStorage.removeItem("technician_token");
    localStorage.removeItem("technician_session");
    return null;
  }
}

export default function TechnicianApp() {
  const [session, setSession] = useState(() => readTechnicianSession());
  const [loginForm, setLoginForm] = useState({
    code: "TECH-088",
    password: "123456",
  });
  const [loginError, setLoginError] = useState("");
  const [profile, setProfile] = useState(fallbackTechnicianProfile);
  const [scheduleItems, setScheduleItems] = useState(schedule);
  const [loading, setLoading] = useState(Boolean(session));
  const [activeView, setActiveView] = useState("dashboard");
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState(initialJobs[0].id);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [position, setPosition] = useState({
    lat: 10.7769,
    lng: 106.7009,
    updatedAt: "Chưa chia sẻ",
    accuracy: "Chưa có dữ liệu",
  });
  const [workNote, setWorkNote] = useState("Khách hẹn gọi trước 10 phút khi đến nơi.");
  const [beforePhoto, setBeforePhoto] = useState("");
  const [afterPhoto, setAfterPhoto] = useState("");
  const [toast, setToast] = useState("");

  const selectedJob = jobs.find((job) => job.id === selectedJobId) || jobs[0];

  const stats = useMemo(() => {
    const visibleJobs = jobs.filter((job) => job.status !== "Từ chối");
    const todayJobs = visibleJobs.filter((job) => job.time.startsWith("Hôm nay"));
    const completedJobs = jobs.filter((job) => job.status === "Hoàn thành");
    const income = jobs
      .filter((job) => ["Đã nhận", "Đang di chuyển", "Đang thực hiện", "Hoàn thành"].includes(job.status))
      .reduce((sum, job) => sum + job.fee, 0);

    return {
      assigned: visibleJobs.length,
      today: todayJobs.length,
      completed: completedJobs.length,
      income,
    };
  }, [jobs]);

  useEffect(() => {
    if (!session) {
      return;
    }

    setLoading(true);
    technicianRequest("/technician/dashboard")
      .then((data) => {
        setProfile(data.technician || fallbackTechnicianProfile);
        setJobs(Array.isArray(data.jobs) && data.jobs.length > 0 ? data.jobs : initialJobs);
        setScheduleItems(Array.isArray(data.schedule) && data.schedule.length > 0 ? data.schedule : schedule);
        if (data.location) {
          setPosition({
            lat: Number(data.location.lat),
            lng: Number(data.location.lng),
            updatedAt: data.location.createdAt
              ? new Date(data.location.createdAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : createTimeLabel(),
            accuracy: data.location.accuracy || "Backend",
          });
        }
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : "Không thể tải dữ liệu kỹ thuật viên.");
      })
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    if (!locationEnabled) {
      return undefined;
    }

    const persistPosition = (nextPosition) => {
      technicianRequest("/technician/location", {
        method: "POST",
        body: JSON.stringify({
          lat: nextPosition.lat,
          lng: nextPosition.lng,
          accuracy: nextPosition.accuracy,
          jobId: selectedJob.id,
        }),
      }).catch(() => {});
    };

    const updatePosition = () => {
      if (!navigator.geolocation) {
        setPosition((current) => {
          const nextPosition = {
          lat: Number((current.lat + 0.0008).toFixed(5)),
          lng: Number((current.lng + 0.0006).toFixed(5)),
          updatedAt: createTimeLabel(),
          accuracy: "Mô phỏng",
          };
          persistPosition(nextPosition);
          return nextPosition;
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const nextPosition = {
            lat: Number(coords.latitude.toFixed(5)),
            lng: Number(coords.longitude.toFixed(5)),
            updatedAt: createTimeLabel(),
            accuracy: `${Math.round(coords.accuracy)} m`,
          };
          setPosition(nextPosition);
          persistPosition(nextPosition);
        },
        () => {
          setPosition((current) => {
            const nextPosition = {
            lat: Number((current.lat + 0.0008).toFixed(5)),
            lng: Number((current.lng + 0.0006).toFixed(5)),
            updatedAt: createTimeLabel(),
            accuracy: "Mô phỏng",
            };
            persistPosition(nextPosition);
            return nextPosition;
          });
        },
        { enableHighAccuracy: true, timeout: 3000 }
      );
    };

    updatePosition();
    const intervalId = window.setInterval(updatePosition, 5000);
    return () => window.clearInterval(intervalId);
  }, [locationEnabled, selectedJob.id]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3400);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginForm.code.trim() || !loginForm.password.trim()) {
      setLoginError("Vui lòng nhập mã kỹ thuật viên và mật khẩu.");
      return;
    }

    try {
      const data = await technicianRequest("/technician/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      const nextSession = {
        technicianId: data.technician.id,
        name: data.technician.name,
        signedInAt: new Date().toISOString(),
      };

      localStorage.setItem("technician_token", data.token);
      localStorage.setItem("technician_session", JSON.stringify(nextSession));
      localStorage.setItem(
        "portal_session",
        JSON.stringify({
          role: "technician",
          name: data.technician.name,
          id: data.technician.id,
          signedInAt: nextSession.signedInAt,
        })
      );
      window.dispatchEvent(new Event("homecare-auth-changed"));
      setProfile(data.technician);
      setSession(nextSession);
      setLoginError("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Không thể đăng nhập kỹ thuật viên.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("technician_token");
    localStorage.removeItem("technician_session");
    localStorage.removeItem("portal_session");
    window.dispatchEvent(new Event("homecare-auth-changed"));
    setSession(null);
    setActiveView("dashboard");
  };

  const updateSelectedJob = (updater) => {
    setJobs((current) =>
      current.map((job) => (job.id === selectedJob.id ? { ...job, ...updater(job) } : job))
    );
  };

  const setJobStatus = async (status) => {
    try {
      const job = await technicianRequest(`/technician/jobs/${encodeURIComponent(selectedJob.id)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      updateSelectedJob(() => job);
      showToast(`Đã cập nhật ${selectedJob.id}: ${status}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể cập nhật trạng thái.");
    }
  };

  const handlePhoto = (event, setter) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };

  const completeJob = async () => {
    if (!beforePhoto || !afterPhoto) {
      showToast("Cần ảnh trước và ảnh sau trước khi xác nhận hoàn thành.");
      return;
    }

    try {
      const data = await technicianRequest(`/technician/jobs/${encodeURIComponent(selectedJob.id)}/report`, {
        method: "POST",
        body: JSON.stringify({
          beforePhoto,
          afterPhoto,
          note: workNote,
        }),
      });

      updateSelectedJob(() => data.job);
      showToast(`Đã xác nhận hoàn thành ${selectedJob.id}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể gửi báo cáo hoàn thành.");
    }
  };

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">
          <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-14">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400 text-slate-950">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-lg font-bold">HomeCare Technician</p>
                <p className="text-sm text-slate-400">Cổng vận hành kỹ thuật viên</p>
              </div>
            </div>

            <div className="max-w-2xl py-14">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
                Đăng nhập kỹ thuật viên
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
                Quản lý lịch làm việc, vị trí và báo cáo hoàn thành trong một hệ thống riêng.
              </h1>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <LoginMetric value="24/7" label="Điều phối" />
                <LoginMetric value="5s" label="Cập nhật vị trí" />
                <LoginMetric value="4.9" label="Đánh giá TB" />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Tài khoản demo: mã kỹ thuật viên TECH-088, mật khẩu bất kỳ.
            </p>
          </section>

          <section className="flex items-center bg-white px-6 py-8 text-slate-950 sm:px-10">
            <form onSubmit={handleLogin} className="w-full">
              <div>
                <h2 className="text-2xl font-bold">Vào ca làm việc</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sau khi đăng nhập, kỹ thuật viên sẽ vào trực tiếp dashboard riêng để nhận việc và cập nhật tiến độ.
                </p>
              </div>

              <label className="mt-8 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Mã kỹ thuật viên</span>
                <input
                  value={loginForm.code}
                  onChange={(event) => setLoginForm((current) => ({ ...current, code: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  placeholder="TECH-088"
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Mật khẩu</span>
                <input
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  placeholder="Nhập mật khẩu"
                  type="password"
                />
              </label>

              {loginError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 text-sm font-bold text-white transition hover:bg-sky-500"
              >
                Đăng nhập
                <ChevronRight size={18} />
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <section className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 p-4 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400 text-slate-950">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold">Technician Portal</p>
              <p className="truncate text-xs text-slate-400">{profile.id}</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-bold transition ${
                    active ? "bg-sky-400 text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Đang đăng nhập</p>
            <p className="mt-2 font-bold">{profile.name}</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-slate-950 transition hover:bg-slate-100"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  Ca làm việc hôm nay
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Xin chào, {profile.name}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Theo dõi công việc, vị trí và báo cáo hoàn thành dành riêng cho kỹ thuật viên.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:hidden">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveView(item.id)}
                      className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ${
                        activeView === item.id ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            {toast && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <Check size={18} />
                {toast}
              </div>
            )}

            {loading && (
              <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
                Đang tải dữ liệu từ backend...
              </div>
            )}

            {activeView === "dashboard" && (
              <DashboardView stats={stats} jobs={jobs} scheduleItems={scheduleItems} setActiveView={setActiveView} />
            )}

            {activeView === "jobs" && (
              <JobsView
                jobs={jobs}
                selectedJob={selectedJob}
                setSelectedJobId={setSelectedJobId}
                setJobStatus={setJobStatus}
              />
            )}

            {activeView === "location" && (
              <LocationView
                locationEnabled={locationEnabled}
                setLocationEnabled={setLocationEnabled}
                position={position}
                setPosition={setPosition}
                showToast={showToast}
                selectedJob={selectedJob}
              />
            )}

            {activeView === "report" && (
              <ReportView
                selectedJob={selectedJob}
                beforePhoto={beforePhoto}
                afterPhoto={afterPhoto}
                workNote={workNote}
                setWorkNote={setWorkNote}
                handlePhoto={handlePhoto}
                setBeforePhoto={setBeforePhoto}
                setAfterPhoto={setAfterPhoto}
                completeJob={completeJob}
              />
            )}

            {activeView === "profile" && <ProfileView profile={profile} />}
          </main>
        </div>
      </div>
    </section>
  );
}

function DashboardView({ stats, jobs, scheduleItems, setActiveView }) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-4">
        <StatCard icon={<BriefcaseBusiness size={20} />} label="Công việc được phân công" value={`${stats.assigned} việc`} detail="Chờ nhận, đã nhận và đang xử lý." />
        <StatCard icon={<CalendarDays size={20} />} label="Lịch làm việc hôm nay" value={`${stats.today} lịch`} detail="Được xếp theo khung giờ vận hành." />
        <StatCard icon={<WalletCards size={20} />} label="Thu nhập dự kiến" value={formatCurrency(stats.income)} detail="Tính từ các việc đã nhận." />
        <StatCard icon={<BadgeCheck size={20} />} label="Hoàn thành" value={`${stats.completed} việc`} detail="Đã có báo cáo kết thúc." />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel title="Công việc nổi bật" icon={<ClipboardList size={20} />}>
          <div className="space-y-3">
            {jobs.slice(0, 3).map((job) => (
              <JobRow key={job.id} job={job} compact />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveView("jobs")}
            className="mt-4 h-11 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Xem quản lý công việc
          </button>
        </Panel>

        <Panel title="Lịch hôm nay" icon={<Clock3 size={20} />}>
          <div className="space-y-3">
            {scheduleItems.map((item) => (
              <div key={item.time} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                  {item.time}
                </div>
                <div>
                  <p className="font-bold text-slate-950">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function JobsView({ jobs, selectedJob, setSelectedJobId, setJobStatus }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <Panel title="Danh sách công việc" icon={<ClipboardList size={20} />}>
        <div className="space-y-4">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setSelectedJobId(job.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedJob.id === job.id
                  ? "border-sky-400 bg-sky-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <JobRow job={job} />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Thao tác công việc" icon={<PlayCircle size={20} />}>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{selectedJob.id}</p>
          <h3 className="mt-1 text-xl font-bold">{selectedJob.service}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{selectedJob.note}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2"><UserRound size={16} /> {selectedJob.customer}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {selectedJob.phone}</p>
            <p className="flex items-center gap-2"><MapPin size={16} /> {selectedJob.address}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setJobStatus("Đã nhận")}
            className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            <CheckCircle2 size={16} />
            Nhận công việc
          </button>
          <button
            type="button"
            onClick={() => setJobStatus("Từ chối")}
            className="flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
          >
            <XCircle size={16} />
            Từ chối
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setJobStatus(status)}
              className={`h-10 rounded-xl border text-sm font-semibold transition ${
                selectedJob.status === status
                  ? "border-sky-500 bg-sky-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function LocationView({ locationEnabled, setLocationEnabled, position, setPosition, showToast, selectedJob }) {
  const manualUpdate = () => {
    setPosition((current) => {
      const nextPosition = {
        lat: Number((current.lat + 0.0009).toFixed(5)),
        lng: Number((current.lng + 0.0006).toFixed(5)),
        updatedAt: createTimeLabel(),
        accuracy: "Mô phỏng",
      };

      technicianRequest("/technician/location", {
        method: "POST",
        body: JSON.stringify({
          lat: nextPosition.lat,
          lng: nextPosition.lng,
          accuracy: nextPosition.accuracy,
          jobId: selectedJob.id,
        }),
      }).catch(() => {});

      return nextPosition;
    });
    showToast("Đã cập nhật vị trí realtime.");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <Panel title="Theo dõi vị trí" icon={<Navigation size={20} />}>
        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-300">Chia sẻ vị trí realtime</p>
              <h2 className="mt-1 text-2xl font-bold">{locationEnabled ? "Đang bật" : "Đang tắt"}</h2>
            </div>
            <button
              type="button"
              onClick={() => setLocationEnabled((enabled) => !enabled)}
              className={`h-11 rounded-2xl px-5 text-sm font-bold transition ${
                locationEnabled ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-white"
              }`}
            >
              {locationEnabled ? "Tắt chia sẻ" : "Bật chia sẻ"}
            </button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoTile label="Latitude" value={position.lat} />
            <InfoTile label="Longitude" value={position.lng} />
            <InfoTile label="Độ chính xác" value={position.accuracy} />
            <InfoTile label="Cập nhật" value={position.updatedAt} />
          </div>

          <div className="mt-5 flex min-h-56 items-center justify-center rounded-3xl bg-white/10">
            <div className="text-center">
              <Route className="mx-auto text-sky-300" size={44} />
              <p className="mt-3 font-bold">Tuyến đường đến {selectedJob.id}</p>
              <p className="mt-1 text-sm text-slate-300">{selectedJob.distance} tới điểm hẹn</p>
            </div>
          </div>

          <button
            type="button"
            onClick={manualUpdate}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 text-sm font-bold text-slate-950 transition hover:bg-sky-300"
          >
            <Send size={16} />
            Cập nhật vị trí ngay
          </button>
        </div>
      </Panel>

      <Panel title="Điểm hẹn hiện tại" icon={<MapPin size={20} />}>
        <JobRow job={selectedJob} compact />
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          Khi bật chia sẻ vị trí, hệ thống sẽ cập nhật vị trí mỗi 5 giây để điều phối và khách hàng theo dõi ETA.
        </div>
      </Panel>
    </div>
  );
}

function ReportView({
  selectedJob,
  beforePhoto,
  afterPhoto,
  workNote,
  setWorkNote,
  handlePhoto,
  setBeforePhoto,
  setAfterPhoto,
  completeJob,
}) {
  return (
    <Panel title="Báo cáo hoàn thành" icon={<Camera size={20} />}>
      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{selectedJob.id}</p>
        <h2 className="mt-1 text-xl font-bold">{selectedJob.service}</h2>
        <p className="mt-2 text-sm text-slate-600">{selectedJob.customer} • {selectedJob.address}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <PhotoUploader
          label="Chụp ảnh trước khi thực hiện"
          image={beforePhoto}
          onChange={(event) => handlePhoto(event, setBeforePhoto)}
        />
        <PhotoUploader
          label="Chụp ảnh sau khi thực hiện"
          image={afterPhoto}
          onChange={(event) => handlePhoto(event, setAfterPhoto)}
        />
      </div>

      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú công việc</span>
        <textarea
          value={workNote}
          onChange={(event) => setWorkNote(event.target.value)}
          className="min-h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
        />
      </label>

      <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {selectedJob.checklist.map((item) => (
            <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {item}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={completeJob}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
        >
          <BadgeCheck size={18} />
          Xác nhận hoàn thành
        </button>
      </div>
    </Panel>
  );
}

function ProfileView({ profile }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Panel title="Thông tin cá nhân" icon={<UserRound size={20} />}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-700">
            <UserRound size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-sm text-slate-500">{profile.role}</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <ProfileRow label="Mã kỹ thuật viên" value={profile.id} />
          <ProfileRow label="Số điện thoại" value={profile.phone} />
          <ProfileRow label="Email" value={profile.email} />
          <ProfileRow label="Khu vực" value={profile.area} />
          <ProfileRow label="Kinh nghiệm" value={profile.experience} />
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel title="Chứng chỉ" icon={<Award size={20} />}>
          <div className="grid gap-3 md:grid-cols-3">
            {(profile.certificates || []).map((certificate) => (
              <div key={certificate} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Award className="text-amber-600" size={22} />
                <p className="mt-3 font-bold text-slate-950">{certificate}</p>
                <p className="mt-1 text-sm text-slate-500">Đã xác thực bởi HomeCare</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Đánh giá từ khách hàng" icon={<Star size={20} />}>
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 px-4 py-2 text-2xl font-bold text-amber-700">
              {profile.rating}
            </div>
            <div>
              <p className="font-bold">{profile.completedJobs} công việc đã hoàn thành</p>
              <p className="text-sm text-slate-500">Dựa trên phản hồi sau nghiệm thu</p>
            </div>
          </div>
          <div className="space-y-3">
            {(profile.reviews || []).map((review) => (
              <div key={review} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {review}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function LoginMetric({ value, label }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{value}</h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function JobRow({ job, compact = false }) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{job.id}</p>
          <h3 className="mt-1 font-bold text-slate-950">{job.service}</h3>
          <p className="mt-1 text-sm text-slate-600">{job.customer} • {job.time}</p>
          {!compact && (
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={16} />
              {job.address}
            </p>
          )}
        </div>
        <StatusBadge status={job.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <Navigation size={16} />
          {job.distance}
        </span>
        <span className="flex items-center gap-1">
          <Clock3 size={16} />
          {job.priority}
        </span>
        <span className="flex items-center gap-1 font-bold text-slate-950">
          <Coins size={16} />
          {formatCurrency(job.fee)}
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const tone =
    status === "Hoàn thành"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "Từ chối"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : status === "Chờ nhận"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-sky-50 text-sky-700 ring-sky-200";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ring-1 ${tone}`}>
      {status}
    </span>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function PhotoUploader({ label, image, onChange }) {
  return (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <span className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
        <UploadCloud size={18} />
        {label}
      </span>
      <div className="flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        {image ? (
          <img src={image} alt={label} className="h-48 w-full object-cover" />
        ) : (
          <div className="px-4 text-center">
            <Camera className="mx-auto text-slate-300" size={34} />
            <p className="mt-2 text-sm font-semibold text-slate-400">Chụp hoặc chọn ảnh từ thiết bị</p>
          </div>
        )}
      </div>
      <input type="file" accept="image/*" capture="environment" onChange={onChange} className="sr-only" />
    </label>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-950">{value}</span>
    </div>
  );
}
