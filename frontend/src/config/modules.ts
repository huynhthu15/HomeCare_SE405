import {
  ClipboardList,
  CreditCard,
  Home,
  PackageCheck,
  Radar,
  Sparkles,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type Owner = 'TV1' | 'TV2' | 'TV3' | 'TV4';

export interface CustomerModule {
  path: string;
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
  owner: Owner;
  /** API module that backs this screen */
  apiModule: string;
  /** Prototype screen to port from */
  legacyFile?: string;
  ready: boolean;
}

/** Customer navigation. Flip `ready` to true when the owner ships the screen. */
export const customerModules: CustomerModule[] = [
  {
    path: '/',
    label: 'Tổng quan',
    icon: Home,
    title: 'Tổng quan chăm sóc nhà',
    description: 'Thiết bị, lịch dịch vụ, kỹ thuật viên và thanh toán trong một màn hình.',
    owner: 'TV1',
    apiModule: 'profile',
    legacyFile: 'legacy/web/src/customer/pages/Dashboard.jsx',
    ready: true,
  },
  {
    path: '/cleaning',
    label: 'Vệ sinh',
    icon: Sparkles,
    title: 'Đặt lịch vệ sinh',
    description: 'Gói vệ sinh, khu vực cần làm sạch và các lịch đang xử lý.',
    owner: 'TV2',
    apiModule: 'catalog + booking',
    legacyFile: 'legacy/web/src/features/cleaning/CleaningApp.jsx',
    ready: false,
  },
  {
    path: '/repair',
    label: 'Sửa chữa',
    icon: Wrench,
    title: 'Sửa chữa tại nhà',
    description: 'Tiếp nhận sự cố, mức khẩn cấp và theo dõi ticket sửa chữa.',
    owner: 'TV2',
    apiModule: 'catalog + booking',
    legacyFile: 'legacy/web/src/features/repair/RepairApp.jsx',
    ready: false,
  },
  {
    path: '/appliance',
    label: 'Thiết bị',
    icon: PackageCheck,
    title: 'Quản lý thiết bị',
    description: 'Sức khỏe thiết bị và lịch bảo trì định kỳ.',
    owner: 'TV1',
    apiModule: 'profile (devices, reminders)',
    legacyFile: 'legacy/web/src/features/appliance/ApplianceApp.jsx',
    ready: false,
  },
  {
    path: '/booking',
    label: 'Đặt lịch',
    icon: ClipboardList,
    title: 'Đặt dịch vụ',
    description: 'Chọn dịch vụ, khung giờ, add-on và voucher — giá do máy chủ tính.',
    owner: 'TV2',
    apiModule: 'booking + dispatch',
    legacyFile: 'legacy/web/src/features/booking/BookingApp.jsx',
    ready: false,
  },
  {
    path: '/tracking',
    label: 'Theo dõi',
    icon: Radar,
    title: 'Theo dõi kỹ thuật viên',
    description: 'Vị trí realtime, ETA và timeline xử lý theo từng booking.',
    owner: 'TV4',
    apiModule: 'tracking (Socket.IO)',
    legacyFile: 'legacy/web/src/features/tracking/TrackingApp.jsx',
    ready: false,
  },
  {
    path: '/payment',
    label: 'Thanh toán',
    icon: CreditCard,
    title: 'Thanh toán',
    description: 'Thanh toán qua cổng mô phỏng VNPay, lịch sử giao dịch và hoàn tiền.',
    owner: 'TV3',
    apiModule: 'payments',
    legacyFile: 'legacy/web/src/features/payment/PaymentApp.jsx',
    ready: false,
  },
  {
    path: '/profile',
    label: 'Hồ sơ',
    icon: UserRound,
    title: 'Hồ sơ người dùng',
    description: 'Thông tin cá nhân, địa chỉ, bảo mật và các phiên đăng nhập.',
    owner: 'TV1',
    apiModule: 'profile + identity',
    legacyFile: 'legacy/web/src/features/profile/ProfileApp.jsx',
    ready: false,
  },
];

export function moduleFor(pathname: string): CustomerModule {
  return (
    customerModules.filter((m) => m.path !== '/').find((m) => pathname.startsWith(m.path)) ??
    customerModules[0]!
  );
}
