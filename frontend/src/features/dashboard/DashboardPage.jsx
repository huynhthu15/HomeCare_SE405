import { apiFetch } from '../../lib/api-client';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Wrench,
} from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [technician, setTechnician] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    apiFetch(`/dashboard`, {})
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (!active) {
          return;
        }

        setDevices(data.devices || []);
        setBookings(
          (data.bookings || []).map((booking) => ({
            id: booking.id,
            service: booking.service,
            time: booking.time,
            status: booking.status,
            domain: booking.domain,
          })),
        );
        setPayments(
          (data.payments || []).map((payment) => ({
            id: payment.id,
            service: payment.service,
            amount: formatCurrency(payment.amount),
            status: payment.status,
          })),
        );
        setAlerts(data.alerts || []);
        setTechnician(data.technician || null);
        setLoading(false);
      })
      .catch((error) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Không thể tải dashboard.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Thiết bị',
        value: devices.length,
        detail: `${devices.filter((device) => Number(device.health) < 70).length} cần kiểm tra`,
        icon: PackageCheck,
        tone: 'sky',
      },
      {
        label: 'Lịch hẹn',
        value: bookings.length,
        detail: `${bookings.filter((booking) => booking.status !== 'Hoàn thành').length} chưa hoàn tất`,
        icon: CalendarClock,
        tone: 'indigo',
      },
      {
        label: 'Cảnh báo',
        value: alerts.length,
        detail: 'Từ dữ liệu tài khoản',
        icon: AlertTriangle,
        tone: 'rose',
      },
      {
        label: 'Thanh toán',
        value: payments.length,
        detail: 'Giao dịch từ backend',
        icon: WalletCards,
        tone: 'emerald',
      },
    ],
    [alerts.length, bookings.length, devices.length, payments.length],
  );

  const goTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="grid min-h-[520px] place-items-center bg-slate-50">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
          <div className="h-3 w-28 animate-pulse rounded-sm bg-slate-200" />
          <div className="mt-5 h-8 w-3/4 animate-pulse rounded-sm bg-slate-200" />
          <div className="mt-3 h-3 w-full animate-pulse rounded-sm bg-slate-100" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Show the error inline so the dashboard layout stays visible while its API is not ready */}
        {loadError && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800"
          >
            {loadError}
          </div>
        )}
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-xs">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-sky-100">
                  <Activity size={16} />
                  Tổng quan HomeCare
                </div>
                <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
                  {devices.length} thiết bị đang được quản lý, {alerts.length} cảnh báo cần chú ý.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
                  Điều phối nhanh Cleaning, Repair, Appliance, Booking, Tracking và Payment ngay từ
                  dashboard.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <PrimaryButton onClick={() => goTo('/booking')}>
                    <ClipboardList size={18} />
                    Đặt dịch vụ
                  </PrimaryButton>
                  <SecondaryButton onClick={() => goTo('/appliance')}>
                    <Home size={18} />
                    Xem thiết bị
                  </SecondaryButton>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goTo('/tracking')}
                className="rounded-lg border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-400 text-slate-950">
                    <MapPin size={21} />
                  </div>
                  <ArrowUpRight className="text-slate-300" size={20} />
                </div>
                <p className="mt-5 text-sm text-slate-300">Kỹ thuật viên</p>
                <h3 className="mt-1 text-lg font-bold">{technician?.name || 'Chưa phân công'}</h3>
                <p className="mt-1 text-sm text-slate-300">
                  {technician?.status || 'Chưa có cập nhật điều phối'}
                </p>
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {stats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <ActionCard
            icon={Sparkles}
            title="Đặt vệ sinh"
            detail="Cleaning"
            tone="emerald"
            onClick={() => goTo('/cleaning')}
          />
          <ActionCard
            icon={Wrench}
            title="Sửa chữa"
            detail="Repair"
            tone="amber"
            onClick={() => goTo('/repair')}
          />
          <ActionCard
            icon={MapPin}
            title="Theo dõi"
            detail="Tracking"
            tone="sky"
            onClick={() => goTo('/tracking')}
          />
          <ActionCard
            icon={CreditCard}
            title="Thanh toán"
            detail="Payment"
            tone="violet"
            onClick={() => goTo('/payment')}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <main className="space-y-6">
            <Panel
              title="Thiết bị trong nhà"
              description="Sức khỏe, phòng và trạng thái bảo trì"
              action={<ViewAllButton onClick={() => goTo('/appliance')} />}
            >
              <div className="divide-y divide-slate-100">
                {devices.slice(0, 3).map((device) => (
                  <DeviceRow key={device.id} device={device} onClick={() => goTo('/appliance')} />
                ))}
              </div>
            </Panel>

            <Panel
              title="Lịch dịch vụ sắp tới"
              description="Các ca đang chờ xử lý từ Booking"
              action={<ViewAllButton onClick={() => goTo('/booking')} />}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {bookings.slice(0, 4).map((item) => (
                  <BookingCard key={item.id} booking={item} onClick={() => goTo('/booking')} />
                ))}
              </div>
            </Panel>
          </main>

          <aside className="space-y-6">
            <Panel
              title="Theo dõi kỹ thuật viên"
              description={technician?.job || 'Trạng thái điều phối từ booking'}
              action={
                <button
                  type="button"
                  onClick={() => goTo('/tracking')}
                  className="text-sm font-semibold text-sky-700 transition hover:text-sky-900"
                >
                  Chi tiết
                </button>
              }
            >
              <button
                type="button"
                onClick={() => goTo('/tracking')}
                className="w-full rounded-lg bg-sky-50 p-4 text-left transition hover:bg-sky-100"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 ring-1 ring-sky-100">
                    <UserRound size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-950">
                      {technician?.name || 'Chưa phân công kỹ thuật viên'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {technician?.status || 'Chưa có cập nhật điều phối'}
                    </p>
                  </div>
                  <ChevronRight className="text-sky-700" size={19} />
                </div>
              </button>
            </Panel>

            <Panel title="Cảnh báo thiết bị" description="Ưu tiên xử lý trong hôm nay">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} onClick={() => goTo('/appliance')} />
                ))}
              </div>
            </Panel>

            <Panel
              title="Thanh toán gần đây"
              description="Đối soát dịch vụ đã ghi nhận"
              action={<ViewAllButton onClick={() => goTo('/payment')} />}
            >
              <div className="space-y-3">
                {payments.slice(0, 3).map((payment) => (
                  <PaymentItem
                    key={payment.id}
                    payment={payment}
                    onClick={() => goTo('/payment')}
                  />
                ))}
              </div>
            </Panel>
          </aside>
        </div>

        <DashboardFooter onNavigate={goTo} />
      </div>
    </div>
  );
};

const toneClasses = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  sky: 'bg-sky-50 text-sky-700 ring-sky-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
};

const barClasses = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const DashboardFooter = ({ onNavigate }) => {
  const year = new Date().getFullYear();
  const links = [
    { label: 'Đặt lịch', path: '/booking' },
    { label: 'Theo dõi', path: '/tracking' },
    { label: 'Thanh toán', path: '/payment' },
    { label: 'Hồ sơ', path: '/profile' },
  ];

  return (
    <footer className="border-t border-slate-200 py-6">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 font-bold text-white">
            HC
          </div>
          <div>
            <h2 className="font-bold text-slate-950">HomeCare Super App</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Kết nối dịch vụ vệ sinh, sửa chữa, theo dõi kỹ thuật viên và thanh toán trong một hệ
              sinh thái.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          {links.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() => onNavigate(link.path)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} HomeCare. Đồng hành chăm sóc ngôi nhà của bạn.</p>
        <p className="font-semibold text-slate-600">Hỗ trợ 24/7 · Phiên bản dashboard 1.0</p>
      </div>
    </footer>
  );
};

const Panel = ({ title, description, action, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white shadow-xs">
    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const ViewAllButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-sky-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900"
  >
    Xem tất cả
    <ChevronRight size={16} />
  </button>
);

const PrimaryButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-slate-950 transition hover:bg-sky-50"
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm font-bold text-white transition hover:bg-white/10"
  >
    {children}
  </button>
);

const StatCard = ({ label, value, detail, icon: Icon, tone }) => (
  <button
    type="button"
    className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-slate-300"
  >
    <div className="flex items-start justify-between gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${toneClasses[tone]}`}
      >
        <Icon size={19} />
      </div>
      <ArrowUpRight className="text-slate-300" size={18} />
    </div>
    <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{detail}</p>
  </button>
);

const ActionCard = ({ icon: Icon, title, detail, tone, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
  >
    <div className="flex items-center justify-between gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${toneClasses[tone]}`}
      >
        <Icon size={20} />
      </div>
      <ChevronRight className="text-slate-300 transition group-hover:text-slate-600" size={18} />
    </div>
    <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{detail}</p>
  </button>
);

const DeviceRow = ({ device, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="grid w-full gap-4 py-4 text-left transition first:pt-0 last:pb-0 hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:items-center"
  >
    <div className="flex items-start gap-3">
      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${barClasses[device.tone]}`} />
      <div>
        <h3 className="font-bold text-slate-950">{device.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {device.room} · {device.status}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3 sm:min-w-48">
      <div className="h-2 flex-1 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${barClasses[device.tone]}`}
          style={{ width: `${device.health}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-bold text-slate-700">{device.health}%</span>
    </div>
  </button>
);

const BookingCard = ({ booking, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{booking.id}</p>
        <h3 className="mt-1 font-bold text-slate-950">{booking.service}</h3>
      </div>
      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
        {booking.domain}
      </span>
    </div>
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-slate-600">{booking.time}</span>
      <span className="font-bold text-sky-700">{booking.status}</span>
    </div>
  </button>
);

const AlertItem = ({ alert, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full rounded-lg border border-rose-100 bg-rose-50 p-4 text-left transition hover:bg-rose-100"
  >
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-rose-600 ring-1 ring-rose-100">
        <AlertTriangle size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-rose-900">{alert.title}</h3>
          <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-100">
            {alert.level}
          </span>
        </div>
        <p className="mt-1 text-sm text-rose-700">{alert.desc}</p>
      </div>
    </div>
  </button>
);

const PaymentItem = ({ payment, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50"
  >
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-100">
        <ShieldCheck size={18} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate font-bold text-slate-950">{payment.service}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {payment.id} · {payment.status}
        </p>
      </div>
    </div>
    <span className="shrink-0 text-sm font-bold text-emerald-700">{payment.amount}</span>
  </button>
);

export default DashboardPage;
