# Tái sử dụng giao diện cũ trong app mới

> Đọc file này trước khi làm màn hình của module mình.
> **Quyết định của nhóm:** giữ nguyên giao diện cũ (đã hoàn thiện), **không viết lại**. Chỉ thay cách đăng nhập và cách lấy dữ liệu.

## 1. Hiện trạng

|                                     | Đã có                                                                                                                                                 | Chưa có                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Frontend mới** (`frontend`)       | Trang đăng nhập (giao diện theo `RootShell.jsx` cũ), khung sidebar/header, dashboard tạm, admin › người dùng, trang "đang chuyển đổi" cho các phân hệ | Toàn bộ màn hình nghiệp vụ cũ                                           |
| **Backend mới** (`backend`)         | `/api/v1/auth/*`, `/api/v1/admin/users`                                                                                                               | Mọi API nghiệp vụ (dashboard, dịch vụ, đặt lịch, thanh toán, thiết bị…) |
| **Giao diện cũ** (`legacy/web/src`) | ~6.900 dòng, 10 màn hình hoàn chỉnh                                                                                                                   | —                                                                       |

Vì vậy nếu chỉ copy giao diện sang, **màn hình sẽ hiện đủ nhưng chưa có dữ liệu** cho tới khi người phụ trách làm xong API tương ứng.

## 2. Giao diện cũ có chạy được trong app mới không?

Có, gần như nguyên vẹn. Hai bên dùng chung React, react-router, lucide-react và Tailwind. Khác biệt cần xử lý:

| Khác biệt                                                                                      | Cách xử lý                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| React 18 → 19                                                                                  | Không cần sửa đáng kể                                                                      |
| `react-router-dom` → `react-router` (cùng v7, cùng API)                                        | Đổi dòng import                                                                            |
| Tailwind 3 → 4: `shadow-sm` (60 chỗ) → `shadow-xs`, `outline-none` (43 chỗ) → `outline-hidden` | Chạy công cụ chính thức `npx @tailwindcss/upgrade` trong `frontend`, rồi xem lại giao diện |
| File `.jsx`                                                                                    | Giữ `.jsx` được; chuyển dần sang `.tsx` khi sửa tới                                        |

## 3. Bảng màn hình: cần API gì, ai làm

| Màn hình                     | File cũ (`legacy/web/src/…`)                       |      Dòng | API cũ màn hình đang gọi                                                                             | Người phụ trách |
| ---------------------------- | -------------------------------------------------- | --------: | ---------------------------------------------------------------------------------------------------- | --------------- |
| Đăng nhập                    | `portal/RootShell.jsx`                             |         — | `/auth/*`, `/technician/login`                                                                       | ✅ đã có        |
| Tổng quan + chuông thông báo | `customer/pages/Dashboard.jsx`, `customer/App.jsx` | 582 + 678 | `/dashboard`                                                                                         | TV1             |
| Thiết bị & nhắc bảo trì      | `features/appliance/ApplianceApp.jsx`              |     1.044 | `/devices`, `/reminders`, `/bookings`, `/dashboard`                                                  | TV1             |
| Hồ sơ                        | `features/profile/ProfileApp.jsx`                  |       484 | `/profile`, `/payment-methods`, `/profile-options`, `/dashboard`                                     | TV1             |
| Vệ sinh                      | `features/cleaning/CleaningApp.jsx`                |       572 | `/services`, `/bookings`, `/booking-options`                                                         | TV2             |
| Sửa chữa                     | `features/repair/RepairApp.jsx`                    |       506 | `/services`, `/bookings`, `/repair-options`, `/profile`                                              | TV2             |
| Đặt lịch                     | `features/booking/BookingApp.jsx`                  |     1.053 | `/services`, `/technicians`, `/booking-options`, `/bookings`, `/profile`, `/technician-availability` | TV2             |
| Thanh toán                   | `features/payment/PaymentApp.jsx`                  |       707 | `/payments`, `/payment-gateways`, `/bookings`, `/booking-options`                                    | TV3             |
| Theo dõi                     | `features/tracking/TrackingApp.jsx`                |       347 | `/bookings`, `/dashboard` (+ realtime mới)                                                           | TV4             |
| Kỹ thuật viên                | `features/technician/TechnicianApp.jsx`            |       965 | `/technician/dashboard`, `/technician/jobs/…`, `/technician/location`                                | TV4             |

Màn hình nào dùng chung API của người khác (vd. Thiết bị gọi `/bookings`) thì chờ hoặc phối hợp với người làm API đó.

## 4. Quy trình chuyển (2 bước)

**Bước 1 — Đưa toàn bộ giao diện cũ vào app mới (làm một lần, một người, trước khi chia việc)**

1. Copy từng màn hình vào `frontend/src/features/<module>/` (vd. `features/booking/BookingPage.jsx`).
2. Nối route trong `frontend/src/App.tsx` thay cho trang "đang chuyển đổi".
3. Chạy `npx @tailwindcss/upgrade`, đổi import `react-router-dom` → `react-router`.
4. Thay phần đăng nhập/token theo mục 5.1.

Kết quả: app mới trông giống bản cũ, các ô dữ liệu tạm trống hoặc báo lỗi.

**Bước 2 — Mỗi người làm cho màn hình của mình có dữ liệu**

1. Làm API backend trong module của mình (skill `nest-module`).
2. **Ưu tiên trả về đúng tên trường mà màn hình cũ đang dùng**, để phần giao diện gần như không phải sửa. Nếu đổi tên trường thì sửa luôn màn hình trong cùng PR.
3. Sửa lời gọi API trong màn hình theo mục 5.
4. Đổi `ready: true` cho màn hình đó trong `frontend/src/config/modules.ts`.

## 5. Những chỗ BẮT BUỘC sửa khi chuyển

Đây là các lỗ hổng của bản cũ. Giữ nguyên thì vi phạm quy tắc kiến trúc (CLAUDE.md) và reviewer sẽ không duyệt.

### 5.1 Đăng nhập và gọi API

Bản cũ lưu token trong `localStorage` (`auth_token`, `auth_user`, `portal_session`, `technician_token`, `technician_session`) và tự gắn header. Kẻ tấn công chỉ cần một lỗi XSS là lấy được token.

```js
// Cũ — bỏ
fetch(`${API_BASE_URL}/bookings`, { headers: getAuthHeaders() }).then((r) => r.json());
```

```ts
// Mới — token nằm trong bộ nhớ, tự gia hạn, tự thêm tiền tố /api/v1
import { api } from '../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

const bookings = useQuery({ queryKey: ['bookings'], queryFn: () => api<Booking[]>('/bookings') });
```

Người đang đăng nhập lấy từ `useAuth()` (`frontend/src/auth/auth-context.tsx`). Báo lỗi bằng `ApiError.message`; rẽ nhánh theo `ApiError.code`.

### 5.2 Không gửi số tiền từ trình duyệt

Bản cũ tự tính tổng tiền rồi gửi lên server, nên ai cũng sửa được giá:

- `features/booking/BookingApp.jsx:380` — `amount: total`
- `features/cleaning/CleaningApp.jsx:158` — `amount: total`
- `features/repair/RepairApp.jsx:166` — `amount: total`
- `features/payment/PaymentApp.jsx:235` — `amount: total`

App mới: trình duyệt chỉ gửi **ID** (dịch vụ, add-on, địa chỉ, khung giờ, mã voucher). Server tự tính tiền từ bảng giá. Muốn hiện tổng tiền trước khi khách bấm đặt, gọi API báo giá của TV2 (ví dụ `POST /bookings/quote`) và **hiện đúng con số server trả về**.

### 5.3 Không gửi tên kỹ thuật viên hay trạng thái

- `BookingApp.jsx:379` gửi `technician: selectedTechnician.name` → gửi `technicianId` (nếu cho khách chọn) hoặc để module dispatch tự gán.
- Trạng thái booking/thanh toán do server quyết định qua state machine. Trình duyệt không bao giờ gửi `status`.

### 5.4 Thanh toán

Bản cũ mô phỏng cổng thanh toán và mã OTP **ngay trên trình duyệt** (`gatewaySteps`, `runGatewaySimulation`, `authCode` trong `PaymentApp.jsx`). Như vậy chỉ cần gọi thẳng API là "thanh toán thành công".

App mới: trình duyệt chuyển hướng sang `payment-sandbox`. Kết quả thanh toán chỉ được ghi nhận khi server nhận IPN có chữ ký hợp lệ ([ADR-0003](adr/0003-mock-vnpay-gateway.md)). Giữ phần giao diện chọn phương thức và hóa đơn; bỏ phần giả lập.

### 5.5 Vị trí kỹ thuật viên

Bản cũ gửi `POST /technician/location` mỗi 5 giây (`TechnicianApp.jsx:222`). App mới gửi vị trí qua Socket.IO, server kiểm tra KTV có đang được gán booking đó không (TV4, [ADR-0005](adr/0005-load-balancing-realtime.md)).

### 5.6 Giá trị và mã

| Bản cũ                                        | App mới                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `domain: "Cleaning"`                          | `CLEANING` (enum trong `packages/shared`)                                                                                                              |
| Trạng thái chữ tiếng Việt (`"Đã thanh toán"`) | Mã (`PAID`); giao diện đổi mã sang chữ tiếng Việt bằng một bảng nhãn dùng chung, đặt ở `frontend/src/lib/labels.ts` (tạo khi chuyển màn hình đầu tiên) |
| ID dạng `BK-24061`                            | ID là UUID; mã hiển thị cho người dùng là trường `code`                                                                                                |
| Dữ liệu mẫu viết cứng trong file              | Lấy từ API; dữ liệu mẫu nằm ở `backend/prisma/seed.ts`                                                                                                 |

## 6. Màn hình kỹ thuật viên: web hay app Expo? (cần nhóm quyết định)

|                       | Giữ bản web cũ (`TechnicianApp.jsx`)    | Làm app Expo (kế hoạch ban đầu)       |
| --------------------- | --------------------------------------- | ------------------------------------- |
| Công sức              | Ít: dùng lại 965 dòng                   | Nhiều: viết lại giao diện cho di động |
| GPS                   | Chỉ chạy khi đang mở trang              | Chạy nền cả khi tắt màn hình          |
| Camera, thông báo đẩy | Chụp ảnh qua trình duyệt, không có push | Đầy đủ                                |

Gợi ý: dùng bản web cho MVP, làm Expo ở phase sau nếu còn thời gian. Chốt xong thì cập nhật `docs/team.md`.

## 7. Checklist khi mở PR cho một màn hình đã chuyển

- [ ] Không còn `localStorage` cho token; mọi lời gọi đi qua `api()` / `useQuery`
- [ ] Không gửi `amount`, `price`, `total`, `status`, `userId` hay tên KTV
- [ ] Giá tiền hiển thị lấy từ server
- [ ] Đã xử lý 3 trạng thái: đang tải, dữ liệu rỗng, lỗi API
- [ ] Đã đổi `ready: true` trong `frontend/src/config/modules.ts`
- [ ] Đã thử thủ công với tài khoản seed (mật khẩu `Homecare@123`)
