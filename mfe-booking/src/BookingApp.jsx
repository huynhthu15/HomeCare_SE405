import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import "./index.css";

const serviceCatalog = [
  {
    id: "cleaning-aircon",
    domain: "Cleaning",
    title: "Vệ sinh máy lạnh",
    description: "Làm sạch dàn lạnh, lưới lọc và kiểm tra hoạt động.",
    price: 180000,
    duration: "60 phút",
    rating: 4.9,
    icon: Sparkles,
    accent: "emerald",
  },
  {
    id: "repair-electric",
    domain: "Repair",
    title: "Sửa điện dân dụng",
    description: "Kiểm tra ổ cắm, CB, đèn và thiết bị điện trong nhà.",
    price: 240000,
    duration: "90 phút",
    rating: 4.8,
    icon: Wrench,
    accent: "amber",
  },
  {
    id: "appliance-fridge",
    domain: "Appliance",
    title: "Bảo trì tủ lạnh",
    description: "Vệ sinh ron cửa, đo nhiệt độ và kiểm tra block.",
    price: 220000,
    duration: "75 phút",
    rating: 4.7,
    icon: PackageCheck,
    accent: "sky",
  },
  {
    id: "appliance-maintenance",
    domain: "Appliance",
    title: "Bảo trì thiết bị",
    description: "Kiểm tra, vệ sinh nhẹ và đánh giá tình trạng thiết bị gia dụng.",
    price: 220000,
    duration: "75 phút",
    rating: 4.8,
    icon: PackageCheck,
    accent: "sky",
  },
  {
    id: "combo-home",
    domain: "Booking",
    title: "Gói chăm sóc nhà",
    description: "Kết hợp vệ sinh, kiểm tra nhanh và nhắc lịch định kỳ.",
    price: 390000,
    duration: "150 phút",
    rating: 4.9,
    icon: Home,
    accent: "rose",
  },
];

const timeSlots = ["08:00", "09:30", "13:00", "15:30", "18:00"];

const technicians = [
  {
    id: "TECH-088",
    name: "Phạm Quốc Việt",
    specialty: "Điện lạnh, vệ sinh và thiết bị gia dụng",
    domains: ["Cleaning", "Repair", "Appliance", "Booking"],
    rating: 4.9,
    distance: "2.1 km",
    jobs: 1284,
  },
  {
    id: "TEC-018",
    name: "Nguyễn Minh Khang",
    specialty: "Điện lạnh và vệ sinh",
    domains: ["Cleaning", "Appliance", "Booking"],
    rating: 4.9,
    distance: "2.4 km",
    jobs: 218,
  },
  {
    id: "TEC-027",
    name: "Lê Hoàng An",
    specialty: "Điện nước dân dụng",
    domains: ["Repair", "Booking"],
    rating: 4.8,
    distance: "3.1 km",
    jobs: 184,
  },
  {
    id: "TEC-041",
    name: "Phạm Gia Hân",
    specialty: "Thiết bị gia dụng",
    domains: ["Appliance", "Repair"],
    rating: 4.7,
    distance: "4.6 km",
    jobs: 156,
  },
];

const addOns = [
  { id: "photo-report", label: "Báo cáo ảnh trước/sau", price: 20000 },
  { id: "warranty", label: "Bảo hành mở rộng 14 ngày", price: 45000 },
  { id: "priority", label: "Ưu tiên kỹ thuật viên gần nhất", price: 30000 },
];

const fallbackBookings = [
  {
    id: "BK-24061",
    service: "Vệ sinh máy lạnh",
    stage: "Kỹ thuật viên đang di chuyển",
    time: "Hôm nay, 15:30",
  },
  {
    id: "BK-24058",
    service: "Sửa ổ cắm bếp",
    stage: "Chờ xác nhận thanh toán",
    time: "Thứ 5, 09:30",
  },
];

const accentClasses = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
};

const iconByDomain = {
  Cleaning: Sparkles,
  Repair: Wrench,
  Appliance: PackageCheck,
  Booking: Home,
  Tracking: ClipboardList,
};
const accentByDomain = {
  Cleaning: "emerald",
  Repair: "amber",
  Appliance: "sky",
  Booking: "rose",
  Tracking: "emerald",
};

const domainLabels = {
  Cleaning: "Vệ sinh",
  Repair: "Sửa chữa",
  Appliance: "Thiết bị",
  Booking: "Đặt lịch",
  Tracking: "Theo dõi",
};

const bookingStatusLabels = {
  "Da xac nhan": "Đã xác nhận",
  "Cho xac nhan": "Chờ xác nhận",
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const bookingStatusClasses = {
  "Chờ xác nhận": "bg-amber-50 text-amber-700 ring-amber-200",
  "Chờ xác nhận thanh toán": "bg-amber-50 text-amber-700 ring-amber-200",
  "Chờ kỹ thuật viên tiếp nhận": "bg-amber-50 text-amber-700 ring-amber-200",
  "Đã xác nhận": "bg-sky-50 text-sky-700 ring-sky-200",
  "Đã thanh toán": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đang điều phối": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Đang di chuyển": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Kỹ thuật viên đang di chuyển": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Hoàn tất": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Đã hủy": "bg-rose-50 text-rose-700 ring-rose-200",
};

const bookingStatusClass = (status) =>
  bookingStatusClasses[status] || "bg-slate-50 text-slate-700 ring-slate-200";

const SERVICES_PER_PAGE = 6;
const BOOKINGS_PER_PAGE = 6;

const filterOptions = [
  { id: "all", label: "Tất cả", domain: "all" },
  { id: "cleaning", label: "Vệ sinh", domain: "Cleaning" },
  { id: "repair", label: "Sửa chữa", domain: "Repair" },
  { id: "appliance", label: "Thiết bị", domain: "Appliance" },
  { id: "booking", label: "Gói dịch vụ", domain: "Booking" },
];

const normalizeService = (service) => ({
  ...service,
  icon: iconByDomain[service.domain] || Home,
  accent: service.accent || accentByDomain[service.domain] || "emerald",
  price: Number(service.price || 0),
  rating: Number(service.rating || 4.8),
});

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

const formatDateLabel = (value) => {
  if (!value) {
    return "Theo lịch nhắc việc";
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const bookingDateLabel = (value) => {
  const today = todayInputValue();
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  if (value === today) return "Hôm nay";
  if (value === tomorrow) return "Ngày mai";

  return formatDateLabel(value);
};

const readMaintenanceRequest = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("mode") !== "maintenance") {
    return null;
  }

  return {
    reminderId: params.get("reminderId") || "",
    deviceId: params.get("deviceId") || "",
    deviceName: params.get("deviceName") || "Thiết bị",
    service: params.get("service") || "",
    domain: params.get("domain") || "Appliance",
    dueDate: params.get("dueDate") || "",
    note: params.get("note") || "",
  };
};

const buildMaintenanceService = (request) => ({
  id: `maintenance-${request.reminderId || request.deviceId || "device"}`,
  domain: request.domain || "Appliance",
  title: request.service || `Bảo trì ${request.deviceName}`,
  description: `Yêu cầu bảo trì cho ${request.deviceName}. Kỹ thuật viên sẽ tiếp nhận trước khi thanh toán.`,
  price: 220000,
  duration: "75 phút",
  rating: 4.8,
  icon: PackageCheck,
  accent: "sky",
});

export default function BookingApp() {
  const [maintenanceRequest] = useState(() => readMaintenanceRequest());
  const maintenanceService = useMemo(
    () => (maintenanceRequest ? buildMaintenanceService(maintenanceRequest) : null),
    [maintenanceRequest]
  );
  const initialService = maintenanceService || serviceCatalog[0];
  const [services, setServices] = useState(
    maintenanceService ? [maintenanceService, ...serviceCatalog] : serviceCatalog
  );
  const [selectedService, setSelectedService] = useState(initialService);
  const [selectedDate, setSelectedDate] = useState(maintenanceRequest?.dueDate || todayInputValue());
  const [selectedTime, setSelectedTime] = useState(maintenanceRequest ? timeSlots[1] : timeSlots[3]);
  const [selectedTechnician, setSelectedTechnician] = useState(technicians[0]);
  const [bookedTechnicians, setBookedTechnicians] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState(["photo-report"]);
  const [keyword, setKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [domainFilter, setDomainFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [servicePage, setServicePage] = useState(1);
  const [address, setAddress] = useState("12 Nguyễn Văn Linh, Quận 7");
  const [note, setNote] = useState(
    maintenanceRequest
      ? `${maintenanceRequest.deviceName}${maintenanceRequest.note ? ` - ${maintenanceRequest.note}` : ""}`
      : "Gọi trước 10 phút khi đến nơi."
  );
  const [voucher, setVoucher] = useState("HOMECARE10");
  const [toast, setToast] = useState("");
  const [activeBookings, setActiveBookings] = useState(fallbackBookings);
  const [bookingKeyword, setBookingKeyword] = useState("");
  const [showBookingFilters, setShowBookingFilters] = useState(false);
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/services`)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        const nextServices = items.map(normalizeService);

        if (maintenanceService) {
          setServices([maintenanceService, ...nextServices]);
          setSelectedService(maintenanceService);
          setDomainFilter(maintenanceService.domain);
          return;
        }

        setServices(nextServices);
        setSelectedService(nextServices[0]);
      })
      .catch(() => setServices(maintenanceService ? [maintenanceService, ...serviceCatalog] : serviceCatalog));

    fetch(`${API_BASE_URL}/bookings`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items)) {
          return;
        }

        setActiveBookings(
          [...items]
            .reverse()
            .map((booking) => ({
              id: booking.id,
              service: booking.service,
              stage: bookingStatusLabels[booking.status] || booking.status,
              time: booking.time,
            }))
        );
      })
      .catch(() => {
        setActiveBookings(fallbackBookings);
      });
  }, [maintenanceService]);

  const filteredServices = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return services.filter((service) =>
      {
        const matchKeyword =
          !normalizedKeyword ||
          `${domainLabels[service.domain] || service.domain} ${service.domain} ${service.title} ${service.description}`
            .toLowerCase()
            .includes(normalizedKeyword);
        const matchDomain = domainFilter === "all" || service.domain === domainFilter;
        const matchPrice =
          priceFilter === "all" ||
          (priceFilter === "under250" && service.price < 250000) ||
          (priceFilter === "from250" && service.price >= 250000);
        const matchRating = ratingFilter === "all" || service.rating >= 4.8;

        return matchKeyword && matchDomain && matchPrice && matchRating;
      }
    );
  }, [domainFilter, keyword, priceFilter, ratingFilter, services]);

  const servicePageCount = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PER_PAGE));
  const currentServicePage = Math.min(servicePage, servicePageCount);
  const serviceStartIndex = (currentServicePage - 1) * SERVICES_PER_PAGE;
  const paginatedServices = filteredServices.slice(serviceStartIndex, serviceStartIndex + SERVICES_PER_PAGE);

  const bookingStatusOptions = useMemo(() => {
    const statuses = activeBookings.map((booking) => booking.stage).filter(Boolean);
    return ["all", ...Array.from(new Set(statuses))];
  }, [activeBookings]);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = bookingKeyword.trim().toLowerCase();

    return activeBookings.filter((booking) => {
      const matchKeyword =
        !normalizedKeyword ||
        `${booking.id} ${booking.service} ${booking.time} ${booking.stage}`
          .toLowerCase()
          .includes(normalizedKeyword);
      const matchStatus = bookingStatusFilter === "all" || booking.stage === bookingStatusFilter;

      return matchKeyword && matchStatus;
    });
  }, [activeBookings, bookingKeyword, bookingStatusFilter]);

  const bookingPageCount = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
  const currentBookingPage = Math.min(bookingPage, bookingPageCount);
  const bookingStartIndex = (currentBookingPage - 1) * BOOKINGS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(bookingStartIndex, bookingStartIndex + BOOKINGS_PER_PAGE);
  const selectedScheduleTime = `${bookingDateLabel(selectedDate)}, ${selectedTime}`;

  const suggestedTechnicians = useMemo(() => {
    return technicians.filter((technician) => technician.domains.includes(selectedService.domain));
  }, [selectedService.domain]);

  const availableTechnicians = useMemo(
    () => suggestedTechnicians.filter((technician) => !bookedTechnicians.includes(technician.name)),
    [bookedTechnicians, suggestedTechnicians]
  );

  const selectedTechnicianBusy = bookedTechnicians.includes(selectedTechnician.name);

  const addOnTotal = addOns
    .filter((item) => selectedAddOns.includes(item.id))
    .reduce((total, item) => total + item.price, 0);
  const platformFee = 15000;
  const discount = voucher.trim().toUpperCase() === "HOMECARE10" ? 30000 : 0;
  const total = Math.max(selectedService.price + addOnTotal + platformFee - discount, 0);

  useEffect(() => {
    const nextTechnician = availableTechnicians[0] || suggestedTechnicians[0] || technicians[0];
    setSelectedTechnician((current) =>
      current && suggestedTechnicians.some((technician) => technician.id === current.id) && !bookedTechnicians.includes(current.name)
        ? current
        : nextTechnician
    );
  }, [availableTechnicians, bookedTechnicians, suggestedTechnicians]);

  useEffect(() => {
    setAvailabilityLoading(true);

    fetch(`${API_BASE_URL}/technician-availability?time=${encodeURIComponent(selectedScheduleTime)}`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        setBookedTechnicians(Array.isArray(data.bookedTechnicians) ? data.bookedTechnicians : []);
      })
      .catch(() => setBookedTechnicians([]))
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
        : [...current, addOnId]
    );
  };

  const confirmBooking = async () => {
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          service: selectedService.title,
          domain: selectedService.domain,
          serviceId: selectedService.id,
          time: selectedScheduleTime,
          technician: selectedTechnician.name,
          amount: total,
          address,
          note,
          voucher,
          addOns: selectedAddOns,
          source: maintenanceRequest ? "reminder" : "booking",
          reminderId: maintenanceRequest?.reminderId,
          deviceId: maintenanceRequest?.deviceId,
          deviceName: maintenanceRequest?.deviceName,
        }),
      });

      const createdBooking = await response.json();

      if (!response.ok) {
        throw new Error(createdBooking.message || "Không thể tạo lịch hẹn");
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
          : `Đã lưu lịch hẹn ${createdBooking.id} cho ${selectedService.title.toLowerCase()} lúc ${selectedScheduleTime}.`
      );
      window.setTimeout(() => {
        window.location.assign(
          maintenanceRequest
            ? `/tracking?bookingId=${encodeURIComponent(createdBooking.id)}`
            : `/payment?bookingId=${encodeURIComponent(createdBooking.id)}`
        );
      }, 350);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Không thể lưu lịch hẹn.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setToast(""), 4200);
    }
  };

  return (
    <section className="min-h-screen text-slate-950">
      <div className="flex w-full flex-col gap-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <Metric value={activeBookings.length} label="Lịch hẹn đang xử lý" />
          <Metric value="11 phút" label="Ghép thợ" />
          <Metric value="4.8" label="Điểm hài lòng" />
        </section>

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
                  {maintenanceRequest.dueDate ? ` • Hạn xử lý ${formatDateLabel(maintenanceRequest.dueDate)}` : ""}
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
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Chọn dịch vụ</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn một dịch vụ để hệ thống gợi ý kỹ thuật viên phù hợp.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative block w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                      placeholder="Tìm vệ sinh, sửa chữa..."
                      type="search"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFilters((open) => !open)}
                    className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                      showFilters || domainFilter !== "all" || priceFilter !== "all" || ratingFilter !== "all"
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
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
                      <FilterChip active={priceFilter === "all"} onClick={() => setPriceFilter("all")}>
                        Tất cả
                      </FilterChip>
                      <FilterChip active={priceFilter === "under250"} onClick={() => setPriceFilter("under250")}>
                        Dưới 250.000đ
                      </FilterChip>
                      <FilterChip active={priceFilter === "from250"} onClick={() => setPriceFilter("from250")}>
                        Từ 250.000đ
                      </FilterChip>
                    </div>
                  </FilterGroup>

                  <FilterGroup label="Đánh giá">
                    <div className="flex flex-wrap gap-2">
                      <FilterChip active={ratingFilter === "all"} onClick={() => setRatingFilter("all")}>
                        Tất cả
                      </FilterChip>
                      <FilterChip active={ratingFilter === "high"} onClick={() => setRatingFilter("high")}>
                        Từ 4.8 sao
                      </FilterChip>
                    </div>
                  </FilterGroup>

                  <button
                    type="button"
                    onClick={() => {
                      setDomainFilter("all");
                      setPriceFilter("all");
                      setRatingFilter("all");
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
                    active={selectedService.id === service.id}
                    onSelect={() => setSelectedService(service)}
                  />
                ))}
                {filteredServices.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500 md:col-span-2">
                    Không tìm thấy dịch vụ phù hợp với bộ lọc.
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 xl:grid-cols-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-11 rounded-2xl border text-sm font-semibold transition ${
                        selectedTime === slot
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
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
                    const active = selectedTechnician.id === technician.id;
                    const busy = bookedTechnicians.includes(technician.name);

                    return (
                      <button
                        key={technician.id}
                        disabled={busy}
                        onClick={() => setSelectedTechnician(technician)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                          busy
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                            : active
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-950">{technician.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{technician.specialty}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-400">
                            Phù hợp {domainLabels[selectedService.domain]} • {technician.distance} • {technician.jobs} lượt hoàn tất
                          </p>
                          {busy && (
                            <p className="mt-2 text-xs font-bold text-rose-600">
                              Đã có lịch trong khung giờ {selectedScheduleTime}
                            </p>
                          )}
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                          {busy ? (
                            "Bận"
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
                      Tất cả kỹ thuật viên phù hợp đang bận khung giờ này. Vui lòng chọn giờ khác.
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
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold uppercase outline-none transition focus:border-emerald-400 focus:bg-white"
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white"
                  />
                </label>
              </Panel>
            </section>

          </div>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={bookingKeyword}
                  onChange={(event) => setBookingKeyword(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
                  placeholder="Tìm mã lịch, dịch vụ, thời gian..."
                  type="search"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowBookingFilters((open) => !open)}
                className={`flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${
                  showBookingFilters || bookingStatusFilter !== "all"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-700"
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
                        {status === "all" ? "Tất cả" : status}
                      </FilterChip>
                    ))}
                  </div>
                </FilterGroup>
                <button
                  type="button"
                  onClick={() => setBookingStatusFilter("all")}
                  className="mt-4 h-10 w-fit rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {paginatedBookings.map((booking) => (
                <article key={booking.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{booking.id}</p>
                  <h3 className="mt-1 font-bold text-slate-950">{booking.service}</h3>
                  <p className="mt-1 text-sm text-slate-600">{booking.time}</p>
                  <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-semibold ring-1 ${bookingStatusClass(booking.stage)}`}>
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
            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
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
                <SummaryRow label="Dịch vụ" value={selectedService.title} />
                <SummaryRow label="Loại dịch vụ" value={domainLabels[selectedService.domain] || selectedService.domain} />
                <SummaryRow label="Thời gian" value={selectedScheduleTime} />
                <SummaryRow label="Kỹ thuật viên" value={selectedTechnician.name} />
                <SummaryRow label="Phí dịch vụ" value={formatCurrency(selectedService.price)} />
                <SummaryRow label="Dịch vụ thêm" value={formatCurrency(addOnTotal)} />
                <SummaryRow label="Nền tảng" value={formatCurrency(platformFee)} />
                <SummaryRow label="Ưu đãi" value={`-${formatCurrency(discount)}`} />
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <SummaryRow label="Tổng thanh toán" value={formatCurrency(total)} strong />
                <button
                  onClick={confirmBooking}
                  disabled={!address.trim() || saving || selectedTechnicianBusy || availableTechnicians.length === 0}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-400 text-sm font-bold text-slate-950 transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  <CreditCard size={18} />
                  {saving
                    ? "Đang lưu..."
                    : selectedTechnicianBusy || availableTechnicians.length === 0
                    ? "Chọn giờ hoặc kỹ thuật viên khác"
                    : "Xác nhận đặt lịch"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold">Quy trình phục vụ</h2>
              <div className="mt-4 grid gap-3">
                <FlowItem icon={<ClipboardList size={18} />} title="Xác nhận lịch hẹn" detail="HomeCare ghi nhận dịch vụ, địa chỉ và khung giờ bạn chọn." />
                <FlowItem icon={<ShieldCheck size={18} />} title="Điều phối kỹ thuật viên" detail="Ưu tiên người phù hợp theo khu vực, chuyên môn và đánh giá." />
                <FlowItem icon={<CreditCard size={18} />} title="Thanh toán" detail="Sau khi xác nhận đặt lịch, bạn sẽ chuyển sang trang thanh toán." />
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
        active ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentClasses[service.accent]}`}>
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
          ? "border-indigo-500 bg-indigo-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function Pagination({ className = "", page, pageCount, total, startIndex, pageSize, itemLabel, onPageChange }) {
  if (total <= pageSize) {
    return null;
  }

  return (
    <div className={`${className} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
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
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
      <span className={strong ? "text-base font-bold text-white" : "text-slate-300"}>{label}</span>
      <span className={strong ? "text-right text-xl font-bold text-indigo-300" : "text-right font-semibold text-white"}>{value}</span>
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
