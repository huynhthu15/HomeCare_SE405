import { apiFetch } from '../../lib/api-client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ClipboardList,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  Percent,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserRoundCheck,
  WalletCards,
  Wrench,
} from 'lucide-react';

const accentClasses = {
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
};

const iconByDomain = {
  Cleaning: Sparkles,
  Repair: Wrench,
  Appliance: PackageCheck,
  Booking: Home,
  Tracking: ClipboardList,
};
const accentByDomain = {
  Cleaning: 'emerald',
  Repair: 'amber',
  Appliance: 'sky',
  Booking: 'rose',
  Tracking: 'emerald',
};

const domainLabels = {
  Cleaning: 'Vệ sinh',
  Repair: 'Sửa chữa',
  Appliance: 'Thiết bị',
  Booking: 'Đặt lịch',
  Tracking: 'Theo dõi',
};

const bookingStatusLabels = {
  'Da xac nhan': 'Đã xác nhận',
  'Cho xac nhan': 'Chờ xác nhận',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

const bookingStatusClasses = {
  'Chờ xác nhận': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Chờ xác nhận thanh toán': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Chờ kỹ thuật viên tiếp nhận': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Đã xác nhận': 'bg-sky-50 text-sky-700 ring-sky-200',
  'Đã thanh toán': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Đang điều phối': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'Đang di chuyển': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'Kỹ thuật viên đang di chuyển': 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  'Hoàn tất': 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Đã hủy': 'bg-rose-50 text-rose-700 ring-rose-200',
};

const bookingStatusClass = (status) =>
  bookingStatusClasses[status] || 'bg-slate-50 text-slate-700 ring-slate-200';

const SERVICES_PER_PAGE = 6;
const BOOKINGS_PER_PAGE = 6;

const filterOptions = [
  { id: 'all', label: 'Tất cả', domain: 'all' },
  { id: 'cleaning', label: 'Vệ sinh', domain: 'Cleaning' },
  { id: 'repair', label: 'Sửa chữa', domain: 'Repair' },
  { id: 'appliance', label: 'Thiết bị', domain: 'Appliance' },
  { id: 'booking', label: 'Gói dịch vụ', domain: 'Booking' },
];

const normalizeService = (service) => ({
  ...service,
  icon: iconByDomain[service.domain] || Home,
  accent: service.accent || accentByDomain[service.domain] || 'emerald',
  price: Number(service.price || 0),
  rating: Number(service.rating ?? 0),
});

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDateLabel = (value) => {
  if (!value) {
    return 'Theo lịch nhắc việc';
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const bookingDateLabel = (value) => {
  const today = todayInputValue();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  if (value === today) return 'Hôm nay';
  if (value === tomorrow) return 'Ngày mai';

  return formatDateLabel(value);
};

const readMaintenanceRequest = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('mode') !== 'maintenance') {
    return null;
  }

  return {
    reminderId: params.get('reminderId') || '',
    deviceId: params.get('deviceId') || '',
    deviceName: params.get('deviceName') || 'Thiết bị',
    service: params.get('service') || '',
    domain: params.get('domain') || 'Appliance',
    dueDate: params.get('dueDate') || '',
    note: params.get('note') || '',
  };
};

export default function BookingPage() {
  const [maintenanceRequest] = useState(() => readMaintenanceRequest());
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [platformFee, setPlatformFee] = useState(0);
  const [addOns, setAddOns] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    maintenanceRequest?.dueDate || todayInputValue(),
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [bookedTechnicians, setBookedTechnicians] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [domainFilter, setDomainFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [servicePage, setServicePage] = useState(1);
  const [address, setAddress] = useState('');
  const [note, setNote] = useState(
    maintenanceRequest
      ? `${maintenanceRequest.deviceName}${maintenanceRequest.note ? ` - ${maintenanceRequest.note}` : ''}`
      : '',
  );
  const [voucher, setVoucher] = useState('');
  const [toast, setToast] = useState('');
  const [activeBookings, setActiveBookings] = useState([]);
  const [bookingKeyword, setBookingKeyword] = useState('');
  const [showBookingFilters, setShowBookingFilters] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingPage, setBookingPage] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch(`/services`),
      apiFetch(`/technicians`),
      apiFetch(`/booking-options`),
      apiFetch(`/bookings`),
      apiFetch(`/profile`),
    ])
      .then(
        async ([
          servicesResponse,
          techniciansResponse,
          optionsResponse,
          bookingsResponse,
          profileResponse,
        ]) => {
          if (
            ![
              servicesResponse,
              techniciansResponse,
              optionsResponse,
              bookingsResponse,
              profileResponse,
            ].every((response) => response.ok)
          ) {
            throw new Error('Không thể tải dữ liệu đặt lịch từ máy chủ.');
          }

          return Promise.all([
            servicesResponse.json(),
            techniciansResponse.json(),
            optionsResponse.json(),
            bookingsResponse.json(),
            profileResponse.json(),
          ]);
        },
      )
      .then(([serviceItems, technicianItems, options, bookingItems, profile]) => {
        const nextServices = serviceItems.map(normalizeService);
        const requestedService = maintenanceRequest
          ? nextServices.find(
              (service) =>
                service.title.toLowerCase() === maintenanceRequest.service.toLowerCase() ||
                service.domain === maintenanceRequest.domain,
            )
          : null;

        setServices(nextServices);
        setSelectedService(requestedService || nextServices[0] || null);
        if (requestedService) setDomainFilter(requestedService.domain);
        setTechnicians(technicianItems);
        setTimeSlots(options.bookingTimeSlots || []);
        setPlatformFee(Number(options.bookingPlatformFee || 0));
        setAddOns(options.addOns || []);
        setVouchers(options.vouchers || []);
        setSelectedTime(options.bookingTimeSlots?.[0] || '');
        setAddress(profile.address || '');
        setActiveBookings(
          [...bookingItems].reverse().map((booking) => ({
            id: booking.id,
            service: booking.service,
            stage: bookingStatusLabels[booking.status] || booking.status,
            time: booking.time,
          })),
        );
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu đặt lịch.');
      });
  }, [maintenanceRequest]);

  const filteredServices = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return services.filter((service) => {
      const matchKeyword =
        !normalizedKeyword ||
        `${domainLabels[service.domain] || service.domain} ${service.domain} ${service.title} ${service.description}`
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchDomain = domainFilter === 'all' || service.domain === domainFilter;
      const matchPrice =
        priceFilter === 'all' ||
        (priceFilter === 'under250' && service.price < 250000) ||
        (priceFilter === 'from250' && service.price >= 250000);
      const matchRating = ratingFilter === 'all' || service.rating >= 4.8;

      return matchKeyword && matchDomain && matchPrice && matchRating;
    });
  }, [domainFilter, keyword, priceFilter, ratingFilter, services]);

  const servicePageCount = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PER_PAGE));
  const currentServicePage = Math.min(servicePage, servicePageCount);
  const serviceStartIndex = (currentServicePage - 1) * SERVICES_PER_PAGE;
  const paginatedServices = filteredServices.slice(
    serviceStartIndex,
    serviceStartIndex + SERVICES_PER_PAGE,
  );

  const bookingStatusOptions = useMemo(() => {
    const statuses = activeBookings.map((booking) => booking.stage).filter(Boolean);
    return ['all', ...Array.from(new Set(statuses))];
  }, [activeBookings]);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = bookingKeyword.trim().toLowerCase();

    return activeBookings.filter((booking) => {
      const matchKeyword =
        !normalizedKeyword ||
        `${booking.id} ${booking.service} ${booking.time} ${booking.stage}`
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchStatus = bookingStatusFilter === 'all' || booking.stage === bookingStatusFilter;

      return matchKeyword && matchStatus;
    });
  }, [activeBookings, bookingKeyword, bookingStatusFilter]);

  const bookingPageCount = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
  const currentBookingPage = Math.min(bookingPage, bookingPageCount);
  const bookingStartIndex = (currentBookingPage - 1) * BOOKINGS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(
    bookingStartIndex,
    bookingStartIndex + BOOKINGS_PER_PAGE,
  );
  const selectedScheduleTime = `${bookingDateLabel(selectedDate)}, ${selectedTime}`;

  const suggestedTechnicians = useMemo(() => {
    return selectedService
      ? technicians.filter((technician) => technician.domains?.includes(selectedService.domain))
      : [];
  }, [selectedService, technicians]);

  const availableTechnicians = useMemo(
    () => suggestedTechnicians.filter((technician) => !bookedTechnicians.includes(technician.name)),
    [bookedTechnicians, suggestedTechnicians],
  );

  const selectedTechnicianBusy = selectedTechnician
    ? bookedTechnicians.includes(selectedTechnician.name)
    : false;

  const addOnTotal = addOns
    .filter((item) => selectedAddOns.includes(item.id))
    .reduce((total, item) => total + item.price, 0);
  const discount =
    vouchers.find((item) => item.code === voucher.trim().toUpperCase())?.discount || 0;
  const total = Math.max((selectedService?.price || 0) + addOnTotal + platformFee - discount, 0);

  useEffect(() => {
    const nextTechnician = availableTechnicians[0] || suggestedTechnicians[0] || null;
    setSelectedTechnician((current) =>
      current &&
      suggestedTechnicians.some((technician) => technician.id === current.id) &&
      !bookedTechnicians.includes(current.name)
        ? current
        : nextTechnician,
    );
  }, [availableTechnicians, bookedTechnicians, suggestedTechnicians]);

  useEffect(() => {
    setAvailabilityLoading(true);

    apiFetch(`/technician-availability?time=${encodeURIComponent(selectedScheduleTime)}`, {})
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setBookedTechnicians(Array.isArray(data.bookedTechnicians) ? data.bookedTechnicians : []);
      })
      .catch((error) => {
        setLoadError(
          error instanceof Error ? error.message : 'Không thể kiểm tra lịch kỹ thuật viên.',
        );
      })
      .finally(() => setAvailabilityLoading(false));
  }, [selectedScheduleTime]);

  useEffect(() => {
    setServicePage(1);
  }, [domainFilter, keyword, priceFilter, ratingFilter]);

  useEffect(() => {
    setBookingPage(1);
  }, [bookingKeyword, bookingStatusFilter]);

  const toggleAddOn = (addOnId) => {
    setSelectedAddOns((current) =>
      current.includes(addOnId)
        ? current.filter((item) => item !== addOnId)
        : [...current, addOnId],
    );
  };

  const confirmBooking = async () => {
    if (!selectedService || !selectedTechnician || !selectedTime || !address.trim()) {
      setToast('Vui lòng chọn dịch vụ, giờ hẹn, kỹ thuật viên và nhập địa chỉ.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch(`/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: selectedService.title,
          domain: selectedService.domain,
          serviceId: selectedService.id,
          time: selectedScheduleTime,
          // TODO(TV2): send technicianId or let dispatch assign (docs/frontend-migration.md §5.3)
          technician: selectedTechnician.name,
          // TODO(owner): server computes the price — stop sending it (docs/frontend-migration.md §5.2)
          amount: total,
          address,
          note,
          voucher,
          addOns: selectedAddOns,
          source: maintenanceRequest ? 'reminder' : 'booking',
          reminderId: maintenanceRequest?.reminderId,
          deviceId: maintenanceRequest?.deviceId,
          deviceName: maintenanceRequest?.deviceName,
        }),
      });

      const createdBooking = await response.json();

      if (!response.ok) {
        throw new Error(createdBooking.message || 'Không thể tạo lịch hẹn');
      }

      setActiveBookings((current) => [
        {
          id: createdBooking.id,
          service: createdBooking.service,
          stage: bookingStatusLabels[createdBooking.status] || createdBooking.status,
          time: createdBooking.time,
        },
        ...current,
      ]);

      setToast(
        maintenanceRequest
          ? `Đã gửi yêu cầu bảo trì ${createdBooking.id}. Kỹ thuật viên sẽ tiếp nhận lịch.`
          : `Đã lưu lịch hẹn ${createdBooking.id} cho ${selectedService.title.toLowerCase()} lúc ${selectedScheduleTime}.`,
      );
      window.setTimeout(() => {
        window.location.assign(
          maintenanceRequest
            ? `/tracking?bookingId=${encodeURIComponent(createdBooking.id)}`
            : `/payment?bookingId=${encodeURIComponent(createdBooking.id)}`,
        );
      }, 350);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Không thể lưu lịch hẹn.');
    } finally {
      setSaving(false);
      window.setTimeout(() => setToast(''), 4200);
    }
  };

  return (
    <section className="min-h-screen text-slate-950">
      <div className="flex w-full flex-col gap-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric value={activeBookings.length} label="Lịch hẹn đang xử lý" />
          <Metric value={technicians.length} label="Kỹ thuật viên" />
          <Metric value={services.length} label="Dịch vụ" />
        </section>

        {loadError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
          >
            {loadError}
          </div>
        )}

        {toast && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <Check size={18} />
            {toast}
          </div>
        )}

        {maintenanceRequest && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-200">
                <PackageCheck size={18} />
              </div>
              <div>
                <p className="font-bold">Đặt lịch bảo trì từ nhắc việc</p>
                <p className="mt-1 leading-5">
                  Thiết bị: <span className="font-semibold">{maintenanceRequest.deviceName}</span>
                  {maintenanceRequest.dueDate
                    ? ` • Hạn xử lý ${formatDateLabel(maintenanceRequest.dueDate)}`
                    : ''}
                </p>
                <p className="mt-1 text-sky-700">
                  Sau khi xác nhận, lịch sẽ ở trạng thái chờ kỹ thuật viên tiếp nhận.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Chọn dịch vụ</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn một dịch vụ để hệ thống gợi ý kỹ thuật viên phù hợp.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block w-full sm:w-72">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-hidden transition focus:border-indigo-400 focus:bg-white"
                      placeholder="Tìm vệ sinh, sửa chữa..."
                      type="search"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFilters((open) => !open)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                      showFilters ||
                      domainFilter !== 'all' ||
                      priceFilter !== 'all' ||
                      ratingFilter !== 'all'
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
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
                  <FilterGroup label="Loại dịch vụ">
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.map((option) => (
                        <FilterChip
                          key={option.id}
                          active={domainFilter === option.domain}
                          onClick={() => setDomainFilter(option.domain)}
                        >
                          {option.label}
                        </FilterChip>
                      ))}
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Khoảng giá">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip
                        active={priceFilter === 'all'}
                        onClick={() => setPriceFilter('all')}
                      >
                        Tất cả
                      </FilterChip>
                      <FilterChip
                        active={priceFilter === 'under250'}
                        onClick={() => setPriceFilter('under250')}
                      >
                        Dưới 250.000đ
                      </FilterChip>
                      <FilterChip
                        active={priceFilter === 'from250'}
                        onClick={() => setPriceFilter('from250')}
                      >
                        Từ 250.000đ
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
                      setDomainFilter('all');
                      setPriceFilter('all');
                      setRatingFilter('all');
                    }}
                    className="h-10 w-fit rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 lg:col-span-3"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {paginatedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    active={selectedService?.id === service.id}
                    onSelect={() => setSelectedService(service)}
                  />
                ))}
                {filteredServices.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500 md:col-span-2">
                    Không có dịch vụ phù hợp hoặc chưa có dữ liệu từ máy chủ.
                  </div>
                )}
              </div>

              <Pagination
                className="mt-5"
                page={currentServicePage}
                pageCount={servicePageCount}
                total={filteredServices.length}
                startIndex={serviceStartIndex}
                pageSize={SERVICES_PER_PAGE}
                itemLabel="dịch vụ"
                onPageChange={setServicePage}
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Panel title="Lịch hẹn" icon={<CalendarDays size={20} />}>
                <label className="mb-4 block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays size={16} />
                    Ngày hẹn
                  </span>
                  <input
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    min={todayInputValue()}
                    type="date"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-hidden transition focus:border-indigo-400 focus:bg-white"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-11 rounded-2xl border text-sm font-semibold transition ${
                        selectedTime === slot
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                  {timeSlots.length === 0 && (
                    <p className="text-sm text-slate-500">Chưa có khung giờ khả dụng.</p>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Đang kiểm tra lịch trống cho {selectedScheduleTime}.
                </p>

                <label className="mt-4 block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin size={16} />
                    Địa chỉ
                  </span>
                  <input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-hidden transition focus:border-indigo-400 focus:bg-white"
                  />
                </label>
              </Panel>

              <Panel title="Kỹ thuật viên phù hợp" icon={<UserRoundCheck size={20} />}>
                <div className="space-y-3">
                  {availabilityLoading && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-500">
                      Đang kiểm tra kỹ thuật viên trống lịch...
                    </div>
                  )}
                  {suggestedTechnicians.map((technician) => {
                    const active = selectedTechnician?.id === technician.id;
                    const busy = bookedTechnicians.includes(technician.name);

                    return (
                      <button
                        key={technician.id}
                        disabled={busy}
                        onClick={() => setSelectedTechnician(technician)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                          busy
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-70'
                            : active
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-950">{technician.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{technician.specialty}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            Phù hợp{' '}
                            {domainLabels[selectedService?.domain] || selectedService?.domain} •{' '}
                            {technician.distance} • {technician.jobs} lượt hoàn tất
                          </p>
                          {busy && (
                            <p className="mt-2 text-xs font-bold text-rose-600">
                              Đã có lịch trong khung giờ {selectedScheduleTime}
                            </p>
                          )}
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                          {busy ? (
                            'Bận'
                          ) : (
                            <>
                              <Star size={15} />
                              {technician.rating}
                            </>
                          )}
                        </span>
                      </button>
                    );
                  })}
                  {availableTechnicians.length === 0 && !availabilityLoading && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                      Chưa có kỹ thuật viên khả dụng phù hợp với dịch vụ và khung giờ này.
                    </div>
                  )}
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <Panel title="Dịch vụ thêm" icon={<BadgeCheck size={20} />}>
                <div className="space-y-3">
                  {addOns.map((addOn) => {
                    const active = selectedAddOns.includes(addOn.id);

                    return (
                      <button
                        key={addOn.id}
                        onClick={() => toggleAddOn(addOn.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          active
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{addOn.label}</span>
                        <span className="flex items-center gap-2">
                          {formatCurrency(addOn.price)}
                          {active && <Check size={16} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel title="Ghi chú & voucher" icon={<Percent size={20} />}>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Mã ưu đãi</span>
                  <input
                    value={voucher}
                    onChange={(event) => setVoucher(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold uppercase outline-hidden transition focus:border-emerald-400 focus:bg-white"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-hidden transition focus:border-emerald-400 focus:bg-white"
                  />
                </label>
              </Panel>
            </section>
          </div>

          <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Lịch hẹn đang xử lý</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tìm kiếm, lọc trạng thái và hiển thị 6 lịch hẹn mỗi trang.
                </p>
              </div>
              <ChevronRight className="shrink-0 text-slate-400" size={24} />
            </div>

            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block w-full xl:max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  value={bookingKeyword}
                  onChange={(event) => setBookingKeyword(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-hidden transition focus:border-indigo-400 focus:bg-white"
                  placeholder="Tìm mã lịch, dịch vụ, thời gian..."
                  type="search"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowBookingFilters((open) => !open)}
                className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                  showBookingFilters || bookingStatusFilter !== 'all'
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <SlidersHorizontal size={18} />
                Bộ lọc
              </button>
            </div>

            {showBookingFilters && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <FilterGroup label="Trạng thái lịch hẹn">
                  <div className="flex flex-wrap gap-2">
                    {bookingStatusOptions.map((status) => (
                      <FilterChip
                        key={status}
                        active={bookingStatusFilter === status}
                        onClick={() => setBookingStatusFilter(status)}
                      >
                        {status === 'all' ? 'Tất cả' : status}
                      </FilterChip>
                    ))}
                  </div>
                </FilterGroup>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter('all')}
                  className="mt-4 h-10 w-fit rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {paginatedBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {booking.id}
                  </p>
                  <h3 className="mt-1 font-bold text-slate-950">{booking.service}</h3>
                  <p className="mt-1 text-sm text-slate-600">{booking.time}</p>
                  <span
                    className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${bookingStatusClass(booking.stage)}`}
                  >
                    {booking.stage}
                  </span>
                </article>
              ))}
              {paginatedBookings.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500 md:col-span-2">
                  Không tìm thấy lịch hẹn phù hợp.
                </div>
              )}
            </div>

            <Pagination
              className="mt-5"
              page={currentBookingPage}
              pageCount={bookingPageCount}
              total={filteredBookings.length}
              startIndex={bookingStartIndex}
              pageSize={BOOKINGS_PER_PAGE}
              itemLabel="lịch hẹn"
              onPageChange={setBookingPage}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <WalletCards size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Tóm tắt đặt lịch</h2>
                  <p className="text-sm text-slate-300">Chi phí dự kiến trước khi xác nhận.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Dịch vụ" value={selectedService?.title || 'Chưa chọn'} />
                <SummaryRow
                  label="Loại dịch vụ"
                  value={domainLabels[selectedService?.domain] || selectedService?.domain || '—'}
                />
                <SummaryRow label="Thời gian" value={selectedScheduleTime} />
                <SummaryRow label="Kỹ thuật viên" value={selectedTechnician?.name || 'Chưa chọn'} />
                <SummaryRow
                  label="Phí dịch vụ"
                  value={formatCurrency(selectedService?.price || 0)}
                />
                <SummaryRow label="Dịch vụ thêm" value={formatCurrency(addOnTotal)} />
                <SummaryRow label="Nền tảng" value={formatCurrency(platformFee)} />
                <SummaryRow label="Ưu đãi" value={`-${formatCurrency(discount)}`} />
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <SummaryRow label="Tổng thanh toán" value={formatCurrency(total)} strong />
                <button
                  onClick={confirmBooking}
                  disabled={
                    !address.trim() ||
                    !selectedService ||
                    !selectedTime ||
                    !selectedTechnician ||
                    saving ||
                    selectedTechnicianBusy ||
                    availableTechnicians.length === 0
                  }
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-400 text-sm font-bold text-slate-950 transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  <CreditCard size={18} />
                  {saving
                    ? 'Đang lưu...'
                    : selectedTechnicianBusy || availableTechnicians.length === 0
                      ? 'Chọn giờ hoặc kỹ thuật viên khác'
                      : 'Xác nhận đặt lịch'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-xs ring-1 ring-slate-200">
              <h2 className="text-lg font-bold">Quy trình phục vụ</h2>
              <div className="mt-4 grid gap-3">
                <FlowItem
                  icon={<ClipboardList size={18} />}
                  title="Xác nhận lịch hẹn"
                  detail="HomeCare ghi nhận dịch vụ, địa chỉ và khung giờ bạn chọn."
                />
                <FlowItem
                  icon={<ShieldCheck size={18} />}
                  title="Điều phối kỹ thuật viên"
                  detail="Ưu tiên người phù hợp theo khu vực, chuyên môn và đánh giá."
                />
                <FlowItem
                  icon={<CreditCard size={18} />}
                  title="Thanh toán"
                  detail="Sau khi xác nhận đặt lịch, bạn sẽ chuyển sang trang thanh toán."
                />
              </div>
            </section>
          </section>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service, active, onSelect }) {
  const Icon = service.icon;

  return (
    <button
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? 'border-indigo-400 bg-indigo-50 shadow-xs'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClasses[service.accent]}`}
          >
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {domainLabels[service.domain] || service.domain}
            </p>
            <h3 className="mt-1 font-bold text-slate-950">{service.title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">{service.description}</p>
          </div>
        </div>
        {active && <Check className="shrink-0 text-indigo-600" size={20} />}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <Clock3 size={16} />
          {service.duration}
        </span>
        <span className="flex items-center gap-1">
          <Star size={16} />
          {service.rating}
        </span>
        <span className="font-bold text-slate-950">{formatCurrency(service.price)}</span>
      </div>
    </button>
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
          ? 'border-indigo-500 bg-indigo-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({
  className = '',
  page,
  pageCount,
  total,
  startIndex,
  pageSize,
  itemLabel,
  onPageChange,
}) {
  if (total <= pageSize) {
    return null;
  }

  return (
    <div
      className={`${className} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
    >
      <p className="text-sm font-semibold text-slate-500">
        Hiển thị {startIndex + 1}-{Math.min(startIndex + pageSize, total)} / {total} {itemLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        {Array.from({ length: pageCount }).map((_, index) => {
          const nextPage = index + 1;

          return (
            <button
              key={nextPage}
              type="button"
              onClick={() => onPageChange(nextPage)}
              className={`h-9 min-w-9 rounded-xl border px-3 text-sm font-semibold transition ${
                page === nextPage
                  ? 'border-indigo-500 bg-indigo-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {nextPage}
            </button>
          );
        })}
        <button
          type="button"
          disabled={page === pageCount}
          onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}
          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
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
          strong
            ? 'text-right text-xl font-bold text-indigo-300'
            : 'text-right font-semibold text-white'
        }
      >
        {value}
      </span>
    </div>
  );
}

function FlowItem({ icon, title, detail }) {
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
