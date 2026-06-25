import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  User,
  Wrench,
} from "lucide-react";
import "./index.css";

const userProfile = {
  name: "Nguyễn Minh Khang",
  tier: "Homecare Plus",
  phone: "0908 245 688",
  email: "khang.nguyen@example.com",
  memberSince: "Thành viên từ 03/2025",
  rating: 4.9,
  completedBookings: 27,
};

const addresses = [
  {
    id: "home",
    label: "Nhà riêng",
    detail: "12 Nguyễn Văn Linh, Phường Tân Phong, Quận 7, TP.HCM",
    note: "Căn hộ A1208, gửi xe tầng B2",
    default: true,
  },
  {
    id: "parent",
    label: "Nhà ba mẹ",
    detail: "88 Lê Văn Sỹ, Phường 11, Quận Phú Nhuận, TP.HCM",
    note: "Gọi trước 15 phút khi đến",
    default: false,
  },
];

const appliances = [
  {
    id: "AC-22",
    name: "Máy lạnh phòng khách",
    brand: "Daikin Inverter 1.5HP",
    status: "Cần vệ sinh",
    nextService: "24/06/2026",
  },
  {
    id: "RF-10",
    name: "Tủ lạnh bếp",
    brand: "Samsung 360L",
    status: "Ổn định",
    nextService: "15/08/2026",
  },
  {
    id: "WM-04",
    name: "Máy giặt ban công",
    brand: "LG 9kg",
    status: "Theo dõi rung",
    nextService: "02/07/2026",
  },
];

const serviceHistory = [
  {
    id: "BK-8492",
    service: "Vệ sinh máy lạnh",
    technician: "Trần Quốc Huy",
    date: "18/06/2026",
    amount: 192000,
    status: "Hoàn tất",
  },
  {
    id: "RP-7731",
    service: "Sửa rò nước lavabo",
    technician: "Phạm Minh Đức",
    date: "09/06/2026",
    amount: 315000,
    status: "Hoàn tất",
  },
  {
    id: "BK-8028",
    service: "Kiểm tra máy giặt",
    technician: "Lê Minh Anh",
    date: "28/05/2026",
    amount: 120000,
    status: "Đã đánh giá",
  },
];

const paymentMethods = [
  { id: "visa", label: "Visa **** 4821", detail: "Mặc định cho thanh toán online" },
  { id: "momo", label: "Ví MoMo", detail: "Đã xác thực số điện thoại" },
];

const notificationOptions = [
  "Nhắc lịch trước khi kỹ thuật viên đến",
  "Báo giá sau khi kiểm tra",
  "Cảnh báo đến hạn bảo trì vật dụng",
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function ProfileApp() {
  const [selectedAddressId, setSelectedAddressId] = useState("home");
  const [addressList, setAddressList] = useState(addresses);
  const [applianceList, setApplianceList] = useState(appliances);
  const [serviceItems, setServiceItems] = useState(serviceHistory);
  const [enabledNotifications, setEnabledNotifications] = useState(
    notificationOptions.slice(0, 2)
  );
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: userProfile.name,
    phone: userProfile.phone,
    email: userProfile.email,
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/profile`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((profile) => {
        if (!profile) {
          return;
        }

        setProfileForm({
          name: profile.name || userProfile.name,
          phone: profile.phone || userProfile.phone,
          email: profile.email || userProfile.email,
        });

        if (profile.address) {
          setAddressList([
            {
              id: profile.id || "home",
              label: "Địa chỉ chính",
              detail: profile.address,
              note: "Đồng bộ từ hồ sơ người dùng",
              default: true,
            },
          ]);
          setSelectedAddressId(profile.id || "home");
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/dashboard`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((dashboard) => {
        if (Array.isArray(dashboard.devices)) {
          setApplianceList(
            dashboard.devices.map((device) => ({
              id: device.id,
              name: device.name,
              brand: device.room,
              status: device.status,
              nextService: device.health < 70 ? "Cần kiểm tra sớm" : "Theo lịch định kỳ",
            }))
          );
        }

        if (Array.isArray(dashboard.bookings)) {
          setServiceItems(
            dashboard.bookings.map((booking) => ({
              id: booking.id,
              service: booking.service,
              technician: booking.technician || "Đang điều phối",
              date: booking.time,
              amount: booking.amount || 0,
              status: booking.status,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const selectedAddress = useMemo(
    () => addressList.find((address) => address.id === selectedAddressId),
    [addressList, selectedAddressId]
  );

  const totalSpent = serviceItems.reduce((sum, item) => sum + item.amount, 0);
  const dueAppliances = applianceList.filter((item) => item.status !== "Ổn định" && item.status !== "Hoạt động ổn định").length;

  const toggleNotification = (option) => {
    setEnabledNotifications((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
    );
  };

  const saveProfile = async () => {
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(profileForm),
      });
      const profile = await response.json();

      if (!response.ok) {
        throw new Error(profile.message || "Không thể lưu hồ sơ");
      }

      setProfileForm({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
      });
      setEditing(false);
      setSaveMessage("Hồ sơ đã được cập nhật cho toàn bộ Super App.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Không thể lưu hồ sơ.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setSaveMessage(""), 3800);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-4 bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-2xl font-bold text-white">
              MK
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                  Profile domain
                </p>
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                  <BadgeCheck size={14} />
                  {userProfile.tier}
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Hồ sơ người dùng
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Quản lý thông tin cá nhân, địa chỉ, vật dụng, thanh toán và cài đặt nhận thông báo dùng chung cho các domain Homecare.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-100 p-2 text-center">
            <Metric value={userProfile.completedBookings} label="Dịch vụ" />
            <Metric value={userProfile.rating} label="Đánh giá" />
            <Metric value={dueAppliances} label="Cần chăm sóc" />
          </div>
        </header>

        {saveMessage && (
          <div className="flex items-center gap-3 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <Check size={18} />
            {saveMessage}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <main className="space-y-6">
            <section className="bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SectionTitle icon={<User size={20} />} title="Thông tin cá nhân" subtitle={userProfile.memberSince} />
                <button
                  onClick={() => (editing ? saveProfile() : setEditing(true))}
                  disabled={saving}
                  className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  {editing ? <Check size={18} /> : <Pencil size={18} />}
                  {saving ? "Đang lưu..." : editing ? "Lưu thay đổi" : "Chỉnh sửa"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <ProfileField
                  icon={<User size={18} />}
                  label="Họ tên"
                  value={profileForm.name}
                  editable={editing}
                  onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))}
                />
                <ProfileField
                  icon={<Phone size={18} />}
                  label="Số điện thoại"
                  value={profileForm.phone}
                  editable={editing}
                  onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))}
                />
                <ProfileField
                  icon={<Mail size={18} />}
                  label="Email"
                  value={profileForm.email}
                  editable={editing}
                  onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))}
                />
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Panel title="Địa chỉ sử dụng dịch vụ" icon={<MapPin size={20} />}>
                <div className="space-y-3">
                  {addressList.map((address) => {
                    const active = selectedAddressId === address.id;

                    return (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`w-full border p-4 text-left transition ${
                          active
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-950">{address.label}</h3>
                              {address.default && (
                                <span className="rounded-md bg-slate-950 px-2 py-1 text-xs font-bold text-white">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-5 text-slate-600">{address.detail}</p>
                            <p className="mt-1 text-sm text-slate-500">{address.note}</p>
                          </div>
                          {active && <Check className="shrink-0 text-cyan-700" size={20} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-300">
                  <Plus size={18} />
                  Thêm địa chỉ
                </button>
              </Panel>

              <Panel title="Ưu tiên phục vụ" icon={<Home size={20} />}>
                <div className="space-y-3 text-sm">
                  <InfoRow label="Địa chỉ đang chọn" value={selectedAddress?.label} />
                  <InfoRow label="Khung giờ quen thuộc" value="13:30 - 18:00" />
                  <InfoRow label="Ngôn ngữ hỗ trợ" value="Tiếng Việt" />
                  <InfoRow label="Tổng đã thanh toán" value={formatCurrency(totalSpent)} />
                </div>
              </Panel>
            </section>

            <section className="bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SectionTitle
                  icon={<Wrench size={20} />}
                  title="Vật dụng đã đăng ký"
                  subtitle="Đồng bộ với domain Appliance để đặt lịch vệ sinh, sửa chữa và bảo trì."
                />
                <button className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-cyan-600 px-4 text-sm font-bold text-white transition hover:bg-cyan-500">
                  <Plus size={18} />
                  Thêm vật dụng
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {applianceList.map((item) => (
                  <article key={item.id} className="border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-cyan-700 ring-1 ring-slate-200">
                        <Home size={18} />
                      </div>
                      <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                        item.status === "Ổn định"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="mt-4 font-bold text-slate-950">{item.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{item.brand}</p>
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      Lịch tiếp theo: {item.nextService}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <SectionTitle
                icon={<CalendarDays size={20} />}
                title="Lịch sử dịch vụ"
                subtitle="Các booking gần đây từ Cleaning, Repair và Booking."
              />

              <div className="mt-5 overflow-hidden border border-slate-200">
                {serviceItems.map((item) => (
                  <article key={item.id} className="grid gap-3 border-b border-slate-200 p-4 last:border-b-0 md:grid-cols-[110px_1fr_150px_120px] md:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.id}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{item.date}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{item.service}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.technician}</p>
                    </div>
                    <p className="font-bold text-slate-950">{formatCurrency(item.amount)}</p>
                    <span className="w-fit rounded-md bg-emerald-50 px-2 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
                      {item.status}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Bảo mật tài khoản</h2>
                  <p className="text-sm text-slate-300">Xác thực cho mọi domain.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SecurityItem title="Số điện thoại" detail="Đã xác thực OTP" checked />
                <SecurityItem title="Email" detail="Đã xác thực" checked />
                <SecurityItem title="Đăng nhập 2 lớp" detail="Chưa bật" />
              </div>

              <button className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-bold text-slate-950 transition hover:bg-slate-100">
                <ShieldCheck size={18} />
                Quản lý bảo mật
              </button>
            </section>

            <Panel title="Thanh toán" icon={<CreditCard size={20} />}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border border-slate-200 bg-slate-50 p-3">
                    <h3 className="font-bold text-slate-950">{method.label}</h3>
                    <p className="mt-1 text-sm text-slate-500">{method.detail}</p>
                  </div>
                ))}
              </div>
              <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-slate-300">
                <Plus size={18} />
                Thêm phương thức
              </button>
            </Panel>

            <Panel title="Thông báo" icon={<Bell size={20} />}>
              <div className="space-y-3">
                {notificationOptions.map((option) => {
                  const checked = enabledNotifications.includes(option);

                  return (
                    <label key={option} className="flex cursor-pointer items-start gap-3 border border-slate-200 bg-slate-50 p-3">
                      <input
                        checked={checked}
                        onChange={() => toggleNotification(option)}
                        className="mt-1 h-4 w-4 accent-cyan-600"
                        type="checkbox"
                      />
                      <span className="text-sm font-semibold leading-5 text-slate-700">{option}</span>
                    </label>
                  );
                })}
              </div>
            </Panel>

            <section className="bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  <Star size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-950">Điểm uy tín</h2>
                  <p className="text-sm text-slate-500">Ưu tiên kỹ thuật viên yêu thích.</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-amber-400" style={{ width: "82%" }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Hoàn tất thanh toán đúng hạn và đánh giá dịch vụ giúp tăng mức ưu tiên khi đặt lịch.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0 rounded-md bg-white px-3 py-2">
      <p className="truncate text-lg font-bold text-slate-950">{value}</p>
      <p className="truncate text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <SectionTitle icon={icon} title={title} subtitle="" />
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ProfileField({ icon, label, value, editable, onChange }) {
  return (
    <label className="block border border-slate-200 bg-slate-50 p-4">
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        {icon}
        {label}
      </span>
      {editable ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-3 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500"
        />
      ) : (
        <span className="mt-3 block break-words text-base font-bold text-slate-950">{value}</span>
      )}
    </label>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-950">{value}</span>
    </div>
  );
}

function SecurityItem({ title, detail, checked = false }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-white/10 bg-white/5 p-3">
      <div>
        <h3 className="font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-300">{detail}</p>
      </div>
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${checked ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-slate-300"}`}>
        {checked && <Check size={16} />}
      </div>
    </div>
  );
}
