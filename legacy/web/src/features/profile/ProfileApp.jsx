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
  User,
  Wrench,
} from "lucide-react";
import "./index.css";

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
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [profile, setProfile] = useState(null);
  const [addressList, setAddressList] = useState([]);
  const [applianceList, setApplianceList] = useState([]);
  const [serviceItems, setServiceItems] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [notificationOptions, setNotificationOptions] = useState([]);
  const [enabledNotifications, setEnabledNotifications] = useState([]);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/profile`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE_URL}/dashboard`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE_URL}/payment-methods`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE_URL}/profile-options`),
    ])
      .then(async ([profileResponse, dashboardResponse, methodsResponse, optionsResponse]) => {
        if (![profileResponse, dashboardResponse, methodsResponse, optionsResponse].every((response) => response.ok)) {
          throw new Error("Không thể tải hồ sơ từ máy chủ.");
        }

        return Promise.all([
          profileResponse.json(),
          dashboardResponse.json(),
          methodsResponse.json(),
          optionsResponse.json(),
        ]);
      })
      .then(([profileData, dashboard, methods, options]) => {
        setProfile(profileData);
        setProfileForm({
          name: profileData.name || "",
          phone: profileData.phone || "",
          email: profileData.email || "",
        });
        if (profileData.address) {
          const address = {
            id: profileData.id,
            label: "Địa chỉ dịch vụ",
            detail: profileData.address,
            note: "",
            default: true,
          };
          setAddressList([address]);
          setSelectedAddressId(address.id);
        }
        setApplianceList(
          dashboard.devices.map((device) => ({
            id: device.id,
            name: device.name,
            brand: device.brand || device.room,
            status: device.status,
            health: device.health,
            nextService: device.nextService || "Chưa cập nhật",
          }))
        );
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
        setPaymentMethods(
          methods.map((method) => ({
            id: method.id,
            label: method.name,
            detail: method.detail,
          }))
        );
        setNotificationOptions(options.notificationOptions || []);
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Không thể tải hồ sơ.");
      });
  }, []);

  const selectedAddress = useMemo(
    () => addressList.find((address) => address.id === selectedAddressId),
    [addressList, selectedAddressId]
  );

  const totalSpent = serviceItems.reduce((sum, item) => sum + item.amount, 0);
  const completedServices = serviceItems.filter((item) =>
    ["Hoàn tất", "Hoàn thành", "Đã thanh toán", "Thành công"].includes(item.status)
  ).length;
  const dueAppliances = applianceList.filter((item) => Number(item.health) < 70).length;

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
      setProfile(profile);
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
              {(profileForm.name || "HC").split(/\s+/).slice(-1)[0].slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                  Profile domain
                </p>
                {profile?.tier && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                    <BadgeCheck size={14} />
                    {profile.tier}
                  </span>
                )}
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
            <Metric value={completedServices} label="Dịch vụ hoàn tất" />
            <Metric value={serviceItems.length} label="Tổng dịch vụ" />
            <Metric value={dueAppliances} label="Cần chăm sóc" />
          </div>
        </header>

        {loadError && (
          <div role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {loadError}
          </div>
        )}

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
                <SectionTitle icon={<User size={20} />} title="Thông tin cá nhân" subtitle="Thông tin được đồng bộ từ hồ sơ tài khoản." />
                <button
                  onClick={() => (editing ? saveProfile() : setEditing(true))}
                  disabled={saving || !profile}
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
