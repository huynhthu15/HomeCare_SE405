import { createHash, randomBytes } from "node:crypto";
import http from "node:http";
import { createId, readDb, writeDb } from "./store.js";

const port = Number(process.env.PORT || 4000);
const allowedOrigin = process.env.CORS_ORIGIN || "*";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) {
        request.destroy();
        reject(new Error("Payload quá lớn"));
      }
    });

    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("JSON không hợp lệ"));
      }
    });
  });
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, passwordHash) {
  const [salt] = passwordHash.split(":");
  return hashPassword(password, salt) === passwordHash;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "customer"
  };
}

function servicesFromDb(db) {
  return Array.isArray(db.services) ? db.services : [];
}

function normalizeScheduleValue(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}

function isActiveScheduleStatus(status = "") {
  return !["đã hủy", "hoàn tất", "hoàn thành", "từ chối", "cancelled", "completed"].includes(
    normalizeScheduleValue(status)
  );
}

function technicianNameById(db, technicianId) {
  const data = ensureTechnicianData(db);
  return data.technicians.find((technician) => technician.id === technicianId)?.name || "";
}

function bookedTechniciansAt(db, time) {
  const normalizedTime = normalizeScheduleValue(time);

  if (!normalizedTime) {
    return [];
  }

  const fromBookings = (Array.isArray(db.bookings) ? db.bookings : [])
    .filter(
      (booking) =>
        booking.technician &&
        normalizeScheduleValue(booking.time) === normalizedTime &&
        isActiveScheduleStatus(booking.status)
    )
    .map((booking) => booking.technician);

  const data = ensureTechnicianData(db);
  const fromJobs = data.technicianJobs
    .filter(
      (job) =>
        normalizeScheduleValue(job.time) === normalizedTime &&
        isActiveScheduleStatus(job.status)
    )
    .map((job) => technicianNameById(data, job.technicianId))
    .filter(Boolean);

  return Array.from(new Set([...fromBookings, ...fromJobs]));
}

const defaultPaymentMethods = [
  {
    id: "card",
    name: "Thẻ Visa/Mastercard",
    detail: "Visa - **** 2486",
    accountLabel: "Nguyễn Minh Khang",
    accountValue: "**** 2486",
    provider: "Visa",
    referencePrefix: "CARD",
    fee: 0
  },
  {
    id: "wallet",
    name: "Ví điện tử",
    detail: "MoMo - 0909 123 456",
    accountLabel: "MoMo",
    accountValue: "0909 123 456",
    provider: "MoMo",
    referencePrefix: "WALLET",
    fee: 2500
  },
  {
    id: "bank",
    name: "Chuyển khoản ngân hàng",
    detail: "Vietcombank - 1028 884 688",
    accountLabel: "VCB - Nguyễn Minh Khang",
    accountValue: "1028 884 688",
    provider: "Vietcombank",
    referencePrefix: "BANK",
    fee: 0
  },
  {
    id: "cash",
    name: "Tiền mặt sau dịch vụ",
    detail: "Tiền mặt - Thanh toán cho kỹ thuật viên",
    accountLabel: "Thu tại nhà",
    accountValue: "Thanh toán cho kỹ thuật viên",
    provider: "Tiền mặt",
    referencePrefix: "CASH",
    fee: 0
  }
];

function paymentMethodsForUser(db, user) {
  db.paymentMethods = Array.isArray(db.paymentMethods) ? db.paymentMethods : [];

  if (!user) {
    return defaultPaymentMethods.map((method) => ({
      ...method,
      userId: null,
      updatedAt: new Date().toISOString()
    }));
  }

  const userId = user.id;
  const existing = db.paymentMethods.filter((method) => method.userId === userId);

  if (existing.length > 0) {
    return existing;
  }

  const seeded = defaultPaymentMethods.map((method) => ({
    ...method,
    userId,
    updatedAt: new Date().toISOString()
  }));
  db.paymentMethods.push(...seeded);
  return seeded;
}

function createToken(user) {
  return Buffer.from(
    JSON.stringify({
      userId: user.id,
      email: user.email,
      issuedAt: Date.now()
    })
  ).toString("base64url");
}

function createTechnicianToken(technician) {
  return Buffer.from(
    JSON.stringify({
      technicianId: technician.id,
      code: technician.code,
      issuedAt: Date.now()
    })
  ).toString("base64url");
}

function readToken(request) {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function findUserByToken(request, db) {
  const payload = readToken(request);

  if (!payload?.userId || !payload?.email) {
    return null;
  }

  return db.users.find(
    (user) => user.id === payload.userId && user.email === payload.email
  );
}

function findTechnicianByToken(request, db) {
  const payload = readToken(request);

  if (!payload?.technicianId || !payload?.code) {
    return null;
  }

  return ensureTechnicianData(db).technicians.find(
    (technician) => technician.id === payload.technicianId && technician.code === payload.code
  );
}

function publicTechnician(technician) {
  return {
    id: technician.id,
    code: technician.code,
    name: technician.name,
    role: technician.role,
    phone: technician.phone,
    email: technician.email,
    area: technician.area,
    experience: technician.experience,
    completedJobs: technician.completedJobs,
    certificates: technician.certificates,
    rating: technician.rating,
    reviews: technician.reviews
  };
}

function ensureTechnicianData(db) {
  db.technicians = Array.isArray(db.technicians) ? db.technicians : [];
  db.technicianJobs = Array.isArray(db.technicianJobs) ? db.technicianJobs : [];
  db.technicianLocations = Array.isArray(db.technicianLocations) ? db.technicianLocations : [];
  db.technicianReports = Array.isArray(db.technicianReports) ? db.technicianReports : [];

  if (db.technicians.length === 0) {
    db.technicians.push({
      id: "TECH-088",
      code: "TECH-088",
      password: "123456",
      name: "Phạm Quốc Việt",
      role: "Kỹ thuật viên điện lạnh & vệ sinh",
      phone: "0908 234 567",
      email: "viet.technician@homecare.vn",
      area: "Quận 4, Quận 7, TP Thủ Đức",
      experience: "5 năm kinh nghiệm",
      completedJobs: 1284,
      certificates: ["An toàn điện dân dụng", "Vệ sinh HVAC", "Sửa chữa thiết bị gia dụng"],
      rating: 4.9,
      reviews: [
        "Đúng giờ, giải thích lỗi rõ ràng và xử lý nhanh.",
        "Có ảnh trước/sau đầy đủ, khu vực làm việc rất gọn.",
        "Thái độ chuyên nghiệp, tư vấn cách sử dụng thiết bị tốt."
      ],
      createdAt: "2026-06-23T08:00:00.000Z"
    });
  }

  if (db.technicianJobs.length === 0) {
    db.technicianJobs.push(
      {
        id: "HC-2408",
        technicianId: "TECH-088",
        service: "Vệ sinh máy lạnh",
        customer: "Nguyễn Minh Khang",
        phone: "0912 456 789",
        address: "12 Nguyễn Văn Linh, Quận 7",
        time: "Hôm nay, 10:00",
        status: "Chờ nhận",
        fee: 180000,
        distance: "2.4 km",
        priority: "Gấp",
        note: "Máy lạnh phòng ngủ, cần dung dịch không mùi.",
        checklist: ["Chụp ảnh trước", "Vệ sinh lưới lọc", "Kiểm tra dàn lạnh", "Chạy thử sau xử lý"],
        createdAt: "2026-06-23T08:00:00.000Z"
      },
      {
        id: "HC-2411",
        technicianId: "TECH-088",
        service: "Sửa máy giặt",
        customer: "Trần Thu Hà",
        phone: "0903 112 224",
        address: "88 Hoàng Diệu, Quận 4",
        time: "Hôm nay, 13:30",
        status: "Đã nhận",
        fee: 260000,
        distance: "4.1 km",
        priority: "Tiêu chuẩn",
        note: "Máy báo lỗi E2, khách có mặt sau 13:00.",
        checklist: ["Chẩn đoán lỗi", "Báo linh kiện", "Cập nhật trạng thái", "Xác nhận nghiệm thu"],
        createdAt: "2026-06-23T08:15:00.000Z"
      },
      {
        id: "HC-2415",
        technicianId: "TECH-088",
        service: "Giặt sofa - nệm",
        customer: "Lê Bảo An",
        phone: "0988 661 552",
        address: "21 Mai Chí Thọ, TP Thủ Đức",
        time: "Hôm nay, 16:00",
        status: "Đang thực hiện",
        fee: 320000,
        distance: "6.8 km",
        priority: "Tiêu chuẩn",
        note: "Sofa vải màu xám, có vết cà phê.",
        checklist: ["Chụp ảnh trước", "Hút bụi sâu", "Giặt hơi nước", "Chụp ảnh sau"],
        createdAt: "2026-06-23T08:30:00.000Z"
      },
      {
        id: "HC-2422",
        technicianId: "TECH-088",
        service: "Vệ sinh bếp",
        customer: "Hoàng Ngọc Mai",
        phone: "0937 888 120",
        address: "5 Nguyễn Thị Thập, Quận 7",
        time: "Ngày mai, 09:00",
        status: "Chờ nhận",
        fee: 240000,
        distance: "3.2 km",
        priority: "Tiêu chuẩn",
        note: "Cần vệ sinh máy hút mùi và mặt đá.",
        checklist: ["Xác nhận lịch", "Vệ sinh bếp", "Khử mùi", "Bàn giao"],
        createdAt: "2026-06-23T08:45:00.000Z"
      }
    );
  }

  return db;
}

function technicianSchedule(jobs) {
  return [
    { time: "08:30", label: "Check-in kho dụng cụ", detail: "Nhận bộ dụng cụ và hóa chất" },
    ...jobs
      .filter((job) => String(job.time || "").startsWith("Hôm nay"))
      .map((job) => ({
        time: String(job.time || "").split(",").pop()?.trim() || "Trong ngày",
        label: `${job.id} - ${job.service}`,
        detail: job.address
      }))
  ];
}

function technicianStats(jobs) {
  const visibleJobs = jobs.filter((job) => job.status !== "Từ chối");
  const todayJobs = visibleJobs.filter((job) => String(job.time || "").startsWith("Hôm nay"));
  const completedJobs = jobs.filter((job) => job.status === "Hoàn thành");
  const income = jobs
    .filter((job) => ["Đã nhận", "Đang di chuyển", "Đang thực hiện", "Hoàn thành"].includes(job.status))
    .reduce((sum, job) => sum + Number(job.fee || 0), 0);

  return {
    assigned: visibleJobs.length,
    today: todayJobs.length,
    completed: completedJobs.length,
    income
  };
}

async function handleAuth(pathname, request, response) {
  const db = await readDb();

  if (pathname === "/auth/me" && request.method === "GET") {
    const user = findUserByToken(request, db);

    if (!user) {
      sendJson(response, 401, { message: "Phiên đăng nhập không hợp lệ" });
      return;
    }

    sendJson(response, 200, { user: publicUser(user) });
    return;
  }

  const body = await parseBody(request);

  if (pathname === "/auth/register" && request.method === "POST") {
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || password.length < 6) {
      sendJson(response, 400, { message: "Tên, email và mật khẩu từ 6 ký tự là bắt buộc" });
      return;
    }

    if (db.users.some((user) => user.email === email)) {
      sendJson(response, 409, { message: "Email đã được đăng ký" });
      return;
    }

    const user = {
      id: createId("USR"),
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    db.profiles.push({
      id: user.id,
      name,
      phone: "",
      email,
      updatedAt: new Date().toISOString()
    });
    await writeDb(db);
    sendJson(response, 201, { token: createToken(user), user: publicUser(user) });
    return;
  }

  if (pathname === "/auth/login" && request.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = db.users.find((item) => item.email === email);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendJson(response, 401, { message: "Email hoặc mật khẩu không đúng" });
      return;
    }

    sendJson(response, 200, { token: createToken(user), user: publicUser(user) });
    return;
  }

  sendJson(response, 404, { message: "Không tìm thấy endpoint auth" });
}

async function handleTechnician(pathname, request, response) {
  const db = ensureTechnicianData(await readDb());

  if (pathname === "/technician/login" && request.method === "POST") {
    const body = await parseBody(request);
    const code = String(body.code || "").trim().toUpperCase();
    const password = String(body.password || "");
    const technician = db.technicians.find((item) => item.code === code || item.id === code);

    if (!technician || technician.password !== password) {
      sendJson(response, 401, { message: "Mã kỹ thuật viên hoặc mật khẩu không đúng" });
      return;
    }

    await writeDb(db);
    sendJson(response, 200, {
      token: createTechnicianToken(technician),
      technician: publicTechnician(technician)
    });
    return;
  }

  const technician = findTechnicianByToken(request, db);

  if (!technician) {
    sendJson(response, 401, { message: "Phiên kỹ thuật viên không hợp lệ" });
    return;
  }

  const jobs = db.technicianJobs.filter((job) => job.technicianId === technician.id);

  if (pathname === "/technician/me" && request.method === "GET") {
    sendJson(response, 200, { technician: publicTechnician(technician) });
    return;
  }

  if (pathname === "/technician/dashboard" && request.method === "GET") {
    const latestLocation = db.technicianLocations
      .filter((item) => item.technicianId === technician.id)
      .at(-1);

    sendJson(response, 200, {
      technician: publicTechnician(technician),
      jobs,
      schedule: technicianSchedule(jobs),
      stats: technicianStats(jobs),
      location: latestLocation || null,
      reports: db.technicianReports.filter((report) => report.technicianId === technician.id)
    });
    return;
  }

  if (pathname === "/technician/jobs" && request.method === "GET") {
    sendJson(response, 200, jobs);
    return;
  }

  if (pathname.startsWith("/technician/jobs/") && pathname.endsWith("/status") && request.method === "PUT") {
    const [, , , jobId] = pathname.split("/");
    const body = await parseBody(request);
    const status = String(body.status || "").trim();
    const allowedStatuses = ["Chờ nhận", "Đã nhận", "Từ chối", "Đang di chuyển", "Đang thực hiện", "Hoàn thành"];
    const job = db.technicianJobs.find((item) => item.id === decodeURIComponent(jobId) && item.technicianId === technician.id);

    if (!job) {
      sendJson(response, 404, { message: "Không tìm thấy công việc" });
      return;
    }

    if (!allowedStatuses.includes(status)) {
      sendJson(response, 400, { message: "Trạng thái công việc không hợp lệ" });
      return;
    }

    job.status = status;
    job.updatedAt = new Date().toISOString();

    const booking = db.bookings.find((item) => item.id === job.bookingId);
    if (booking) {
      booking.status = status;
      booking.technician = technician.name;
    }

    await writeDb(db);
    sendJson(response, 200, job);
    return;
  }

  if (pathname === "/technician/location" && request.method === "POST") {
    const body = await parseBody(request);
    const location = {
      id: createId("LOC"),
      technicianId: technician.id,
      lat: Number(body.lat),
      lng: Number(body.lng),
      accuracy: String(body.accuracy || "").trim(),
      jobId: String(body.jobId || "").trim(),
      createdAt: new Date().toISOString()
    };

    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      sendJson(response, 400, { message: "Tọa độ vị trí không hợp lệ" });
      return;
    }

    db.technicianLocations.push(location);
    await writeDb(db);
    sendJson(response, 201, location);
    return;
  }

  if (pathname.startsWith("/technician/jobs/") && pathname.endsWith("/report") && request.method === "POST") {
    const [, , , jobId] = pathname.split("/");
    const body = await parseBody(request);
    const job = db.technicianJobs.find((item) => item.id === decodeURIComponent(jobId) && item.technicianId === technician.id);

    if (!job) {
      sendJson(response, 404, { message: "Không tìm thấy công việc" });
      return;
    }

    const report = {
      id: createId("RPT"),
      technicianId: technician.id,
      jobId: job.id,
      beforePhoto: String(body.beforePhoto || ""),
      afterPhoto: String(body.afterPhoto || ""),
      note: String(body.note || "").trim(),
      completedAt: new Date().toISOString()
    };

    if (!report.beforePhoto || !report.afterPhoto) {
      sendJson(response, 400, { message: "Cần ảnh trước và ảnh sau để hoàn thành công việc" });
      return;
    }

    db.technicianReports.push(report);
    job.status = "Hoàn thành";
    job.reportId = report.id;
    job.reportNote = report.note;
    job.completedAt = report.completedAt;
    job.updatedAt = report.completedAt;

    const booking = db.bookings.find((item) => item.id === job.bookingId);
    if (booking) {
      booking.status = "Hoàn thành";
      booking.technician = technician.name;
    }

    await writeDb(db);
    sendJson(response, 201, { report, job });
    return;
  }

  sendJson(response, 404, { message: "Không tìm thấy endpoint technician" });
}

async function handleApi(pathname, request, response) {
  const db = await readDb();
  db.reminders = Array.isArray(db.reminders) ? db.reminders : [];
  const user = findUserByToken(request, db);
  const userBookings = user
    ? db.bookings.filter((booking) => booking.userId === user.id)
    : db.bookings;
  const userPayments = user
    ? db.payments.filter((payment) => payment.userId === user.id)
    : db.payments;
  const userDevices = user
    ? db.devices.filter((device) => device.userId === user.id)
    : db.devices;
  const userAlerts = user
    ? db.alerts.filter((alert) => alert.userId === user.id)
    : db.alerts;
  const userReminders = user
    ? db.reminders.filter((reminder) => reminder.userId === user.id)
    : db.reminders;

  if (pathname === "/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, service: "homecare-backend" });
    return;
  }

  if (pathname === "/dashboard" && request.method === "GET") {
    const profile =
      (user && db.profiles.find((item) => item.id === user.id)) ||
      db.profiles.find((item) => item.id === "profile-default") ||
      db.profiles[0];
    const assignedBooking = userBookings.find((booking) => booking.technician);

    sendJson(response, 200, {
      user: user ? publicUser(user) : null,
      profile,
      devices: userDevices,
      bookings: userBookings.slice(-6).reverse(),
      payments: userPayments.slice(-6).reverse(),
      alerts: userAlerts,
      reminders: userReminders,
      technician: assignedBooking
        ? {
            name: assignedBooking.technician,
            status: assignedBooking.status,
            job: assignedBooking.service
          }
        : null
    });
    return;
  }

  if (pathname === "/services" && request.method === "GET") {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const domain = url.searchParams.get("domain");
    const services = servicesFromDb(db);

    sendJson(
      response,
      200,
      domain ? services.filter((service) => service.domain === domain) : services
    );
    return;
  }

  if (pathname === "/booking-options" && request.method === "GET") {
    sendJson(response, 200, db.bookingOptions);
    return;
  }

  if (pathname === "/technicians" && request.method === "GET") {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const domain = url.searchParams.get("domain");
    const technicians = Array.isArray(db.bookingOptions.technicians)
      ? db.bookingOptions.technicians
      : [];

    sendJson(
      response,
      200,
      domain ? technicians.filter((technician) => technician.domains?.includes(domain)) : technicians
    );
    return;
  }

  if (pathname === "/payment-gateways" && request.method === "GET") {
    sendJson(response, 200, db.paymentGateways);
    return;
  }

  if (pathname === "/profile-options" && request.method === "GET") {
    sendJson(response, 200, db.profileOptions);
    return;
  }

  if (pathname === "/repair-options" && request.method === "GET") {
    sendJson(response, 200, db.repairOptions);
    return;
  }

  if (pathname === "/technician-availability" && request.method === "GET") {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    const time = url.searchParams.get("time") || "";

    sendJson(response, 200, {
      time,
      bookedTechnicians: bookedTechniciansAt(db, time)
    });
    return;
  }

  if (pathname === "/devices" && request.method === "GET") {
    sendJson(response, 200, userDevices);
    return;
  }

  if (pathname === "/devices" && request.method === "POST") {
    const body = await parseBody(request);
    const device = {
      id: createId("DV"),
      userId: user?.id || null,
      name: String(body.name || "").trim(),
      type: String(body.type || "Thiết bị").trim(),
      room: String(body.room || "").trim(),
      brand: String(body.brand || "").trim(),
      status: String(body.status || "Đang hoạt động").trim(),
      health: Math.min(Math.max(Number(body.health || 85), 0), 100),
      energy: String(body.energy || "Ổn định").trim(),
      nextService: String(body.nextService || "Theo lịch định kỳ").trim(),
      lastService: String(body.lastService || "Chưa có").trim(),
      warranty: String(body.warranty || "Chưa cập nhật").trim(),
      tone: String(body.tone || "emerald").trim(),
      createdAt: new Date().toISOString()
    };

    if (!device.name || !device.room || !device.brand) {
      sendJson(response, 400, { message: "Tên thiết bị, phòng và thương hiệu là bắt buộc" });
      return;
    }

    db.devices.push(device);
    await writeDb(db);
    sendJson(response, 201, device);
    return;
  }

  if (pathname.startsWith("/devices/") && request.method === "PUT") {
    const deviceId = decodeURIComponent(pathname.split("/").pop() || "");
    const body = await parseBody(request);
    const device = db.devices.find(
      (item) => item.id === deviceId && (!user || item.userId === user.id)
    );

    if (!device) {
      sendJson(response, 404, { message: "Không tìm thấy thiết bị" });
      return;
    }

    device.name = String(body.name || device.name || "").trim();
    device.type = String(body.type || device.type || "Thiết bị").trim();
    device.room = String(body.room || device.room || "").trim();
    device.brand = String(body.brand || device.brand || "").trim();
    device.status = String(body.status || device.status || "Đang hoạt động").trim();
    device.health = Math.min(Math.max(Number(body.health ?? device.health ?? 85), 0), 100);
    device.energy = String(body.energy || device.energy || "Ổn định").trim();
    device.nextService = String(body.nextService || device.nextService || "Theo lịch định kỳ").trim();
    device.lastService = String(body.lastService || device.lastService || "Chưa có").trim();
    device.warranty = String(body.warranty || device.warranty || "Chưa cập nhật").trim();
    device.tone = String(body.tone || device.tone || "emerald").trim();
    device.updatedAt = new Date().toISOString();

    if (!device.name || !device.room || !device.brand) {
      sendJson(response, 400, { message: "Tên thiết bị, phòng và thương hiệu là bắt buộc" });
      return;
    }

    await writeDb(db);
    sendJson(response, 200, device);
    return;
  }

  if (pathname === "/reminders" && request.method === "GET") {
    sendJson(response, 200, userReminders);
    return;
  }

  if (pathname === "/reminders" && request.method === "POST") {
    const body = await parseBody(request);
    const device = db.devices.find(
      (item) => item.id === body.deviceId && (!user || item.userId === user.id)
    );
    const reminder = {
      id: createId("RM"),
      userId: user?.id || null,
      deviceId: String(body.deviceId || device?.id || "").trim(),
      deviceName: String(body.deviceName || device?.name || "Thiết bị").trim(),
      title: String(body.title || "").trim(),
      type: String(body.type || "Bảo trì").trim(),
      domain: String(body.domain || "Appliance").trim(),
      dueDate: String(body.dueDate || "").trim(),
      note: String(body.note || "").trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!reminder.title || !reminder.dueDate) {
      sendJson(response, 400, { message: "Tên nhắc việc và ngày thực hiện là bắt buộc" });
      return;
    }

    db.reminders.push(reminder);
    await writeDb(db);
    sendJson(response, 201, reminder);
    return;
  }

  if (pathname.startsWith("/reminders/") && request.method === "PUT") {
    const reminderId = decodeURIComponent(pathname.split("/").pop() || "");
    const body = await parseBody(request);
    const reminder = db.reminders.find(
      (item) => item.id === reminderId && (!user || item.userId === user.id)
    );

    if (!reminder) {
      sendJson(response, 404, { message: "Không tìm thấy nhắc việc" });
      return;
    }

    reminder.status = String(body.status || reminder.status).trim();
    reminder.bookingId = body.bookingId ? String(body.bookingId).trim() : reminder.bookingId;
    reminder.completedAt = reminder.status === "done" ? new Date().toISOString() : reminder.completedAt;
    reminder.updatedAt = new Date().toISOString();

    await writeDb(db);
    sendJson(response, 200, reminder);
    return;
  }

  if (pathname === "/bookings" && request.method === "GET") {
    sendJson(response, 200, userBookings);
    return;
  }

  if (pathname === "/bookings" && request.method === "POST") {
    const body = await parseBody(request);
    const booking = {
      id: createId("BK"),
      userId: user?.id || null,
      service: String(body.service || "").trim(),
      domain: String(body.domain || "Booking").trim(),
      time: String(body.time || "").trim(),
      status: body.source === "reminder" ? "Chờ kỹ thuật viên tiếp nhận" : "Chờ xác nhận thanh toán",
      technician: String(body.technician || "").trim(),
      amount: Number(body.amount || 0),
      address: String(body.address || "").trim(),
      note: String(body.note || "").trim(),
      voucher: String(body.voucher || "").trim(),
      addOns: Array.isArray(body.addOns) ? body.addOns : [],
      source: String(body.source || "booking").trim(),
      reminderId: body.reminderId ? String(body.reminderId).trim() : undefined,
      deviceId: body.deviceId ? String(body.deviceId).trim() : undefined,
      deviceName: body.deviceName ? String(body.deviceName).trim() : undefined,
      createdAt: new Date().toISOString()
    };

    if (!booking.service || !booking.time || !booking.address) {
      sendJson(response, 400, { message: "Dịch vụ, thời gian và địa chỉ là bắt buộc" });
      return;
    }

    if (booking.technician && bookedTechniciansAt(db, booking.time).includes(booking.technician)) {
      sendJson(response, 409, {
        message: `${booking.technician} đã có lịch trong khung giờ ${booking.time}. Vui lòng chọn kỹ thuật viên hoặc giờ khác.`
      });
      return;
    }

    db.bookings.push(booking);

    if (booking.reminderId) {
      const reminder = db.reminders.find(
        (item) => item.id === booking.reminderId && (!user || item.userId === user.id)
      );

      if (reminder) {
        reminder.status = "scheduled";
        reminder.bookingId = booking.id;
        reminder.updatedAt = booking.createdAt;
      }
    }

    await writeDb(db);
    sendJson(response, 201, booking);
    return;
  }

  if (pathname === "/payments" && request.method === "GET") {
    sendJson(response, 200, userPayments);
    return;
  }

  if (pathname === "/payment-methods" && request.method === "GET") {
    const methods = paymentMethodsForUser(db, user);
    await writeDb(db);
    sendJson(response, 200, methods);
    return;
  }

  if (pathname.startsWith("/payment-methods/") && request.method === "PUT") {
    const methodId = decodeURIComponent(pathname.split("/").pop() || "");
    const body = await parseBody(request);
    const methods = paymentMethodsForUser(db, user);
    const method = methods.find((item) => item.id === methodId);

    if (!method) {
      sendJson(response, 404, { message: "Không tìm thấy phương thức thanh toán" });
      return;
    }

    method.provider = String(body.provider || method.provider).trim();
    method.accountValue = String(body.accountValue || method.accountValue).trim();
    method.accountLabel = String(body.accountLabel || method.accountLabel).trim();
    method.fee = Number(body.fee ?? method.fee);
    method.detail = `${method.provider} - ${method.accountValue}`;
    method.updatedAt = new Date().toISOString();

    await writeDb(db);
    sendJson(response, 200, method);
    return;
  }

  if (pathname === "/payments" && request.method === "POST") {
    const body = await parseBody(request);
    const payment = {
      id: createId("TXN"),
      userId: user?.id || null,
      bookingId: String(body.bookingId || "").trim(),
      service: String(body.service || "").trim(),
      method: String(body.method || "").trim(),
      methodDetail: String(body.methodDetail || "").trim(),
      gateway: String(body.gateway || "").trim(),
      gatewayRef: String(body.gatewayRef || "").trim(),
      amount: Number(body.amount || 0),
      status: "Thành công",
      createdAt: new Date().toISOString()
    };

    if (!payment.service || !payment.method || payment.amount <= 0) {
      sendJson(response, 400, { message: "Dịch vụ, phương thức và số tiền là bắt buộc" });
      return;
    }

    db.payments.push(payment);
    const booking = db.bookings.find(
      (item) => item.id === payment.bookingId && (!user || item.userId === user.id)
    );

    if (booking) {
      booking.status = "Đã thanh toán";
      booking.paymentId = payment.id;
      booking.paidAt = payment.createdAt;
    }

    await writeDb(db);
    sendJson(response, 201, payment);
    return;
  }

  if (pathname === "/profile" && request.method === "GET") {
    const profile =
      (user && db.profiles.find((item) => item.id === user.id)) ||
      db.profiles.find((item) => item.id === "profile-default") ||
      db.profiles[0];

    sendJson(response, 200, profile);
    return;
  }

  if (pathname === "/profile" && request.method === "PUT") {
    const body = await parseBody(request);
    const latest =
      (user && db.profiles.find((item) => item.id === user.id)) ||
      db.profiles.find((item) => item.id === "profile-default") ||
      { id: user?.id || "profile-default" };
    const profile = {
      ...latest,
      name: String(body.name || latest.name || "").trim(),
      phone: String(body.phone || latest.phone || "").trim(),
      email: String(body.email || latest.email || "").trim(),
      updatedAt: new Date().toISOString()
    };

    db.profiles = db.profiles.filter((item) => item.id !== profile.id);
    db.profiles.push(profile);
    await writeDb(db);
    sendJson(response, 200, profile);
    return;
  }

  sendJson(response, 404, { message: "Không tìm thấy endpoint" });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    const url = new URL(request.url || "/", `http://${request.headers.host}`);
    if (url.pathname.startsWith("/auth/")) {
      await handleAuth(url.pathname, request, response);
      return;
    }

    if (url.pathname.startsWith("/technician/")) {
      await handleTechnician(url.pathname, request, response);
      return;
    }

    await handleApi(url.pathname, request, response);
  } catch (error) {
    sendJson(response, 500, { message: error.message || "Lỗi server" });
  }
});

server.listen(port, () => {
  console.log(`Homecare backend is running at http://localhost:${port}`);
});
