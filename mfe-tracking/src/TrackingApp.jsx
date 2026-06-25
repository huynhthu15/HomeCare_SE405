import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Bike,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Radar,
  Route,
  Search,
  ShieldCheck,
  Signal,
  Star,
  UserRound,
  Wrench,
} from "lucide-react";
import "./index.css";

const jobs = [
  {
    id: "TRK-5821",
    service: "Sửa máy lạnh",
    domain: "Repair",
    customer: "Nguyễn Minh Hà",
    address: "12 Nguyễn Văn Linh, Quận 7",
    technician: "Trần Quốc Huy",
    phone: "0908 221 945",
    rating: 4.9,
    eta: "12 phút",
    distance: "3.4 km",
    progress: 72,
    status: "Đang di chuyển",
    priority: "Cao",
    color: "sky",
    coordinates: { x: 66, y: 45 },
    steps: [
      { label: "Đã xác nhận lịch", time: "14:05", done: true },
      { label: "Kỹ thuật viên nhận việc", time: "14:12", done: true },
      { label: "Đang di chuyển", time: "14:38", done: true },
      { label: "Bắt đầu xử lý", time: "15:00", done: false },
    ],
  },
  {
    id: "TRK-5816",
    service: "Vệ sinh bếp",
    domain: "Cleaning",
    customer: "Phạm Thu An",
    address: "88 Lê Văn Lương, Nhà Bè",
    technician: "Lê Minh Anh",
    phone: "0917 450 332",
    rating: 4.8,
    eta: "Đang làm",
    distance: "Tại nhà",
    progress: 86,
    status: "Đang thực hiện",
    priority: "Thường",
    color: "emerald",
    coordinates: { x: 42, y: 68 },
    steps: [
      { label: "Đã đến nơi", time: "13:25", done: true },
      { label: "Chụp ảnh trước khi làm", time: "13:30", done: true },
      { label: "Đang xử lý checklist", time: "14:10", done: true },
      { label: "Chờ khách nghiệm thu", time: "15:15", done: false },
    ],
  },
  {
    id: "TRK-5809",
    service: "Lắp máy lọc nước",
    domain: "Appliance",
    customer: "Đỗ Hoàng Nam",
    address: "21 Võ Văn Kiệt, Quận 1",
    technician: "Mai Thanh Sơn",
    phone: "0934 118 620",
    rating: 4.7,
    eta: "35 phút",
    distance: "6.8 km",
    progress: 38,
    status: "Chuẩn bị vật tư",
    priority: "Thường",
    color: "amber",
    coordinates: { x: 28, y: 32 },
    steps: [
      { label: "Booking đã thanh toán cọc", time: "11:40", done: true },
      { label: "Kho xác nhận vật tư", time: "12:05", done: true },
      { label: "Đang chuẩn bị", time: "14:20", done: true },
      { label: "Rời kho", time: "14:50", done: false },
    ],
  },
];

const alerts = [
  "TRK-5821 cần xác nhận thang máy trước khi kỹ thuật viên đến.",
  "TRK-5816 đã tải 3 ảnh nghiệm thu từ app kỹ thuật viên.",
  "TRK-5809 có vật tư đi kèm: lõi lọc RO số 1 và van chia nước.",
];

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const colorByDomain = {
  Cleaning: "emerald",
  Repair: "sky",
  Appliance: "amber",
  Booking: "sky",
};

const mapBookingToJob = (booking, index) => ({
  id: booking.id,
  service: booking.service,
  domain: booking.domain || "Booking",
  customer: booking.customer || "Khách hàng HomeCare",
  address: booking.address || "Chưa cập nhật địa chỉ",
  technician: booking.technician || "Đang điều phối",
  phone: "0908 221 945",
  rating: 4.8,
  eta: booking.time || "Chưa lên lịch",
  distance: index === 0 ? "3.4 km" : "Đang tính",
  progress: booking.status === "Đã xác nhận" ? 72 : 38,
  status: booking.status,
  priority: booking.addOns?.includes("Khẩn cấp") ? "Cao" : "Thường",
  color: colorByDomain[booking.domain] || "sky",
  coordinates: { x: 28 + ((index * 19) % 55), y: 30 + ((index * 23) % 42) },
  steps: [
    { label: "Đã tạo booking", time: "Now", done: true },
    { label: "Đang điều phối kỹ thuật viên", time: "Now", done: true },
    { label: booking.status, time: booking.time || "Chưa lên lịch", done: booking.status !== "Chờ xác nhận thanh toán" },
    { label: "Hoàn tất nghiệm thu", time: "Sau dịch vụ", done: false },
  ],
});

const formatStatusClass = (color) => {
  const variants = {
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return variants[color] || variants.sky;
};

export default function TrackingApp() {
  const [trackingJobs, setTrackingJobs] = useState(jobs);
  const [opsAlerts, setOpsAlerts] = useState(alerts);
  const [activeJobId, setActiveJobId] = useState(jobs[0].id);
  const [keyword, setKeyword] = useState("");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/bookings`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        const nextJobs = items.slice(-6).reverse().map(mapBookingToJob);
        setTrackingJobs(nextJobs);
        setActiveJobId(nextJobs[0].id);
      })
      .catch(() => setTrackingJobs(jobs));

    fetch(`${API_BASE_URL}/dashboard`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((dashboard) => {
        if (Array.isArray(dashboard.alerts) && dashboard.alerts.length > 0) {
          setOpsAlerts(
            dashboard.alerts.map((alert) => `${alert.title}: ${alert.desc}`)
          );
        }
      })
      .catch(() => setOpsAlerts(alerts));
  }, []);

  const activeJob = trackingJobs.find((job) => job.id === activeJobId) || trackingJobs[0] || jobs[0];

  const filteredJobs = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    if (!value) {
      return trackingJobs;
    }

    return trackingJobs.filter((job) =>
      `${job.id} ${job.service} ${job.customer} ${job.technician} ${job.status}`
        .toLowerCase()
        .includes(value)
    );
  }, [keyword, trackingJobs]);

  const pushUpdate = () => {
    setNotification(`Đã gửi cập nhật trạng thái cho ${activeJob.customer}.`);
    window.setTimeout(() => setNotification(""), 3600);
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Radar size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  Tracking domain
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                  Theo dõi trạng thái kỹ thuật viên
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Giám sát ETA, tiến độ xử lý và các cập nhật vận hành từ Cleaning, Repair, Appliance và Booking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 p-2 text-center">
              <Metric value="24" label="Ca hôm nay" />
              <Metric value="91%" label="Đúng ETA" />
              <Metric value="4.8" label="CSAT" />
            </div>
          </div>
        </header>

        {notification && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 size={18} />
            {notification}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Ca đang theo dõi</h2>
                  <p className="mt-1 text-sm text-slate-500">Đồng bộ từ các domain dịch vụ.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                  {filteredJobs.length}
                </span>
              </div>

              <label className="relative mt-4 block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                  placeholder="Tìm mã, khách, kỹ thuật viên"
                  type="search"
                />
              </label>

              <div className="mt-4 space-y-3">
                {filteredJobs.map((job) => {
                  const active = job.id === activeJob.id;

                  return (
                    <button
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-sky-300 bg-sky-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{job.id}</p>
                          <h3 className="mt-1 font-bold text-slate-950">{job.service}</h3>
                          <p className="mt-1 text-sm text-slate-500">{job.customer}</p>
                        </div>
                        <ChevronRight className={active ? "text-sky-600" : "text-slate-300"} size={20} />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${formatStatusClass(job.color)}`}>
                          {job.status}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">{job.eta}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <BellRing size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Tín hiệu vận hành</h2>
                  <p className="text-sm text-slate-300">Cảnh báo realtime mô phỏng.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {opsAlerts.map((alert) => (
                  <div key={alert} className="flex gap-3 rounded-2xl bg-white/10 p-3 text-sm leading-5 text-slate-100">
                    <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={17} />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Bản đồ điều phối</h2>
                    <p className="mt-1 text-sm text-slate-500">{activeJob.address}</p>
                  </div>
                  <span className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                    <Signal size={16} />
                    Đang online
                  </span>
                </div>

                <div className="relative min-h-[360px] bg-slate-100">
                  <div className="absolute inset-0 opacity-80">
                    <div className="absolute left-[10%] top-0 h-full w-px bg-white" />
                    <div className="absolute left-[34%] top-0 h-full w-px bg-white" />
                    <div className="absolute left-[58%] top-0 h-full w-px bg-white" />
                    <div className="absolute left-[82%] top-0 h-full w-px bg-white" />
                    <div className="absolute left-0 top-[20%] h-px w-full bg-white" />
                    <div className="absolute left-0 top-[48%] h-px w-full bg-white" />
                    <div className="absolute left-0 top-[76%] h-px w-full bg-white" />
                  </div>

                  <div className="absolute left-[12%] top-[18%] flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                    <Home size={17} />
                    Nhà khách
                  </div>

                  <div className="absolute left-[18%] top-[58%] h-3 w-3 rounded-full bg-slate-300" />
                  <div className="absolute left-[77%] top-[25%] h-3 w-3 rounded-full bg-slate-300" />
                  <div className="absolute left-[52%] top-[78%] h-3 w-3 rounded-full bg-slate-300" />

                  <div
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                    style={{ left: `${activeJob.coordinates.x}%`, top: `${activeJob.coordinates.y}%` }}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-900/20 ring-4 ring-white">
                      <Bike size={25} />
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm ring-1 ring-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{activeJob.technician}</p>
                      <p className="text-sm font-bold text-slate-950">{activeJob.eta}</p>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 grid gap-3 rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-slate-200 backdrop-blur md:grid-cols-3">
                    <MapStat icon={<Navigation size={18} />} label="Khoảng cách" value={activeJob.distance} />
                    <MapStat icon={<Clock3 size={18} />} label="ETA" value={activeJob.eta} />
                    <MapStat icon={<Route size={18} />} label="Tiến độ" value={`${activeJob.progress}%`} />
                  </div>
                </div>
              </div>

              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{activeJob.id}</p>
                    <h2 className="mt-1 text-xl font-bold">{activeJob.service}</h2>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${formatStatusClass(activeJob.color)}`}>
                    {activeJob.domain}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                      <UserRound size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{activeJob.technician}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <Star size={15} />
                        {activeJob.rating} điểm đánh giá
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <ActionButton icon={<Phone size={17} />} label="Gọi" />
                    <ActionButton icon={<MessageCircle size={17} />} label="Nhắn tin" />
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <InfoRow icon={<MapPin size={17} />} label="Địa chỉ" value={activeJob.address} />
                  <InfoRow icon={<CalendarClock size={17} />} label="Trạng thái" value={activeJob.status} />
                  <InfoRow icon={<ShieldCheck size={17} />} label="Ưu tiên" value={activeJob.priority} />
                  <InfoRow icon={<Phone size={17} />} label="Số liên hệ" value={activeJob.phone} />
                </div>

                <button
                  onClick={pushUpdate}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <BellRing size={18} />
                  Gửi cập nhật cho khách
                </button>
              </section>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Timeline xử lý</h2>
                    <p className="mt-1 text-sm text-slate-500">Các mốc được đồng bộ từ app kỹ thuật viên.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {activeJob.steps.map((step, index) => (
                    <div key={`${activeJob.id}-${step.label}`} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          step.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                        }`}>
                          {step.done ? <CheckCircle2 size={19} /> : <Clock3 size={18} />}
                        </div>
                        {index < activeJob.steps.length - 1 && <div className="mt-2 h-9 w-px bg-slate-200" />}
                      </div>
                      <div className="min-w-0 pb-2">
                        <h3 className="font-bold text-slate-950">{step.label}</h3>
                        <p className="mt-1 text-sm text-slate-500">{step.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-bold">SLA & checklist</h2>
                <div className="mt-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Hoàn thành ca</p>
                      <p className="mt-1 text-3xl font-bold text-slate-950">{activeJob.progress}%</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                      SLA tốt
                    </span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-sky-500" style={{ width: `${activeJob.progress}%` }} />
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <ChecklistItem label="Định vị GPS hợp lệ" />
                  <ChecklistItem label="Ảnh trước/sau dịch vụ" />
                  <ChecklistItem label="Khách nhận thông báo ETA" />
                  <ChecklistItem label="Biên bản nghiệm thu điện tử" muted />
                </div>
              </section>
            </section>
          </main>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0 rounded-xl bg-white px-3 py-2">
      <p className="truncate text-lg font-bold text-slate-950">{value}</p>
      <p className="truncate text-xs text-slate-500">{label}</p>
    </div>
  );
}

function MapStat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon, label }) {
  return (
    <button className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-slate-300">
      {icon}
      {label}
    </button>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function ChecklistItem({ label, muted = false }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
      <span className={muted ? "text-sm font-semibold text-slate-400" : "text-sm font-semibold text-slate-700"}>
        {label}
      </span>
      {muted ? (
        <Clock3 className="shrink-0 text-slate-400" size={18} />
      ) : (
        <CheckCircle2 className="shrink-0 text-emerald-600" size={18} />
      )}
    </div>
  );
}
