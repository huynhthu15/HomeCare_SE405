/**
 * Development seed — ported from legacy/backend/src/store.js.
 * Idempotent: safe to run repeatedly (`pnpm db:seed`). NEVER run against production.
 *
 * Test accounts (password for all: Homecare@123)
 *   admin@homecare.test        ADMIN
 *   khang.nguyen@example.com   CUSTOMER
 *   linh.tran@example.com      CUSTOMER
 *   TECH-088, TECH-018, TECH-027, TECH-041   TECHNICIAN (log in with the code)
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, ServiceDomain } from '../src/generated/prisma/client';

const SEED_PASSWORD = 'Homecare@123';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to seed a production database');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const services: Array<{
  code: string;
  domain: ServiceDomain;
  title: string;
  description: string;
  basePrice: number;
  durationMin: number;
}> = [
  {
    code: 'cleaning-aircon',
    domain: 'CLEANING',
    title: 'Vệ sinh máy lạnh',
    description: 'Làm sạch dàn lạnh, lưới lọc và kiểm tra hoạt động.',
    basePrice: 180_000,
    durationMin: 60,
  },
  {
    code: 'cleaning-kitchen',
    domain: 'CLEANING',
    title: 'Vệ sinh bếp',
    description: 'Bếp gas/từ, máy hút mùi, mặt đá.',
    basePrice: 260_000,
    durationMin: 90,
  },
  {
    code: 'repair-electric',
    domain: 'REPAIR',
    title: 'Sửa chữa điện',
    description: 'Ổ cắm, aptomat, đèn, chập điện.',
    basePrice: 220_000,
    durationMin: 90,
  },
  {
    code: 'repair-water',
    domain: 'REPAIR',
    title: 'Sửa chữa nước',
    description: 'Rò rỉ, nghẹt lavabo, bơm nước.',
    basePrice: 240_000,
    durationMin: 90,
  },
  {
    code: 'repair-electronics',
    domain: 'REPAIR',
    title: 'Điện tử gia dụng',
    description: 'TV, loa, lò vi sóng, bếp điện.',
    basePrice: 280_000,
    durationMin: 90,
  },
  {
    code: 'repair-general',
    domain: 'REPAIR',
    title: 'Bảo trì tổng hợp',
    description: 'Bản lề, khóa cửa, kệ và thiết bị nhỏ.',
    basePrice: 190_000,
    durationMin: 60,
  },
  {
    code: 'repair-aircon',
    domain: 'REPAIR',
    title: 'Sửa máy lạnh',
    description: 'Không lạnh, rò nước, lỗi remote, vệ sinh dàn nóng.',
    basePrice: 260_000,
    durationMin: 90,
  },
  {
    code: 'repair-washer',
    domain: 'REPAIR',
    title: 'Sửa máy giặt',
    description: 'Không vắt, không xả nước, rung lắc, báo lỗi.',
    basePrice: 250_000,
    durationMin: 90,
  },
  {
    code: 'repair-lock-door',
    domain: 'REPAIR',
    title: 'Sửa khóa cửa',
    description: 'Khóa kẹt, bản lề xệ, tay nắm, khóa thông minh.',
    basePrice: 210_000,
    durationMin: 60,
  },
  {
    code: 'repair-internet-camera',
    domain: 'REPAIR',
    title: 'Internet & camera',
    description: 'Mất mạng, camera offline, đầu ghi, dây tín hiệu.',
    basePrice: 230_000,
    durationMin: 60,
  },
  {
    code: 'appliance-fridge',
    domain: 'APPLIANCE',
    title: 'Bảo trì tủ lạnh',
    description: 'Vệ sinh ron cửa, đo nhiệt độ và kiểm tra block.',
    basePrice: 220_000,
    durationMin: 75,
  },
  {
    code: 'appliance-maintenance',
    domain: 'APPLIANCE',
    title: 'Bảo trì thiết bị',
    description: 'Kiểm tra, vệ sinh nhẹ và đánh giá tình trạng thiết bị gia dụng.',
    basePrice: 220_000,
    durationMin: 75,
  },
];

const technicians: Array<{
  code: string;
  fullName: string;
  email: string;
  phone: string;
  skills: ServiceDomain[];
  serviceAreas: string[];
  experienceYears: number;
  rating: number;
  completedJobs: number;
}> = [
  {
    code: 'TECH-088',
    fullName: 'Phạm Quốc Việt',
    email: 'viet.technician@homecare.test',
    phone: '0908234567',
    skills: ['CLEANING', 'REPAIR', 'APPLIANCE'],
    serviceAreas: ['Quận 4', 'Quận 7', 'TP Thủ Đức'],
    experienceYears: 5,
    rating: 4.9,
    completedJobs: 1284,
  },
  {
    code: 'TECH-018',
    fullName: 'Trần Minh Khôi',
    email: 'khoi.technician@homecare.test',
    phone: '0908111222',
    skills: ['CLEANING', 'APPLIANCE'],
    serviceAreas: ['Quận 7', 'Nhà Bè'],
    experienceYears: 3,
    rating: 4.9,
    completedJobs: 218,
  },
  {
    code: 'TECH-027',
    fullName: 'Lê Hoàng An',
    email: 'an.technician@homecare.test',
    phone: '0908333444',
    skills: ['REPAIR'],
    serviceAreas: ['Quận 1', 'Quận 3', 'Quận 10'],
    experienceYears: 4,
    rating: 4.8,
    completedJobs: 184,
  },
  {
    code: 'TECH-041',
    fullName: 'Phạm Gia Hân',
    email: 'han.technician@homecare.test',
    phone: '0908555666',
    skills: ['APPLIANCE', 'REPAIR'],
    serviceAreas: ['Quận 3', 'Phú Nhuận'],
    experienceYears: 2,
    rating: 4.7,
    completedJobs: 156,
  },
];

async function main(): Promise<void> {
  const passwordHash = await argon2.hash(SEED_PASSWORD, { type: argon2.argon2id });

  // ---- identity ----
  await prisma.user.upsert({
    where: { email: 'admin@homecare.test' },
    update: {},
    create: {
      email: 'admin@homecare.test',
      phone: '0900000001',
      fullName: 'HomeCare Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });

  const khang = await prisma.user.upsert({
    where: { email: 'khang.nguyen@example.com' },
    update: {},
    create: {
      email: 'khang.nguyen@example.com',
      phone: '0908245688',
      fullName: 'Nguyễn Minh Khang',
      passwordHash,
    },
  });
  const linh = await prisma.user.upsert({
    where: { email: 'linh.tran@example.com' },
    update: {},
    create: {
      email: 'linh.tran@example.com',
      phone: '0912334556',
      fullName: 'Trần Hà Linh',
      passwordHash,
    },
  });

  for (const t of technicians) {
    const user = await prisma.user.upsert({
      where: { technicianCode: t.code },
      update: {},
      create: {
        email: t.email,
        phone: t.phone,
        fullName: t.fullName,
        role: 'TECHNICIAN',
        technicianCode: t.code,
        passwordHash,
      },
    });
    await prisma.technicianProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        skills: t.skills,
        serviceAreas: t.serviceAreas,
        experienceYears: t.experienceYears,
        rating: t.rating,
        completedJobs: t.completedJobs,
      },
    });
  }

  // ---- catalog ----
  for (const s of services) {
    await prisma.service.upsert({ where: { code: s.code }, update: s, create: s });
  }
  for (const a of [
    { code: 'photo-report', label: 'Báo cáo ảnh trước/sau', price: 20_000 },
    { code: 'warranty-14d', label: 'Bảo hành mở rộng 14 ngày', price: 45_000 },
    { code: 'priority', label: 'Ưu tiên kỹ thuật viên gần nhất', price: 30_000 },
  ]) {
    await prisma.addOn.upsert({ where: { code: a.code }, update: a, create: a });
  }
  await prisma.voucher.upsert({
    where: { code: 'HOMECARE10' },
    update: {},
    create: {
      code: 'HOMECARE10',
      discountType: 'FIXED',
      value: 30_000,
      minOrder: 150_000,
      startsAt: new Date('2026-01-01T00:00:00Z'),
      endsAt: new Date('2027-12-31T23:59:59Z'),
      usageLimit: 1000,
    },
  });

  // ---- profile (dev data is recreated on every run) ----
  for (const user of [khang, linh]) {
    await prisma.maintenanceReminder.deleteMany({ where: { userId: user.id } });
    await prisma.device.deleteMany({ where: { userId: user.id } });
    await prisma.address.deleteMany({ where: { userId: user.id } });
  }

  const khangHome = await prisma.address.create({
    data: {
      userId: khang.id,
      label: 'Nhà',
      line1: '12 Nguyễn Văn Linh',
      district: 'Quận 7',
      city: 'TP.HCM',
      lat: 10.7296,
      lng: 106.7215,
    },
  });
  const linhHome = await prisma.address.create({
    data: {
      userId: linh.id,
      label: 'Nhà',
      line1: '45 Lê Văn Sỹ',
      district: 'Quận 3',
      city: 'TP.HCM',
      lat: 10.7866,
      lng: 106.683,
    },
  });
  await prisma.customerProfile.upsert({
    where: { userId: khang.id },
    update: { defaultAddressId: khangHome.id },
    create: { userId: khang.id, defaultAddressId: khangHome.id },
  });
  await prisma.customerProfile.upsert({
    where: { userId: linh.id },
    update: { defaultAddressId: linhHome.id },
    create: { userId: linh.id, defaultAddressId: linhHome.id },
  });

  const aircon = await prisma.device.create({
    data: {
      userId: khang.id,
      name: 'Máy lạnh phòng khách',
      type: 'Máy lạnh',
      brand: 'Daikin',
      room: 'Phòng khách',
      healthScore: 92,
    },
  });
  const washer = await prisma.device.create({
    data: {
      userId: khang.id,
      name: 'Máy giặt LG',
      type: 'Máy giặt',
      brand: 'LG',
      room: 'Ban công',
      healthScore: 68,
    },
  });
  await prisma.device.create({
    data: {
      userId: khang.id,
      name: 'Tủ lạnh Samsung',
      type: 'Tủ lạnh',
      brand: 'Samsung',
      room: 'Bếp',
      healthScore: 44,
    },
  });
  const linhAircon = await prisma.device.create({
    data: {
      userId: linh.id,
      name: 'Máy lạnh phòng ngủ',
      type: 'Máy lạnh',
      brand: 'Panasonic',
      room: 'Phòng ngủ',
      healthScore: 61,
    },
  });

  await prisma.maintenanceReminder.createMany({
    data: [
      {
        userId: khang.id,
        deviceId: aircon.id,
        title: 'Vệ sinh lưới lọc máy lạnh',
        domain: 'CLEANING',
        dueDate: daysFromNow(3),
        note: 'Đã hơn 90 ngày từ lần vệ sinh gần nhất.',
      },
      {
        userId: khang.id,
        deviceId: washer.id,
        title: 'Kiểm tra ống xả máy giặt',
        domain: 'REPAIR',
        dueDate: daysFromNow(1),
        note: 'Ống xả có dấu hiệu thoát nước chậm.',
      },
      {
        userId: linh.id,
        deviceId: linhAircon.id,
        title: 'Đặt lịch vệ sinh máy lạnh phòng ngủ',
        domain: 'CLEANING',
        dueDate: daysFromNow(5),
        note: 'Hiệu suất lạnh giảm trong tuần gần đây.',
      },
    ],
  });

  console.warn(`Seed complete. Test password for every account: ${SEED_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
