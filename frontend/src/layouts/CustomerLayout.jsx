// Ported from legacy/web/src/customer/App.jsx (ShellLayout). Same sidebar, header, notification
// bell and user menu; sign-in/out now goes through useAuth() instead of localStorage.
import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Home as HomeIcon,
  Info,
  PackageCheck,
  Radar,
  Sparkles,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../auth/auth-context';
import { moduleFor } from '../config/modules';
import { apiFetch } from '../lib/api-client';

const navItems = [
  {
    path: '/',
    label: 'Tổng quan',
    icon: HomeIcon,
    eyebrow: 'HomeCare command center',
    title: 'Tổng quan chăm sóc nhà',
    description: 'Theo dõi thiết bị, lịch dịch vụ, kỹ thuật viên và thanh toán trong một màn hình.',
  },
  {
    path: '/cleaning',
    label: 'Vệ sinh',
    icon: Sparkles,
    eyebrow: 'Cleaning domain',
    title: 'Đặt lịch vệ sinh',
    description: 'Quản lý gói vệ sinh, khu vực cần làm sạch và các lịch cleaning đang xử lý.',
  },
  {
    path: '/repair',
    label: 'Sửa chữa',
    icon: Wrench,
    eyebrow: 'Repair domain',
    title: 'Sửa chữa tại nhà',
    description: 'Tiếp nhận sự cố, điều phối kỹ thuật viên và theo dõi ticket sửa chữa.',
  },
  {
    path: '/appliance',
    label: 'Thiết bị',
    icon: PackageCheck,
    eyebrow: 'Appliance domain',
    title: 'Quản lý vật dụng',
    description: 'Theo dõi thiết bị, trạng thái sức khỏe và lịch bảo trì định kỳ.',
  },
  {
    path: '/booking',
    label: 'Đặt lịch',
    icon: ClipboardList,
    eyebrow: 'Booking domain',
    title: 'Đặt dịch vụ',
    description: 'Tạo booking, chọn kỹ thuật viên, add-on và chuẩn bị chuyển sang thanh toán.',
  },
  {
    path: '/tracking',
    label: 'Theo dõi',
    icon: Radar,
    eyebrow: 'Tracking domain',
    title: 'Theo dõi kỹ thuật viên',
    description: 'Giám sát ETA, trạng thái di chuyển và timeline xử lý theo từng booking.',
  },
  {
    path: '/payment',
    label: 'Thanh toán',
    icon: CreditCard,
    eyebrow: 'Payment domain',
    title: 'Thanh toán',
    description: 'Xử lý hóa đơn, phương thức thanh toán và lịch sử giao dịch.',
  },
  {
    path: '/profile',
    label: 'Hồ sơ',
    icon: UserRound,
    eyebrow: 'Profile domain',
    title: 'Hồ sơ người dùng',
    description: 'Quản lý thông tin cá nhân, địa chỉ, bảo mật và ưu tiên phục vụ.',
  },
];

function getPageConfig(pathname) {
  return (
    navItems.filter((item) => item.path !== '/').find((item) => pathname.startsWith(item.path)) ||
    navItems[0]
  );
}

const daysUntil = (dueDate) => {
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
};

const isDueSoon = (dueDate) => {
  if (!dueDate) return false;
  const diffDays = daysUntil(dueDate);
  return diffDays !== null && diffDays <= 7;
};

const formatReminderDue = (dueDate) => {
  if (!dueDate) return 'Chưa đặt hạn';
  const diffDays = daysUntil(dueDate);
  if (diffDays === null) return dueDate;
  if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;
  if (diffDays === 0) return 'Đến hạn hôm nay';
  if (diffDays === 1) return 'Đến hạn ngày mai';
  if (diffDays <= 7) return `Còn ${diffDays} ngày`;
  return new Date(`${dueDate}T00:00:00`).toLocaleDateString('vi-VN');
};

const notificationDotClass = {
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
};

/** Turns GET /dashboard into bell items. TODO(TV1/TV4): replace with the notifications module. */
function buildNotifications(data) {
  const alertItems = Array.isArray(data.alerts) ? data.alerts : [];
  const bookingItems = Array.isArray(data.bookings) ? data.bookings : [];
  const reminderItems = Array.isArray(data.reminders) ? data.reminders : [];
  const dueReminderItems = reminderItems
    .filter((reminder) => reminder.status !== 'done' && isDueSoon(reminder.dueDate))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const paymentBookingItems = bookingItems.filter(
    (booking) =>
      String(booking.status || '')
        .toLowerCase()
        .includes('thanh toán') && !booking.paymentId,
  );
  const activeBookingItems = bookingItems.filter(
    (booking) => !paymentBookingItems.includes(booking),
  );

  return [
    ...alertItems.map((alert) => ({
      id: alert.id,
      title: alert.title,
      description: alert.desc,
      level: alert.level || 'Cảnh báo',
      tone: 'rose',
      path: '/appliance',
    })),
    ...dueReminderItems.slice(0, 5).map((reminder) => ({
      id: `reminder-${reminder.id}`,
      title: reminder.title,
      description: `${reminder.deviceName || 'Thiết bị'} - ${formatReminderDue(reminder.dueDate)}`,
      level: reminder.type || 'Nhắc việc',
      tone: 'amber',
      path: '/appliance',
    })),
    ...paymentBookingItems.slice(0, 4).map((booking) => ({
      id: `payment-${booking.id}`,
      title: `Cần thanh toán ${booking.service}`,
      description: `${booking.status} - ${booking.time}`,
      level: 'Thanh toán',
      tone: 'emerald',
      path: `/payment?bookingId=${encodeURIComponent(booking.id)}`,
    })),
    ...activeBookingItems.slice(0, 2).map((booking) => ({
      id: `booking-${booking.id}`,
      title: booking.service,
      description: `${booking.status} - ${booking.time}`,
      level: booking.domain || 'Booking',
      tone: 'sky',
      path: '/tracking',
    })),
  ];
}

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  const displayName = user?.fullName || user?.email || 'HomeCare';
  const shortName = displayName.split(' ').filter(Boolean).at(-1) || displayName;
  const page = getPageConfig(location.pathname);
  const pageModule = moduleFor(location.pathname);

  useEffect(() => {
    const closeMenu = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setNotificationsOpen(false);
      }
      if (
        event.type === 'mousedown' &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
      if (
        event.type === 'mousedown' &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeMenu);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeMenu);
    };
  }, []);

  useEffect(() => {
    let active = true;
    apiFetch('/dashboard')
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (!active) return;
        setNotifications(buildNotifications(data));
        setNotificationsRead(false);
      })
      .catch(() => {
        if (active) setNotifications([]);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleOpenProfile = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  const toggleNotifications = () => {
    setNotificationsOpen((open) => !open);
    setNotificationsRead(true);
  };

  const unreadCount = notificationsRead ? 0 : notifications.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside
          className={`hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-200 lg:block ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          <div className="sticky top-0 flex h-screen flex-col p-4">
            <div
              className={`flex items-center gap-2 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
            >
              <button
                type="button"
                onClick={() => navigate('/')}
                className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50 ${
                  sidebarCollapsed ? 'justify-center px-2' : ''
                }`}
                title="HomeCare"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 font-bold text-white">
                  HC
                </span>
                {!sidebarCollapsed && (
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-slate-950">HomeCare</span>
                    <span className="block truncate text-xs text-slate-500">Super App</span>
                  </span>
                )}
              </button>

              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                  aria-label="Thu gọn sidebar"
                  title="Thu gọn sidebar"
                >
                  <ChevronLeft size={18} />
                </button>
              )}
            </div>

            {sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="mt-3 flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                aria-label="Mở rộng sidebar"
                title="Mở rộng sidebar"
              >
                <ChevronRight size={18} />
              </button>
            )}

            <nav className="mt-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </nav>

            {!sidebarCollapsed ? (
              <div className="mt-auto rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Đang đăng nhập
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-700">{displayName}</p>
              </div>
            ) : (
              <div
                className="mt-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700"
                title={displayName}
              >
                {shortName[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-slate-50">
            <div className="grid gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  {page.eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{page.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {page.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div ref={notificationsRef} className="relative">
                  <button
                    type="button"
                    onClick={toggleNotifications}
                    className="relative flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs transition hover:border-slate-300"
                    aria-label="Xem thông báo"
                    aria-expanded={notificationsOpen}
                    aria-haspopup="dialog"
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                        <div>
                          <h2 className="font-bold text-slate-950">Thông báo</h2>
                          <p className="text-xs text-slate-500">
                            {notifications.length} cập nhật từ hệ thống
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationsRead(true)}
                          className="text-xs font-bold text-sky-700 hover:text-sky-900"
                        >
                          Đánh dấu đã đọc
                        </button>
                      </div>

                      <div className="max-h-96 overflow-y-auto p-2">
                        {notifications.length > 0 ? (
                          notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setNotificationsOpen(false);
                                if (item.path) navigate(item.path);
                              }}
                              className="w-full rounded-lg p-3 text-left transition hover:bg-slate-50"
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                    notificationDotClass[item.tone] || notificationDotClass.slate
                                  }`}
                                />
                                <span className="min-w-0">
                                  <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                                    {item.level}
                                  </span>
                                  <span className="mt-1 block font-semibold text-slate-950">
                                    {item.title}
                                  </span>
                                  <span className="mt-1 block text-sm leading-5 text-slate-500">
                                    {item.description}
                                  </span>
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-6 text-center text-sm font-semibold text-slate-500">
                            Hiện chưa có thông báo mới.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div ref={userMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex h-14 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left shadow-xs transition hover:border-slate-300"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    {/* Initials instead of the old third-party avatar image (no external request) */}
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
                      {shortName[0]?.toUpperCase() || 'U'}
                    </span>
                    <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-950 sm:inline">
                      {shortName}
                    </span>
                  </button>

                  {menuOpen && (
                    <div
                      className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
                      role="menu"
                    >
                      <button
                        type="button"
                        onClick={handleOpenProfile}
                        className="block w-full px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        role="menuitem"
                      >
                        Hồ sơ người dùng
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        className="block w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        role="menuitem"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            {!pageModule.ready && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <Info size={18} className="mt-0.5 shrink-0" />
                <p>
                  Giao diện đã chuyển sang app mới. Dữ liệu sẽ hiển thị khi API{' '}
                  <b>{pageModule.apiModule}</b> hoàn thành (phụ trách <b>{pageModule.owner}</b>).
                </p>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
