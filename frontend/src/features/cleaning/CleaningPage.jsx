import { apiFetch } from '../../lib/api-client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SprayCan,
  Star,
  TimerReset,
  WalletCards,
} from 'lucide-react';

const normalizePackage = (service) => ({
  id: service.id,
  title: service.title,
  subtitle: service.subtitle || service.description,
  includedAreas:
    service.includedAreas ||
    (service.subtitle || service.description || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  price: Number(service.price || 0),
  duration: service.duration,
  rating: Number(service.rating ?? 0),
});

const mapBookingToJob = (booking) => ({
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

export default function CleaningPage() {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [platformFee, setPlatformFee] = useState(0);
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [bookingStatus, setBookingStatus] = useState('');
  const [jobs, setJobs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(`/services?domain=Cleaning`),
      apiFetch(`/bookings`),
      apiFetch(`/booking-options`),
    ])
      .then(async ([servicesResponse, bookingsResponse, optionsResponse]) => {
        if (!servicesResponse.ok || !bookingsResponse.ok || !optionsResponse.ok) {
          throw new Error('Không thể tải dữ liệu vệ sinh từ máy chủ.');
        }

        return Promise.all([
          servicesResponse.json(),
          bookingsResponse.json(),
          optionsResponse.json(),
        ]);
      })
      .then(([serviceItems, bookingItems, options]) => {
        const nextPackages = serviceItems.map(normalizePackage);
        const nextTimeSlots = Array.isArray(options.cleaningTimeSlots)
          ? options.cleaningTimeSlots
          : [];

        setPackages(nextPackages);
        setSelectedPackage(nextPackages[0] || null);
        setTimeSlots(nextTimeSlots);
        setSelectedTime(nextTimeSlots[0] || '');
        setPlatformFee(Number(options.cleaningPlatformFee || 0));
        setJobs(
          bookingItems
            .filter((booking) => booking.domain === 'Cleaning')
            .slice(-4)
            .reverse()
            .map(mapBookingToJob),
        );
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu vệ sinh.');
      });
  }, []);

  const filteredPackages = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return packages.filter((item) => {
      const matchKeyword =
        !normalizedKeyword ||
        `${item.title} ${item.subtitle} ${item.includedAreas.join(' ')}`
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchPrice =
        priceFilter === 'all' ||
        (priceFilter === 'under300' && item.price < 300000) ||
        (priceFilter === 'from300' && item.price >= 300000);
      const durationValue = Number.parseInt(item.duration, 10) || 0;
      const matchDuration =
        durationFilter === 'all' ||
        (durationFilter === 'quick' && durationValue <= 90) ||
        (durationFilter === 'deep' && durationValue > 90);
      const matchRating = ratingFilter === 'all' || item.rating >= 4.8;
      return matchKeyword && matchPrice && matchDuration && matchRating;
    });
  }, [durationFilter, keyword, packages, priceFilter, ratingFilter]);

  const total = (selectedPackage?.price || 0) + platformFee;
  const averageRating = packages.length
    ? (packages.reduce((sum, item) => sum + item.rating, 0) / packages.length).toFixed(1)
    : '—';

  const confirmBooking = async () => {
    if (!selectedPackage || !selectedTime || !address.trim()) {
      setBookingStatus('Vui lòng chọn dịch vụ, khung giờ và nhập địa chỉ.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch(`/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedPackage.title,
          domain: 'Cleaning',
          time: `Hôm nay, ${selectedTime}`,
          technician: '',
          // TODO(owner): server computes the price — stop sending it (docs/frontend-migration.md §5.2)
          amount: total,
          address,
          note,
          addOns: selectedPackage.includedAreas,
        }),
      });
      const booking = await response.json();

      if (!response.ok) {
        throw new Error(booking.message || 'Không thể tạo lịch vệ sinh');
      }

      setJobs((current) => [mapBookingToJob(booking), ...current]);
      setBookingStatus(`Đã lưu lịch ${booking.id} cho ${selectedPackage.title.toLowerCase()}.`);
    } catch (error) {
      setBookingStatus(error instanceof Error ? error.message : 'Không thể lưu lịch vệ sinh.');
    } finally {
      setSaving(false);
      window.setTimeout(() => setBookingStatus(''), 4200);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                Cleaning domain
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                Đặt lịch vệ sinh vật dụng gia đình
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Chọn gói vệ sinh đã bao gồm sẵn phạm vi xử lý, đặt thời gian và theo dõi kỹ thuật
                viên.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 p-2 text-center">
            <Metric value={jobs.length} label="Lịch vệ sinh" />
            <Metric value={averageRating} label="Đánh giá dịch vụ" />
            <Metric value={packages.length} label="Gói dịch vụ" />
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

        {bookingStatus && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <Check size={18} />
            {bookingStatus}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <main className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Gói vệ sinh</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Mỗi gói đã bao gồm sẵn khu vực và hạng mục vệ sinh.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block w-full md:w-72">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-hidden transition focus:border-emerald-400 focus:bg-white"
                      placeholder="Tìm dịch vụ"
                      type="search"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFilters((open) => !open)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                      showFilters ||
                      priceFilter !== 'all' ||
                      durationFilter !== 'all' ||
                      ratingFilter !== 'all'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <SlidersHorizontal size={18} />
                    Bộ lọc
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
                  <FilterGroup label="Khoảng giá">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={priceFilter === 'all'}
                        onClick={() => setPriceFilter('all')}
                      >
                        Tất cả
                      </FilterChip>
                      <FilterChip
                        active={priceFilter === 'under300'}
                        onClick={() => setPriceFilter('under300')}
                      >
                        Dưới 300.000đ
                      </FilterChip>
                      <FilterChip
                        active={priceFilter === 'from300'}
                        onClick={() => setPriceFilter('from300')}
                      >
                        Từ 300.000đ
                      </FilterChip>
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Thời lượng">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={durationFilter === 'all'}
                        onClick={() => setDurationFilter('all')}
                      >
                        Tất cả
                      </FilterChip>
                      <FilterChip
                        active={durationFilter === 'quick'}
                        onClick={() => setDurationFilter('quick')}
                      >
                        Tối đa 90 phút
                      </FilterChip>
                      <FilterChip
                        active={durationFilter === 'deep'}
                        onClick={() => setDurationFilter('deep')}
                      >
                        Chuyên sâu
                      </FilterChip>
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Đánh giá">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={ratingFilter === 'all'}
                        onClick={() => setRatingFilter('all')}
                      >
                        Tất cả
                      </FilterChip>
                      <FilterChip
                        active={ratingFilter === 'high'}
                        onClick={() => setRatingFilter('high')}
                      >
                        Từ 4.8 sao
                      </FilterChip>
                    </div>
                  </FilterGroup>

                  <button
                    type="button"
                    onClick={() => {
                      setPriceFilter('all');
                      setDurationFilter('all');
                      setRatingFilter('all');
                    }}
                    className="h-10 w-fit rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 lg:col-span-3"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              <div className="mt-5 max-h-[430px] overflow-y-auto pr-2">
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPackages.map((item) => {
                    const active = selectedPackage?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedPackage(item)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          active
                            ? 'border-emerald-400 bg-emerald-50 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                            >
                              <SprayCan size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-950">{item.title}</h3>
                              <p className="mt-1 text-sm leading-5 text-slate-500">
                                {item.subtitle}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.includedAreas.slice(0, 4).map((area) => (
                                  <span
                                    key={area}
                                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          {active && <Check className="shrink-0 text-emerald-600" size={20} />}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock3 size={16} />
                            {item.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={16} />
                            {item.rating}
                          </span>
                          <span className="font-bold text-slate-950">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {filteredPackages.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500 md:col-span-2">
                      Không có gói vệ sinh phù hợp hoặc chưa có dữ liệu từ máy chủ.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <Panel title="Thời gian & địa chỉ" icon={<CalendarDays size={20} />}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2">
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
                  {timeSlots.length === 0 && (
                    <p className="col-span-full text-sm text-slate-500">
                      Chưa có khung giờ khả dụng.
                    </p>
                  )}
                </div>

                <label className="mt-4 block">
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
              </Panel>

              <Panel title="Ghi chú dịch vụ" icon={<SprayCan size={20} />}>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Ghi chú cho kỹ thuật viên
                  </span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-hidden transition focus:border-amber-400 focus:bg-white"
                  />
                </label>
              </Panel>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Lịch vệ sinh đang xử lý</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Theo dõi các booking thuộc domain Cleaning.
                  </p>
                </div>
              </div>

              <div className="mt-5 max-h-[300px] space-y-4 overflow-y-auto pr-2">
                {jobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          {job.id}
                        </p>
                        <h3 className="mt-1 font-bold text-slate-950">{job.service}</h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {job.technician || 'Chưa phân công kỹ thuật viên'} • {job.time}
                        </p>
                      </div>
                      <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                        {job.status}
                      </span>
                    </div>
                  </article>
                ))}
                {jobs.length === 0 && (
                  <p className="text-sm text-slate-500">Chưa có lịch vệ sinh.</p>
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
                  <h2 className="font-bold">Tóm tắt đặt lịch</h2>
                  <p className="text-sm text-slate-300">Thanh toán sau khi hoàn tất.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Dịch vụ" value={selectedPackage?.title || 'Chưa chọn'} />
                <SummaryRow label="Thời gian" value={`Hôm nay, ${selectedTime}`} />
                <SummaryRow
                  label="Phạm vi"
                  value={`${selectedPackage?.includedAreas.length || 0} hạng mục`}
                />
                <SummaryRow
                  label="Phí dịch vụ"
                  value={formatCurrency(selectedPackage?.price || 0)}
                />
                <SummaryRow label="Nền tảng" value={formatCurrency(platformFee)} />
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <SummaryRow label="Tổng tạm tính" value={formatCurrency(total)} strong />
                <button
                  onClick={confirmBooking}
                  disabled={!address.trim() || !selectedPackage || !selectedTime || saving}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  <ShieldCheck size={18} />
                  {saving ? 'Đang lưu...' : 'Xác nhận lịch vệ sinh'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <h2 className="text-lg font-bold">Cam kết vận hành</h2>
              <div className="mt-4 space-y-3">
                <PromiseItem
                  icon={<TimerReset size={18} />}
                  title="Đúng giờ"
                  detail="Tự động nhắc lịch trước 30 phút."
                />
                <PromiseItem
                  icon={<ShieldCheck size={18} />}
                  title="Bảo đảm an toàn"
                  detail="Kỹ thuật viên có hồ sơ xác thực."
                />
                <PromiseItem
                  icon={<Sparkles size={18} />}
                  title="Checklist rõ ràng"
                  detail="Ảnh trước/sau được lưu vào booking."
                />
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

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-700">{label}</p>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl border px-3 text-sm font-semibold transition ${
        active
          ? 'border-emerald-500 bg-emerald-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'text-base font-bold text-white' : 'text-slate-300'}>{label}</span>
      <span
        className={
          strong ? 'text-xl font-bold text-emerald-300' : 'text-right font-semibold text-white'
        }
      >
        {value}
      </span>
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
