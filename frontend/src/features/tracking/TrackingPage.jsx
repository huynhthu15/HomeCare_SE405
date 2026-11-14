import { apiFetch } from '../../lib/api-client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Radar,
  Search,
  UserRound,
  Wrench,
} from 'lucide-react';

const colorByDomain = {
  Cleaning: 'emerald',
  Repair: 'sky',
  Appliance: 'amber',
  Booking: 'sky',
};

const mapBookingToJob = (booking) => ({
  id: booking.id,
  service: booking.service,
  domain: booking.domain || 'Booking',
  address: booking.address,
  technician: booking.technician,
  time: booking.time,
  note: booking.note,
  createdAt: booking.createdAt,
  status: booking.status,
  color: colorByDomain[booking.domain] || 'sky',
});

const emptyTrackingJob = {
  id: '—',
  service: 'Chưa có booking để theo dõi',
  domain: '—',
  status: 'Chưa có dữ liệu',
  color: 'sky',
  address: '',
  time: '',
  technician: '',
  note: '',
  createdAt: '',
};

const formatStatusClass = (color) => {
  const variants = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return variants[color] || variants.sky;
};

export default function TrackingPage() {
  const [trackingJobs, setTrackingJobs] = useState([]);
  const [opsAlerts, setOpsAlerts] = useState([]);
  const [activeJobId, setActiveJobId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([apiFetch(`/bookings`), apiFetch(`/dashboard`)])
      .then(async ([bookingsResponse, dashboardResponse]) => {
        if (!bookingsResponse.ok || !dashboardResponse.ok) {
          throw new Error('Không thể tải dữ liệu theo dõi từ máy chủ.');
        }
        return Promise.all([bookingsResponse.json(), dashboardResponse.json()]);
      })
      .then(([bookings, dashboard]) => {
        const nextJobs = bookings.map(mapBookingToJob);
        setTrackingJobs(nextJobs);
        setActiveJobId(nextJobs[0]?.id || '');
        setOpsAlerts(dashboard.alerts.map((alert) => `${alert.title}: ${alert.desc}`));
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu theo dõi.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Placeholder keeps the detail panel renderable while there are no bookings (API not wired yet).
  const activeJob = trackingJobs.find((job) => job.id === activeJobId) ?? emptyTrackingJob;

  const filteredJobs = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    if (!value) {
      return trackingJobs;
    }

    return trackingJobs.filter((job) =>
      `${job.id} ${job.service} ${job.technician || ''} ${job.status}`
        .toLowerCase()
        .includes(value),
    );
  }, [keyword, trackingJobs]);

  if (loading) {
    return <p className="p-8 text-center text-slate-600">Đang tải dữ liệu theo dõi...</p>;
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
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
                  Giám sát ETA, tiến độ xử lý và các cập nhật vận hành từ Cleaning, Repair,
                  Appliance và Booking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 p-2 text-center">
              <Metric value={trackingJobs.length} label="Tổng booking" />
              <Metric
                value={trackingJobs.filter((job) => job.technician).length}
                label="Đã có kỹ thuật viên"
              />
              <Metric
                value={trackingJobs.filter((job) => job.status !== 'Hoàn thành').length}
                label="Chưa hoàn tất"
              />
            </div>
          </div>
        </header>

        {loadError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          >
            {loadError}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Ca đang theo dõi</h2>
                  <p className="mt-1 text-sm text-slate-500">Đồng bộ từ các domain dịch vụ.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                  {loading ? '…' : filteredJobs.length}
                </span>
              </div>

              <label className="relative mt-4 block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-hidden transition focus:border-sky-400 focus:bg-white"
                  placeholder="Tìm mã, khách, kỹ thuật viên"
                  type="search"
                />
              </label>

              <div className="mt-4 space-y-3">
                {filteredJobs.map((job) => {
                  const active = job.id === activeJobId;

                  return (
                    <button
                      key={job.id}
                      onClick={() => setActiveJobId(job.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-sky-300 bg-sky-50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            {job.id}
                          </p>
                          <h3 className="mt-1 font-bold text-slate-950">{job.service}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {job.technician || 'Chưa phân công kỹ thuật viên'}
                          </p>
                        </div>
                        <ChevronRight
                          className={active ? 'text-sky-600' : 'text-slate-300'}
                          size={20}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${formatStatusClass(job.color)}`}
                        >
                          {job.status}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">{job.time}</span>
                      </div>
                    </button>
                  );
                })}
                {!loading && filteredJobs.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    {trackingJobs.length
                      ? 'Không tìm thấy booking phù hợp.'
                      : 'Chưa có booking để theo dõi.'}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <BellRing size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Tín hiệu vận hành</h2>
                  <p className="text-sm text-slate-300">Cảnh báo từ dữ liệu tài khoản.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {opsAlerts.map((alert) => (
                  <div
                    key={alert}
                    className="flex gap-3 rounded-2xl bg-white/10 p-3 text-sm leading-5 text-slate-100"
                  >
                    <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={17} />
                    <span>{alert}</span>
                  </div>
                ))}
                {opsAlerts.length === 0 && (
                  <p className="rounded-2xl bg-white/10 p-3 text-sm text-slate-300">
                    Không có cảnh báo.
                  </p>
                )}
              </div>
            </section>
          </aside>

          <main className="space-y-6">
            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="overflow-hidden rounded-3xl bg-white shadow-xs ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Thông tin lịch hẹn</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeJob.address || 'Chưa có địa chỉ'}
                    </p>
                  </div>
                  <span
                    className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-bold ${formatStatusClass(activeJob.color)}`}
                  >
                    <Radar size={16} />
                    {activeJob.status}
                  </span>
                </div>

                <div className="grid min-h-[260px] place-items-center bg-slate-100 p-6 text-center">
                  <div className="max-w-md">
                    <MapPin className="mx-auto text-slate-500" size={32} />
                    <p className="mt-3 font-semibold text-slate-800">
                      Chưa có dữ liệu vị trí trực tiếp
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Trạng thái lịch hẹn được cập nhật từ backend. Vị trí và ETA chỉ hiển thị khi
                      kỹ thuật viên gửi dữ liệu GPS.
                    </p>
                  </div>
                </div>
              </div>

              <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {activeJob.id}
                    </p>
                    <h2 className="mt-1 text-xl font-bold">{activeJob.service}</h2>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${formatStatusClass(activeJob.color)}`}
                  >
                    {activeJob.domain}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200">
                      <UserRound size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">
                        {activeJob.technician || 'Chưa phân công kỹ thuật viên'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">Kỹ thuật viên phụ trách</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <InfoRow
                    icon={<MapPin size={17} />}
                    label="Địa chỉ"
                    value={activeJob.address || 'Chưa cập nhật'}
                  />
                  <InfoRow
                    icon={<CalendarClock size={17} />}
                    label="Thời gian hẹn"
                    value={activeJob.time || 'Chưa lên lịch'}
                  />
                </div>
              </section>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Timeline xử lý</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Thông tin trạng thái được lấy từ booking.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <InfoRow
                    icon={<CheckCircle2 size={17} />}
                    label="Trạng thái hiện tại"
                    value={activeJob.status}
                  />
                  <InfoRow
                    icon={<Clock3 size={17} />}
                    label="Đặt lúc"
                    value={
                      activeJob.createdAt
                        ? new Date(activeJob.createdAt).toLocaleString('vi-VN')
                        : 'Chưa có dữ liệu'
                    }
                  />
                </div>
              </section>

              <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
                <h2 className="text-lg font-bold">Ghi chú dịch vụ</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {activeJob.note || 'Booking chưa có ghi chú.'}
                </p>
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
