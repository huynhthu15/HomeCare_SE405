import { apiFetch } from '../../lib/api-client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock3,
  Droplets,
  Gauge,
  Home,
  MapPin,
  Monitor,
  Search,
  ShieldCheck,
  Star,
  TimerReset,
  WalletCards,
  Wrench,
  Zap,
} from 'lucide-react';

const iconByServiceId = {
  'repair-electric': Zap,
  'repair-water': Droplets,
  'repair-electronics': Monitor,
  'repair-general': Wrench,
  'repair-aircon': Gauge,
  'repair-washer': TimerReset,
  'repair-lock-door': ShieldCheck,
  'repair-internet-camera': Monitor,
};

const normalizeCategory = (service) => ({
  id: service.id,
  title: service.title,
  subtitle: service.subtitle || service.description,
  icon: iconByServiceId[service.id] || Wrench,
  basePrice: Number(service.price || service.basePrice || 0),
  response: service.response,
  rating: service.rating,
});

const mapBookingToTicket = (booking) => ({
  id: booking.id,
  service: booking.service,
  technician: booking.technician,
  time: booking.time,
  status: booking.status,
});

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export default function RepairPage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [urgencyLevels, setUrgencyLevels] = useState([]);
  const [urgency, setUrgency] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [diagnosticFee, setDiagnosticFee] = useState(0);
  const [warrantyRate, setWarrantyRate] = useState(0);
  const [warrantyDurationDays, setWarrantyDurationDays] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [address, setAddress] = useState('');
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [tickets, setTickets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(`/services?domain=Repair`),
      apiFetch(`/bookings`),
      apiFetch(`/repair-options`),
      apiFetch(`/profile`),
    ])
      .then(async ([servicesResponse, bookingsResponse, optionsResponse, profileResponse]) => {
        if (
          ![servicesResponse, bookingsResponse, optionsResponse, profileResponse].every(
            (response) => response.ok,
          )
        ) {
          throw new Error('Không thể tải dữ liệu sửa chữa từ máy chủ.');
        }
        return Promise.all([
          servicesResponse.json(),
          bookingsResponse.json(),
          optionsResponse.json(),
          profileResponse.json(),
        ]);
      })
      .then(([services, bookings, options, profile]) => {
        const nextCategories = services.map(normalizeCategory);
        const repairs = bookings
          .filter((booking) => booking.domain === 'Repair')
          .slice(-4)
          .reverse()
          .map(mapBookingToTicket);

        setCategories(nextCategories);
        setSelectedCategory(nextCategories[0] || null);
        setTickets(repairs);
        setUrgencyLevels(options.urgencyLevels || []);
        setUrgency(options.urgencyLevels?.[0] || null);
        setTimeSlots(options.timeSlots || []);
        setSelectedTime(options.timeSlots?.[0] || '');
        setRooms(options.rooms || []);
        setSelectedRoom(options.rooms?.[0] || '');
        setDiagnosticFee(Number(options.diagnosticFee || 0));
        setWarrantyRate(Number(options.warrantyRate || 0));
        setWarrantyDurationDays(Number(options.warrantyDurationDays || 0));
        setAddress(profile.address || '');
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu sửa chữa.');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCategories = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return categories;
    }

    return categories.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(normalizedKeyword),
    );
  }, [keyword, categories]);

  const inspectionFee = selectedCategory?.basePrice || 0;
  const subtotal = inspectionFee + (urgency?.fee || 0) + diagnosticFee;
  const warrantyFee = Math.round(subtotal * warrantyRate);
  const total = subtotal + warrantyFee;

  const confirmRepair = async () => {
    if (!selectedCategory || !urgency || !selectedTime) {
      setRequestStatus('Chọn dịch vụ, mức độ và khung giờ từ dữ liệu máy chủ.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch(`/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedCategory.title,
          domain: 'Repair',
          time: `Hôm nay, ${selectedTime}`,
          technician: '',
          // TODO(owner): server computes the price — stop sending it (docs/frontend-migration.md §5.2)
          amount: total,
          address,
          note: `${device} - ${selectedRoom}: ${issue}`,
          addOns: [urgency.label],
        }),
      });
      const booking = await response.json();

      if (!response.ok) {
        throw new Error(booking.message || 'Không thể tạo yêu cầu sửa chữa');
      }

      setTickets((current) => [mapBookingToTicket(booking), ...current]);
      setRequestStatus(`Đã lưu yêu cầu ${booking.id} cho ${selectedCategory.title.toLowerCase()}.`);
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : 'Không thể lưu yêu cầu sửa chữa.');
    } finally {
      setSaving(false);
      window.setTimeout(() => setRequestStatus(''), 4200);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <Wrench size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
                Repair domain
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                Sửa chữa điện, nước và thiết bị gia đình
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Tiếp nhận sự cố, điều phối kỹ thuật viên, báo giá tạm tính và theo dõi ticket sửa
                chữa trong ứng dụng HomeCare.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 p-2 text-center">
            <Metric value={tickets.length} label="Yêu cầu sửa chữa" />
            <Metric value={categories.length} label="Nhóm dịch vụ" />
            <Metric
              value={tickets.filter((ticket) => ticket.status === 'Hoàn thành').length}
              label="Hoàn tất"
            />
          </div>
        </header>

        {requestStatus && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
            <Check size={18} />
            {requestStatus}
          </div>
        )}
        {loadError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          >
            {loadError}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <main className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Nhóm dịch vụ sửa chữa</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn domain lỗi để hệ thống gợi ý kỹ thuật viên phù hợp.
                  </p>
                </div>

                <label className="relative block w-full md:w-72">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-hidden transition focus:border-orange-400 focus:bg-white"
                    placeholder="Tìm sự cố"
                    type="search"
                  />
                </label>
              </div>

              <div className="mt-5 max-h-[430px] overflow-y-auto pr-2">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredCategories.map((item) => {
                    const active = selectedCategory.id === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedCategory(item)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-orange-400 bg-orange-50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                            >
                              <Icon size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-950">{item.title}</h3>
                              <p className="mt-1 text-sm leading-5 text-slate-500">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>
                          {active && <Check className="shrink-0 text-orange-600" size={20} />}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          {item.response && (
                            <span className="flex items-center gap-1">
                              <Clock3 size={16} />
                              {item.response}
                            </span>
                          )}
                          {item.rating != null && (
                            <span className="flex items-center gap-1">
                              <Star size={16} />
                              {item.rating}
                            </span>
                          )}
                          <span className="font-bold text-slate-950">
                            {formatCurrency(item.basePrice)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {!loading && categories.length === 0 && (
                  <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Máy chủ chưa có danh mục dịch vụ sửa chữa.
                  </p>
                )}
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Panel title="Mức độ & lịch hẹn" icon={<AlertTriangle size={20} />}>
                <div className="grid gap-3">
                  {urgencyLevels.map((level) => {
                    const active = urgency?.id === level.id;

                    return (
                      <button
                        key={level.id}
                        onClick={() => setUrgency(level)}
                        className={`flex min-h-12 items-center justify-between rounded-2xl border px-3 text-left text-sm font-semibold transition ${
                          active
                            ? 'border-rose-400 bg-rose-50 text-rose-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{level.label}</span>
                        <span className="text-right text-xs font-bold">
                          {level.eta} · {formatCurrency(level.fee)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-11 rounded-2xl border text-sm font-semibold transition ${
                        selectedTime === slot
                          ? 'border-sky-500 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Vị trí & thiết bị" icon={<Home size={20} />}>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin size={16} />
                    Địa chỉ
                  </span>
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-hidden transition focus:border-sky-400 focus:bg-white"
                  />
                </label>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {rooms.map((room) => {
                    const active = selectedRoom === room;

                    return (
                      <button
                        key={room}
                        onClick={() => setSelectedRoom(room)}
                        className={`min-h-11 rounded-2xl border px-3 text-sm font-semibold transition ${
                          active
                            ? 'border-teal-400 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {room}
                      </button>
                    );
                  })}
                </div>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Thiết bị hoặc hạng mục
                  </span>
                  <input
                    value={device}
                    onChange={(event) => setDevice(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-hidden transition focus:border-teal-400 focus:bg-white"
                  />
                </label>
              </Panel>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="grid gap-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ClipboardCheck size={16} />
                    Mô tả sự cố
                  </span>
                  <textarea
                    value={issue}
                    onChange={(event) => setIssue(event.target.value)}
                    className="min-h-36 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-hidden transition focus:border-orange-400 focus:bg-white"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Ticket sửa chữa đang xử lý</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Theo dõi tiến độ các yêu cầu thuộc domain Repair.
                  </p>
                </div>
              </div>

              <div className="mt-5 max-h-[300px] space-y-4 overflow-y-auto pr-2">
                {tickets.map((ticket) => (
                  <article
                    key={ticket.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          {ticket.id}
                        </p>
                        <h3 className="mt-1 font-bold text-slate-950">{ticket.service}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {ticket.technician || 'Chưa phân công kỹ thuật viên'} · {ticket.time}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                        {ticket.status}
                      </span>
                    </div>
                  </article>
                ))}
                {!loading && tickets.length === 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Chưa có yêu cầu sửa chữa.
                  </p>
                )}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <WalletCards size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Báo giá tạm tính</h2>
                  <p className="text-sm text-slate-300">Chốt giá sau khi kiểm tra thực tế.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Dịch vụ" value={selectedCategory?.title || 'Chưa chọn'} />
                <SummaryRow label="Thiết bị" value={device || 'Chưa nhập'} />
                <SummaryRow label="Khu vực" value={selectedRoom} />
                <SummaryRow label="Lịch hẹn" value={`Hôm nay, ${selectedTime}`} />
                <SummaryRow label="Phí kiểm tra" value={formatCurrency(inspectionFee)} />
                <SummaryRow label="Mức độ" value={formatCurrency(urgency?.fee || 0)} />
                <SummaryRow label="Chẩn đoán" value={formatCurrency(diagnosticFee)} />
                <SummaryRow
                  label={`Bảo hành (${warrantyDurationDays} ngày)`}
                  value={formatCurrency(warrantyFee)}
                />
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <SummaryRow label="Tổng tạm tính" value={formatCurrency(total)} strong />
                <button
                  onClick={confirmRepair}
                  disabled={
                    !selectedCategory ||
                    !urgency ||
                    !selectedTime ||
                    !address.trim() ||
                    !device.trim() ||
                    !issue.trim() ||
                    saving
                  }
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-orange-400 text-sm font-bold text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  <CalendarDays size={18} />
                  {saving ? 'Đang lưu...' : 'Tạo yêu cầu sửa chữa'}
                </button>
              </div>
            </section>
          </aside>
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

function Panel({ title, icon, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
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

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'text-base font-bold text-white' : 'text-slate-300'}>{label}</span>
      <span
        className={
          strong ? 'text-xl font-bold text-orange-300' : 'text-right font-semibold text-white'
        }
      >
        {value}
      </span>
    </div>
  );
}
