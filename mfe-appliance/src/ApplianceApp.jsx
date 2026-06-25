import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AirVent,
  AlertTriangle,
  CalendarClock,
  Check,
  ClipboardList,
  Droplets,
  Fan,
  Gauge,
  Home,
  Plus,
  Refrigerator,
  Search,
  Settings2,
  ShieldCheck,
  Snowflake,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import "./index.css";

const appliances = [
  {
    id: "APL-1001",
    name: "Máy lạnh phòng khách",
    type: "Máy lạnh",
    room: "Phòng khách",
    brand: "Daikin",
    health: 92,
    energy: "Ổn định",
    nextService: "25/06/2026",
    lastService: "12/04/2026",
    warranty: "Còn 14 tháng",
    status: "Đang hoạt động",
    icon: AirVent,
    accent: "emerald",
  },
  {
    id: "APL-1002",
    name: "Tủ lạnh bếp",
    type: "Tủ lạnh",
    room: "Bếp",
    brand: "Samsung",
    health: 78,
    energy: "Cần tối ưu",
    nextService: "02/07/2026",
    lastService: "09/01/2026",
    warranty: "Còn 8 tháng",
    status: "Cần vệ sinh ron cửa",
    icon: Refrigerator,
    accent: "sky",
  },
  {
    id: "APL-1003",
    name: "Máy giặt ban công",
    type: "Máy giặt",
    room: "Ban công",
    brand: "LG",
    health: 64,
    energy: "Tăng tiêu thụ",
    nextService: "22/06/2026",
    lastService: "28/11/2025",
    warranty: "Hết hạn",
    status: "Cần kiểm tra rung lắc",
    icon: Droplets,
    accent: "amber",
  },
  {
    id: "APL-1004",
    name: "Quạt trần phòng ngủ",
    type: "Quạt",
    room: "Phòng ngủ",
    brand: "Panasonic",
    health: 86,
    energy: "Ổn định",
    nextService: "14/08/2026",
    lastService: "20/03/2026",
    warranty: "Còn 5 tháng",
    status: "Đang hoạt động",
    icon: Fan,
    accent: "violet",
  },
];

const rooms = ["Tất cả", "Phòng khách", "Bếp", "Ban công", "Phòng ngủ"];

const fallbackReminders = [
  {
    id: "RM-FALLBACK-001",
    deviceName: "Máy lạnh phòng khách",
    title: "Vệ sinh lưới lọc máy lạnh",
    type: "Vệ sinh định kỳ",
    domain: "Cleaning",
    dueDate: "2026-06-27",
    note: "Đã hơn 90 ngày từ lần vệ sinh gần nhất.",
    status: "pending",
  },
  {
    id: "RM-FALLBACK-002",
    deviceName: "Máy giặt ban công",
    title: "Kiểm tra ống xả máy giặt",
    type: "Kiểm tra kỹ thuật",
    domain: "Repair",
    dueDate: "2026-06-24",
    note: "Ống xả có dấu hiệu thoát nước chậm.",
    status: "pending",
  },
  {
    id: "RM-FALLBACK-003",
    deviceName: "Tủ lạnh bếp",
    title: "Gia hạn bảo hành tủ lạnh",
    type: "Bảo hành",
    domain: "Appliance",
    dueDate: "2026-07-02",
    note: "Kiểm tra chứng từ bảo hành trước khi hết hạn.",
    status: "pending",
  },
];

const maintenanceHistory = [
  {
    id: "MT-2109",
    appliance: "Máy lạnh phòng khách",
    service: "Vệ sinh định kỳ",
    date: "12/04/2026",
    cost: 180000,
    result: "Hoàn tất",
  },
  {
    id: "MT-2088",
    appliance: "Tủ lạnh bếp",
    service: "Kiểm tra nhiệt độ",
    date: "09/01/2026",
    cost: 120000,
    result: "Theo dõi thêm",
  },
  {
    id: "MT-2064",
    appliance: "Máy giặt ban công",
    service: "Thay ống cấp nước",
    date: "28/11/2025",
    cost: 260000,
    result: "Hoàn tất",
  },
];

const accentClasses = {
  emerald: {
    icon: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    border: "border-emerald-300 bg-emerald-50",
  },
  sky: {
    icon: "bg-sky-100 text-sky-700",
    bar: "bg-sky-500",
    border: "border-sky-300 bg-sky-50",
  },
  amber: {
    icon: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
    border: "border-amber-300 bg-amber-50",
  },
  violet: {
    icon: "bg-violet-100 text-violet-700",
    bar: "bg-violet-500",
    border: "border-violet-300 bg-violet-50",
  },
  rose: {
    icon: "bg-rose-100 text-rose-700",
    bar: "bg-rose-500",
    border: "border-rose-300 bg-rose-50",
  },
};

const typeIcons = {
  "Máy lạnh": AirVent,
  "Tủ lạnh": Refrigerator,
  "Máy giặt": Droplets,
  "Quạt": Fan,
};

const toneByHealth = (health) => {
  if (health < 70) {
    return "amber";
  }

  if (health < 82) {
    return "sky";
  }

  return "emerald";
};

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeAppliance = (device) => {
  const health = Number(device.health || 85);
  const type = device.type || inferType(device.name);

  return {
    ...device,
    id: device.id,
    name: device.name,
    type,
    room: device.room || "Chưa phân phòng",
    brand: device.brand || "Chưa cập nhật",
    health,
    energy: device.energy || "Ổn định",
    nextService: device.nextService || "Theo lịch định kỳ",
    lastService: device.lastService || "Chưa có",
    warranty: device.warranty || "Chưa cập nhật",
    status: device.status || "Đang hoạt động",
    icon: typeIcons[type] || Home,
    accent: device.accent || device.tone || toneByHealth(health),
  };
};

const reminderStatusLabels = {
  pending: "Cần làm",
  scheduled: "Đã đặt lịch",
  done: "Hoàn tất",
};

const reminderStatusClasses = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const normalizeReminder = (reminder) => ({
  ...reminder,
  id: reminder.id,
  title: reminder.title || "Nhắc việc thiết bị",
  type: reminder.type || "Bảo trì",
  domain: reminder.domain || "Appliance",
  deviceName: reminder.deviceName || "Thiết bị",
  dueDate: reminder.dueDate || "",
  note: reminder.note || "",
  status: reminder.status || "pending",
});

const formatDueDate = (value) => {
  if (!value) {
    return "Chưa đặt hạn";
  }

  const dueDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return value;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Ngày mai";
  if (diffDays > 1 && diffDays <= 7) return `Còn ${diffDays} ngày`;
  if (diffDays < 0) return `Quá hạn ${Math.abs(diffDays)} ngày`;

  return dueDate.toLocaleDateString("vi-VN");
};

function inferType(name = "") {
  const value = name.toLowerCase();

  if (value.includes("lạnh")) return "Máy lạnh";
  if (value.includes("tủ lạnh")) return "Tủ lạnh";
  if (value.includes("giặt")) return "Máy giặt";
  if (value.includes("quạt")) return "Quạt";

  return "Thiết bị";
}

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const emptyDeviceForm = {
  name: "",
  type: "Máy lạnh",
  room: "Phòng khách",
  brand: "",
  status: "Đang hoạt động",
  health: 85,
  energy: "Ổn định",
  nextService: "Theo lịch định kỳ",
  lastService: "Chưa có",
  warranty: "Chưa cập nhật",
};

const formFromAppliance = (appliance) => ({
  name: appliance.name || "",
  type: appliance.type || "Thiết bị",
  room: appliance.room || "",
  brand: appliance.brand || "",
  status: appliance.status || "Đang hoạt động",
  health: appliance.health || 85,
  energy: appliance.energy || "Ổn định",
  nextService: appliance.nextService || "Theo lịch định kỳ",
  lastService: appliance.lastService || "Chưa có",
  warranty: appliance.warranty || "Chưa cập nhật",
});

export default function ApplianceApp() {
  const [applianceList, setApplianceList] = useState(appliances);
  const [selectedRoom, setSelectedRoom] = useState("Tất cả");
  const [selectedAppliance, setSelectedAppliance] = useState(appliances[0]);
  const [keyword, setKeyword] = useState("");
  const [reminderList, setReminderList] = useState(fallbackReminders.map(normalizeReminder));
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderActionId, setReminderActionId] = useState("");
  const [toast, setToast] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: "Bảo trì định kỳ",
    type: "Bảo trì",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    note: "",
  });
  const [form, setForm] = useState(emptyDeviceForm);

  useEffect(() => {
    fetch(`${API_BASE_URL}/devices`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        const nextAppliances = items.map(normalizeAppliance);
        setApplianceList(nextAppliances);
        setSelectedAppliance(nextAppliances[0]);
      })
      .catch(() => setApplianceList(appliances));

    fetch(`${API_BASE_URL}/reminders`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items)) {
          return;
        }

        setReminderList(items.map(normalizeReminder));
      })
      .catch(() => setReminderList(fallbackReminders.map(normalizeReminder)));
  }, []);

  const roomOptions = useMemo(
    () => ["Tất cả", ...Array.from(new Set([...rooms.slice(1), ...applianceList.map((item) => item.room)]))],
    [applianceList]
  );

  const filteredAppliances = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return applianceList.filter((item) => {
      const matchedRoom = selectedRoom === "Tất cả" || item.room === selectedRoom;
      const matchedKeyword =
        !normalizedKeyword ||
        `${item.name} ${item.type} ${item.brand} ${item.room}`
          .toLowerCase()
          .includes(normalizedKeyword);

      return matchedRoom && matchedKeyword;
    });
  }, [applianceList, keyword, selectedRoom]);

  const sortedReminders = useMemo(() => {
    const statusWeight = { pending: 0, scheduled: 1, done: 2 };

    return [...reminderList].sort((a, b) => {
      const statusDiff = (statusWeight[a.status] ?? 3) - (statusWeight[b.status] ?? 3);

      if (statusDiff !== 0) {
        return statusDiff;
      }

      return String(a.dueDate).localeCompare(String(b.dueDate));
    });
  }, [reminderList]);

  const averageHealth = Math.round(
    applianceList.reduce((total, item) => total + item.health, 0) / Math.max(applianceList.length, 1)
  );
  const needAttention = applianceList.filter((item) => item.health < 80).length;
  const monthlyCost = maintenanceHistory.reduce((total, item) => total + item.cost, 0);

  const createReminder = async (event) => {
    event.preventDefault();
    setReminderSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...reminderForm,
          deviceId: selectedAppliance.id,
          deviceName: selectedAppliance.name,
          domain: reminderForm.type.includes("Vệ sinh") ? "Cleaning" : "Appliance",
        }),
      });
      const reminder = await response.json();

      if (!response.ok) {
        throw new Error(reminder.message || "Không thể tạo nhắc việc");
      }

      setReminderList((current) => [normalizeReminder(reminder), ...current]);
      setReminderForm({
        title: "Bảo trì định kỳ",
        type: "Bảo trì",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        note: "",
      });
      setToast(`Đã tạo nhắc việc cho ${selectedAppliance.name}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể tạo nhắc việc.");
    } finally {
      setReminderSaving(false);
      window.setTimeout(() => setToast(""), 4200);
    }
  };

  const updateReminderStatus = async (reminder, status, bookingId) => {
    setReminderActionId(reminder.id);

    try {
      const response = await fetch(`${API_BASE_URL}/reminders/${encodeURIComponent(reminder.id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status, bookingId }),
      });
      const updated = await response.json();

      if (!response.ok) {
        throw new Error(updated.message || "Không thể cập nhật nhắc việc");
      }

      setReminderList((current) =>
        current.map((item) => (item.id === reminder.id ? normalizeReminder(updated) : item))
      );
      return updated;
    } finally {
      setReminderActionId("");
    }
  };

  const completeReminder = async (reminder) => {
    try {
      await updateReminderStatus(reminder, "done");
      setToast(`Đã hoàn tất nhắc việc: ${reminder.title}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể hoàn tất nhắc việc.");
    } finally {
      window.setTimeout(() => setToast(""), 4200);
    }
  };

  const scheduleReminder = async (reminder) => {
    const params = new URLSearchParams({
      mode: "maintenance",
      reminderId: reminder.id,
      deviceId: reminder.deviceId || "",
      deviceName: reminder.deviceName || "",
      service: reminder.title,
      domain: reminder.domain || "Appliance",
      dueDate: reminder.dueDate || "",
      note: reminder.note || "",
    });

    window.location.assign(`/booking?${params.toString()}`);
  };

  const scheduleApplianceMaintenance = (appliance = selectedAppliance) => {
    const params = new URLSearchParams({
      mode: "maintenance",
      deviceId: appliance.id || "",
      deviceName: appliance.name || "",
      service: `Bảo trì ${appliance.name || "thiết bị"}`,
      domain: "Appliance",
      dueDate: "",
      note: `${appliance.type || "Thiết bị"} tại ${appliance.room || "nhà"}. Trạng thái hiện tại: ${
        appliance.status || "cần kiểm tra"
      }.`,
    });

    window.location.assign(`/booking?${params.toString()}`);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openAddAppliance = () => {
    setForm(emptyDeviceForm);
    setEditing(false);
    setAdding(true);
  };

  const openEditAppliance = (appliance = selectedAppliance) => {
    setSelectedAppliance(appliance);
    setForm(formFromAppliance(appliance));
    setAdding(false);
    setEditing(true);
  };

  const closeDeviceModal = () => {
    setAdding(false);
    setEditing(false);
  };

  const saveAppliance = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(
        editing
          ? `${API_BASE_URL}/devices/${encodeURIComponent(selectedAppliance.id)}`
          : `${API_BASE_URL}/devices`,
        {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          ...form,
          health: Number(form.health),
          tone: toneByHealth(Number(form.health)),
        }),
      });
      const device = await response.json();

      if (!response.ok) {
        throw new Error(device.message || "Không thể lưu thiết bị");
      }

      const saved = normalizeAppliance(device);
      setApplianceList((current) =>
        editing
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...current]
      );
      setSelectedAppliance(saved);
      setSelectedRoom("Tất cả");
      closeDeviceModal();
      setForm(emptyDeviceForm);
      setToast(editing ? `Đã cập nhật ${saved.name}.` : `Đã thêm thiết bị ${saved.name}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể lưu thiết bị.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setToast(""), 4200);
    }
  };

  return (
    <section className="min-h-screen text-slate-950">
      <div className="flex w-full flex-col gap-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric value={applianceList.length} label="Thiết bị" />
          <Metric value={`${averageHealth}%`} label="Sức khỏe trung bình" />
          <Metric value={needAttention} label="Cần chú ý" />
        </section>

        {toast && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <Check size={18} />
            {toast}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Danh mục thiết bị</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Quản lý theo phòng, loại thiết bị, tình trạng và bảo hành.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white"
                      placeholder="Tìm thiết bị"
                      type="search"
                    />
                  </label>

                  <button
                    onClick={openAddAppliance}
                    className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                  >
                    <Plus size={18} />
                    Thêm thiết bị
                  </button>
                </div>
              </div>

              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
                {roomOptions.map((room) => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                    className={`h-10 shrink-0 rounded-2xl border px-4 text-sm font-semibold transition ${
                      selectedRoom === room
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {filteredAppliances.map((item) => (
                  <ApplianceCard
                    key={item.id}
                    appliance={item}
                    active={selectedAppliance.id === item.id}
                    onSelect={() => setSelectedAppliance(item)}
                    onEdit={() => openEditAppliance(item)}
                  />
                ))}
                {filteredAppliances.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500 md:col-span-2">
                    Không tìm thấy thiết bị phù hợp.
                  </div>
                )}
              </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <Panel title="Hiệu suất" icon={<Gauge size={20} />}>
              <StatLine icon={<Activity size={18} />} label="Sức khỏe trung bình" value={`${averageHealth}%`} />
              <StatLine icon={<Zap size={18} />} label="Chi phí bảo trì" value={formatCurrency(monthlyCost)} />
              <StatLine icon={<TrendingUp size={18} />} label="Thiết bị ổn định" value={`${applianceList.length - needAttention}/${applianceList.length}`} />
            </Panel>

            <Panel title="Nhắc việc" icon={<CalendarClock size={20} />} className="xl:col-span-2">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {sortedReminders.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            {item.deviceName} • {item.type}
                          </p>
                          <h3 className="mt-2 font-bold leading-6 text-slate-950">{item.title}</h3>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${reminderStatusClasses[item.status] || reminderStatusClasses.pending}`}>
                          {reminderStatusLabels[item.status] || item.status}
                        </span>
                      </div>
                      {item.note && <p className="mt-2 text-sm leading-5 text-slate-500">{item.note}</p>}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                          {formatDueDate(item.dueDate)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={item.status === "scheduled" || item.status === "done" || reminderActionId === item.id}
                            onClick={() => scheduleReminder(item)}
                            className="h-9 rounded-xl bg-sky-600 px-3 text-xs font-bold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Đặt lịch
                          </button>
                          <button
                            type="button"
                            disabled={item.status === "done" || reminderActionId === item.id}
                            onClick={() => completeReminder(item)}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Hoàn tất
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {sortedReminders.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                      Chưa có nhắc việc cho tài khoản này.
                    </div>
                  )}
                </div>

                <form onSubmit={createReminder} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-bold text-slate-950">Tạo nhắc việc cho {selectedAppliance.name}</p>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Nội dung</span>
                    <input
                      value={reminderForm.title}
                      onChange={(event) => setReminderForm((current) => ({ ...current, title: event.target.value }))}
                      required
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                    />
                  </label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Loại</span>
                      <select
                        value={reminderForm.type}
                        onChange={(event) => setReminderForm((current) => ({ ...current, type: event.target.value }))}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                      >
                        {["Bảo trì", "Vệ sinh định kỳ", "Kiểm tra kỹ thuật", "Bảo hành"].map((type) => (
                          <option key={type}>{type}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Ngày thực hiện</span>
                      <input
                        value={reminderForm.dueDate}
                        onChange={(event) => setReminderForm((current) => ({ ...current, dueDate: event.target.value }))}
                        required
                        type="date"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">Ghi chú</span>
                    <textarea
                      value={reminderForm.note}
                      onChange={(event) => setReminderForm((current) => ({ ...current, note: event.target.value }))}
                      className="min-h-20 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-400"
                      placeholder="Ví dụ: máy kêu to, cần vệ sinh trước cuối tuần..."
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={reminderSaving}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    <Plus size={16} />
                    {reminderSaving ? "Đang lưu..." : "Thêm nhắc việc"}
                  </button>
                </form>
              </div>
            </Panel>
          </section>

          <section>
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <CalendarClock size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Đặt lịch cho thiết bị</h2>
                  <p className="text-sm text-slate-500">Chuyển sang Booking để chọn thời gian và kỹ thuật viên.</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Thiết bị đang chọn</p>
                <h3 className="mt-2 text-lg font-bold text-slate-950">{selectedAppliance.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedAppliance.type} • {selectedAppliance.room} • {selectedAppliance.brand}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoPill label="Sức khỏe" value={`${selectedAppliance.health}%`} />
                  <InfoPill label="Lịch kế tiếp" value={selectedAppliance.nextService} />
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>
                  Booking sẽ tự nhận thông tin thiết bị này và mở luồng bảo trì để bạn chọn ngày, giờ và kỹ thuật viên phù hợp.
                </p>
                <button
                  type="button"
                  onClick={() => scheduleApplianceMaintenance(selectedAppliance)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <CalendarClock size={18} />
                  Chọn lịch bảo trì
                </button>
              </div>
            </section>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Lịch sử chăm sóc</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Dữ liệu dùng chung cho Booking, Payment và Tracking.
                  </p>
                </div>
                <ClipboardList className="shrink-0 text-slate-400" size={24} />
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                {maintenanceHistory.map((item) => (
                  <article key={item.id} className="grid gap-3 border-b border-slate-200 bg-white p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.id}</p>
                      <h3 className="mt-1 font-bold text-slate-950">{item.service}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.appliance} • {item.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                        {item.result}
                      </span>
                      <span className="min-w-28 text-right font-bold text-slate-950">{formatCurrency(item.cost)}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold">Cảnh báo thông minh</h2>
              <div className="mt-4 space-y-3">
                <PromiseItem icon={<AlertTriangle size={18} />} title="Máy giặt rung mạnh" detail="Gợi ý tạo ticket Repair nếu lặp lại trong 2 lần giặt." />
                <PromiseItem icon={<Snowflake size={18} />} title="Máy lạnh sắp đến hạn" detail="Có thể chuyển nhanh sang đặt lịch Cleaning." />
                <PromiseItem icon={<ShieldCheck size={18} />} title="Hồ sơ bảo hành" detail="Đồng bộ thông tin với Profile để lưu chứng từ." />
              </div>
            </section>
          </section>
        </div>
      </div>

      {(adding || editing) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <form
            onSubmit={saveAppliance}
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editing ? "Cập nhật thiết bị" : "Thêm thiết bị"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Thông tin thiết bị được lưu riêng cho tài khoản đang đăng nhập.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeviceModal}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                Đóng
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormField label="Tên thiết bị">
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                  placeholder="Máy lạnh phòng ngủ"
                />
              </FormField>
              <FormField label="Loại thiết bị">
                <select
                  value={form.type}
                  onChange={(event) => updateForm("type", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                >
                  {["Máy lạnh", "Tủ lạnh", "Máy giặt", "Quạt", "Thiết bị"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Phòng">
                <input
                  value={form.room}
                  onChange={(event) => updateForm("room", event.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                />
              </FormField>
              <FormField label="Thương hiệu">
                <input
                  value={form.brand}
                  onChange={(event) => updateForm("brand", event.target.value)}
                  required
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                  placeholder="Daikin, Samsung..."
                />
              </FormField>
              <FormField label="Trạng thái">
                <input
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                />
              </FormField>
              <FormField label="Sức khỏe (%)">
                <input
                  value={form.health}
                  onChange={(event) => updateForm("health", event.target.value)}
                  min="0"
                  max="100"
                  type="number"
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                />
              </FormField>
              <FormField label="Tiêu thụ điện">
                <input
                  value={form.energy}
                  onChange={(event) => updateForm("energy", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                />
              </FormField>
              <FormField label="Bảo trì gần nhất">
                <input
                  value={form.lastService}
                  onChange={(event) => updateForm("lastService", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                  placeholder="12/04/2026"
                />
              </FormField>
              <FormField label="Lịch kế tiếp">
                <input
                  value={form.nextService}
                  onChange={(event) => updateForm("nextService", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                  placeholder="25/06/2026"
                />
              </FormField>
              <FormField label="Bảo hành">
                <input
                  value={form.warranty}
                  onChange={(event) => updateForm("warranty", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
                />
              </FormField>
            </div>

            <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={closeDeviceModal}
                className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:bg-slate-400"
              >
                {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Lưu thiết bị"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function ApplianceCard({ appliance, active, onSelect, onEdit }) {
  const Icon = appliance.icon;
  const accent = accentClasses[appliance.accent] || accentClasses.emerald;

  return (
    <article
      className={`rounded-2xl border p-4 text-left transition ${
        active ? accent.border : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accent.icon}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{appliance.type}</p>
              <h3 className="mt-1 font-bold text-slate-950">{appliance.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {appliance.brand} • {appliance.room}
              </p>
            </div>
          </div>
          {active && <Check className="shrink-0 text-slate-950" size={20} />}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-600">{appliance.status}</span>
          <span className="font-bold text-slate-950">{appliance.health}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-slate-200">
          <div className={`h-2 rounded-full ${accent.bar}`} style={{ width: `${appliance.health}%` }} />
        </div>
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
      >
        <Settings2 size={16} />
        Cập nhật thông tin
      </button>
    </article>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
      <p className="truncate text-2xl font-bold text-slate-950">{value}</p>
      <p className="truncate text-xs text-slate-500">{label}</p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Panel({ title, icon, children, className = "" }) {
  return (
    <section className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>
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

function StatLine({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <span className="font-bold text-slate-950">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "text-base font-bold text-white" : "text-slate-300"}>{label}</span>
      <span className={strong ? "text-right text-lg font-bold text-sky-300" : "text-right font-semibold text-white"}>{value}</span>
    </div>
  );
}

function PromiseItem({ icon, title, detail }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
