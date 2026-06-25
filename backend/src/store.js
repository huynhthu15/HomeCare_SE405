import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "../data/db.json");

const initialData = {
  users: [
    {
      id: "USR-SAMPLE-001",
      name: "Nguyễn Minh Khang",
      email: "khang.nguyen@example.com",
      passwordHash: "sample-customer-01:cc22cdbf91e885578a0275bbd354b2546657c118adbf1ca8f991ff052da3a2ba",
      role: "customer",
      createdAt: "2026-06-22T03:15:38.328Z"
    },
    {
      id: "USR-SAMPLE-002",
      name: "Trần Hà Linh",
      email: "linh.tran@example.com",
      passwordHash: "sample-customer-02:bfc566d135a4c7d5042332dd9cd26f757c7c1b65944dfa0a02b7df3bd5e98754",
      role: "customer",
      createdAt: "2026-06-22T03:20:00.000Z"
    },
    {
      id: "USR-SAMPLE-ADMIN",
      name: "HomeCare Admin",
      email: "admin@homecare.test",
      passwordHash: "sample-admin-01:c466e7f17015133b26de9b5131ce76f4e5f2b32b6c665ec59ca1811cc3571beb",
      role: "admin",
      createdAt: "2026-06-22T03:25:00.000Z"
    }
  ],
  profiles: [
    {
      id: "profile-default",
      name: "Nguyễn Minh Khang",
      phone: "0908 245 688",
      email: "khang.nguyen@example.com",
      updatedAt: new Date().toISOString()
    },
    {
      id: "USR-SAMPLE-001",
      name: "Nguyễn Minh Khang",
      phone: "0908 245 688",
      email: "khang.nguyen@example.com",
      address: "12 Nguyễn Văn Linh, Quận 7, TP.HCM",
      updatedAt: new Date().toISOString()
    },
    {
      id: "USR-SAMPLE-002",
      name: "Trần Hà Linh",
      phone: "0912 334 556",
      email: "linh.tran@example.com",
      address: "45 Lê Văn Sỹ, Quận 3, TP.HCM",
      updatedAt: new Date().toISOString()
    },
    {
      id: "USR-SAMPLE-ADMIN",
      name: "HomeCare Admin",
      phone: "0900 000 001",
      email: "admin@homecare.test",
      address: "HomeCare Operation Center",
      updatedAt: new Date().toISOString()
    }
  ],
  bookings: [
    {
      id: "BK-24061",
      userId: "USR-SAMPLE-001",
      service: "Vệ sinh máy lạnh",
      domain: "Cleaning",
      time: "Hôm nay, 15:30",
      status: "Đã xác nhận",
      technician: "Nguyễn Minh Khang",
      amount: 397000,
      address: "12 Nguyễn Văn Linh, Quận 7",
      note: "Gọi trước 10 phút khi đến nơi.",
      createdAt: new Date().toISOString()
    },
    {
      id: "BK-24071",
      userId: "USR-SAMPLE-002",
      service: "Bảo trì tủ lạnh",
      domain: "Appliance",
      time: "Thứ 6, 14:00",
      status: "Đã xác nhận",
      technician: "Phạm Gia Hân",
      amount: 252000,
      address: "45 Lê Văn Sỹ, Quận 3",
      note: "Tủ lạnh kêu to vào ban đêm.",
      createdAt: new Date().toISOString()
    },
    {
      id: "BK-OPS-001",
      userId: "USR-SAMPLE-ADMIN",
      service: "Kiểm tra trung tâm điều phối",
      domain: "Booking",
      time: "Hôm nay, 17:00",
      status: "Nội bộ",
      technician: "HomeCare Ops",
      amount: 0,
      address: "HomeCare Operation Center",
      note: "Dữ liệu riêng cho tài khoản admin.",
      createdAt: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: "TXN-78291",
      userId: "USR-SAMPLE-001",
      bookingId: "BK-24061",
      service: "Vệ sinh máy lạnh",
      method: "Thẻ Visa/Mastercard",
      amount: 397000,
      status: "Thành công",
      createdAt: new Date().toISOString()
    },
    {
      id: "TXN-24071",
      userId: "USR-SAMPLE-002",
      bookingId: "BK-24071",
      service: "Bảo trì tủ lạnh",
      method: "Ví điện tử",
      amount: 252000,
      status: "Thành công",
      createdAt: new Date().toISOString()
    },
    {
      id: "TXN-OPS-001",
      userId: "USR-SAMPLE-ADMIN",
      bookingId: "BK-OPS-001",
      service: "Kiểm tra trung tâm điều phối",
      method: "Nội bộ",
      amount: 0,
      status: "Đã ghi nhận",
      createdAt: new Date().toISOString()
    }
  ],
  paymentMethods: [
    {
      id: "card",
      userId: "USR-SAMPLE-001",
      name: "Thẻ Visa/Mastercard",
      detail: "Visa - **** 2486",
      accountLabel: "Nguyễn Minh Khang",
      accountValue: "**** 2486",
      provider: "Visa",
      referencePrefix: "CARD",
      fee: 0,
      updatedAt: new Date().toISOString()
    },
    {
      id: "wallet",
      userId: "USR-SAMPLE-001",
      name: "Ví điện tử",
      detail: "MoMo - 0909 123 456",
      accountLabel: "MoMo",
      accountValue: "0909 123 456",
      provider: "MoMo",
      referencePrefix: "WALLET",
      fee: 2500,
      updatedAt: new Date().toISOString()
    },
    {
      id: "bank",
      userId: "USR-SAMPLE-001",
      name: "Chuyển khoản ngân hàng",
      detail: "Vietcombank - 1028 884 688",
      accountLabel: "VCB - Nguyễn Minh Khang",
      accountValue: "1028 884 688",
      provider: "Vietcombank",
      referencePrefix: "BANK",
      fee: 0,
      updatedAt: new Date().toISOString()
    },
    {
      id: "cash",
      userId: "USR-SAMPLE-001",
      name: "Tiền mặt sau dịch vụ",
      detail: "Tiền mặt - Thanh toán cho kỹ thuật viên",
      accountLabel: "Thu tại nhà",
      accountValue: "Thanh toán cho kỹ thuật viên",
      provider: "Tiền mặt",
      referencePrefix: "CASH",
      fee: 0,
      updatedAt: new Date().toISOString()
    }
  ],
  services: [
    {
      id: "cleaning-aircon",
      domain: "Cleaning",
      title: "Vệ sinh máy lạnh",
      description: "Làm sạch dàn lạnh, lưới lọc và kiểm tra hoạt động.",
      subtitle: "Dàn lạnh, lưới lọc, kiểm tra gas",
      price: 180000,
      duration: "60 phút",
      rating: 4.9,
      demand: "Cao"
    },
    {
      id: "cleaning-kitchen",
      domain: "Cleaning",
      title: "Vệ sinh bếp",
      description: "Bếp gas/từ, máy hút mùi, mặt đá.",
      subtitle: "Bếp gas/từ, máy hút mùi, mặt đá",
      price: 260000,
      duration: "90 phút",
      rating: 4.8,
      demand: "Cao"
    },
    {
      id: "repair-electric",
      domain: "Repair",
      title: "Sửa chữa điện",
      description: "Ổ cắm, aptomat, đèn, chập điện.",
      subtitle: "Ổ cắm, aptomat, đèn, chập điện",
      price: 220000,
      duration: "90 phút",
      response: "30 phút",
      rating: 4.9,
      demand: "Nhanh"
    },
    {
      id: "repair-water",
      domain: "Repair",
      title: "Sửa chữa nước",
      description: "Rò rỉ, nghẹt lavabo, bơm nước.",
      subtitle: "Rò rỉ, nghẹt lavabo, bơm nước",
      price: 240000,
      duration: "90 phút",
      response: "35 phút",
      rating: 4.8,
      demand: "Nhanh"
    },
    {
      id: "appliance-fridge",
      domain: "Appliance",
      title: "Bảo trì tủ lạnh",
      description: "Vệ sinh ron cửa, đo nhiệt độ và kiểm tra block.",
      subtitle: "Vệ sinh ron cửa, đo nhiệt độ và kiểm tra block",
      price: 220000,
      duration: "75 phút",
      rating: 4.7,
      demand: "Định kỳ"
    },
    {
      id: "appliance-maintenance",
      domain: "Appliance",
      title: "Bảo trì thiết bị",
      description: "Kiểm tra, vệ sinh nhẹ và đánh giá tình trạng thiết bị gia dụng.",
      subtitle: "Kiểm tra tổng quát, vệ sinh nhẹ, khuyến nghị bảo trì",
      price: 220000,
      duration: "75 phút",
      rating: 4.8,
      demand: "Định kỳ"
    },
    {
      id: "tracking-live",
      domain: "Tracking",
      title: "Theo dõi kỹ thuật viên",
      description: "Cập nhật vị trí, ETA, checklist và ảnh nghiệm thu.",
      subtitle: "ETA, trạng thái và checklist",
      price: 0,
      duration: "Realtime",
      rating: 4.9,
      demand: "Live"
    }
  ],
  devices: [
    {
      id: "DV-001",
      userId: "USR-SAMPLE-001",
      name: "Máy lạnh phòng khách",
      status: "Hoạt động tốt",
      room: "Phòng khách",
      health: 92,
      tone: "emerald"
    },
    {
      id: "DV-002",
      userId: "USR-SAMPLE-001",
      name: "Máy giặt LG",
      status: "Cần bảo trì",
      room: "Ban công",
      health: 68,
      tone: "amber"
    },
    {
      id: "DV-003",
      userId: "USR-SAMPLE-001",
      name: "Tủ lạnh Samsung",
      status: "Lỗi cảm biến",
      room: "Bếp",
      health: 44,
      tone: "rose"
    },
    {
      id: "DV-LINH-001",
      userId: "USR-SAMPLE-002",
      name: "Máy lạnh phòng ngủ",
      status: "Cần vệ sinh",
      room: "Phòng ngủ",
      health: 61,
      tone: "amber"
    },
    {
      id: "DV-LINH-002",
      userId: "USR-SAMPLE-002",
      name: "Tủ lạnh Panasonic",
      status: "Hoạt động ổn định",
      room: "Bếp",
      health: 88,
      tone: "emerald"
    },
    {
      id: "DV-OPS-001",
      userId: "USR-SAMPLE-ADMIN",
      name: "Bảng điều phối trung tâm",
      status: "Online",
      room: "Operation Center",
      health: 99,
      tone: "emerald"
    }
  ],
  reminders: [
    {
      id: "RM-001",
      userId: "USR-SAMPLE-001",
      deviceId: "DV-001",
      deviceName: "Máy lạnh phòng khách",
      title: "Vệ sinh lưới lọc máy lạnh",
      type: "Vệ sinh định kỳ",
      domain: "Cleaning",
      dueDate: "2026-06-27",
      note: "Đã hơn 90 ngày từ lần vệ sinh gần nhất.",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "RM-002",
      userId: "USR-SAMPLE-001",
      deviceId: "DV-002",
      deviceName: "Máy giặt LG",
      title: "Kiểm tra ống xả máy giặt",
      type: "Kiểm tra kỹ thuật",
      domain: "Repair",
      dueDate: "2026-06-24",
      note: "Ống xả có dấu hiệu thoát nước chậm.",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "RM-LINH-001",
      userId: "USR-SAMPLE-002",
      deviceId: "DV-LINH-001",
      deviceName: "Máy lạnh phòng ngủ",
      title: "Đặt lịch vệ sinh máy lạnh phòng ngủ",
      type: "Vệ sinh định kỳ",
      domain: "Cleaning",
      dueDate: "2026-06-28",
      note: "Hiệu suất lạnh giảm trong tuần gần đây.",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "RM-LINH-002",
      userId: "USR-SAMPLE-002",
      deviceId: "DV-LINH-003",
      deviceName: "Máy lọc nước Karofi",
      title: "Thay lõi lọc nước định kỳ",
      type: "Bảo trì",
      domain: "Appliance",
      dueDate: "2026-07-05",
      note: "Chu kỳ thay lõi sắp đến hạn.",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  alerts: [
    {
      id: "AL-001",
      userId: "USR-SAMPLE-001",
      title: "Máy lạnh cần vệ sinh",
      desc: "Đã 90 ngày chưa vệ sinh",
      level: "Ưu tiên"
    },
    {
      id: "AL-002",
      userId: "USR-SAMPLE-001",
      title: "Tủ lạnh tiêu thụ điện cao",
      desc: "Tăng 25% so với tháng trước",
      level: "Theo dõi"
    },
    {
      id: "AL-LINH-001",
      userId: "USR-SAMPLE-002",
      title: "Máy lạnh phòng ngủ cần vệ sinh",
      desc: "Hiệu suất lạnh giảm trong 7 ngày gần đây",
      level: "Ưu tiên"
    },
    {
      id: "AL-OPS-001",
      userId: "USR-SAMPLE-ADMIN",
      title: "Đối soát dữ liệu mẫu",
      desc: "Tài khoản admin đang dùng bộ dữ liệu vận hành riêng",
      level: "Nội bộ"
    }
  ]
};

export async function readDb() {
  try {
    const content = await readFile(dbPath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }

    await writeDb(initialData);
    return structuredClone(initialData);
  }
}

export async function writeDb(data) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function createId(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}
