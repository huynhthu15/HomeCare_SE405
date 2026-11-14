# Tái sử dụng giao diện cũ trong app mới

> Đọc file này trước khi làm màn hình của module mình.
> **Quyết định của nhóm:** giữ nguyên giao diện cũ (đã hoàn thiện), **không viết lại**. Chỉ thay cách đăng nhập và cách lấy dữ liệu.

## 1. Hiện trạng

|                            | Đã có                                                                                                                                                                                         | Còn thiếu                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Frontend** (`frontend/`) | ✅ **Toàn bộ giao diện cũ đã được chuyển sang** (bước 1 bên dưới): khung sidebar + chuông thông báo, 8 màn hình khách hàng, màn hình kỹ thuật viên. Thêm: đăng nhập chung, admin › người dùng | Dữ liệu thật: các màn hình đang gọi API chưa tồn tại nên tạm trống      |
| **Backend** (`backend/`)   | `/api/v1/auth/*`, `/api/v1/admin/users`                                                                                                                                                       | Mọi API nghiệp vụ (dashboard, dịch vụ, đặt lịch, thanh toán, thiết bị…) |

Trên mỗi màn hình chưa có API, khung layout hiện một dòng màu vàng: _"Dữ liệu sẽ hiển thị khi API … hoàn thành (phụ trách TVx)"_. Dòng này tự biến mất khi người phụ trách đổi `ready: true` (bước 2).

## 2. Đã làm gì khi chuyển (bước 1 — xong)

| Thay đổi                                                                                                                                                                        | Ở đâu                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Copy 9 màn hình, đổi tên `XxxApp.jsx` → `XxxPage.jsx`                                                                                                                           | `frontend/src/features/<tên>/`            |
| Khung layout cũ (`customer/App.jsx`)                                                                                                                                            | `frontend/src/layouts/CustomerLayout.jsx` |
| Bỏ token trong `localStorage`; mọi lời gọi `fetch(${API_BASE_URL}…)` đổi thành `apiFetch('…')` (token trong bộ nhớ, tự gia hạn, tự thêm `/api/v1`)                              | `frontend/src/lib/api-client.ts`          |
| Màn hình kỹ thuật viên: bỏ form đăng nhập riêng, dùng trang `/login` chung (đăng nhập bằng mã `TECH-…`)                                                                         | `features/technician/TechnicianPage.jsx`  |
| `react-router-dom` → `react-router`                                                                                                                                             | các file trên                             |
| Tailwind 3 → 4: `shadow-sm` → `shadow-xs` (56), `outline-none` → `outline-hidden` (32), `rounded` → `rounded-sm` (3), thêm CSS tương thích (màu viền, con trỏ nút, placeholder) | các file trên, `frontend/src/index.css`   |
| Ảnh đại diện từ `pravatar.cc` → chữ cái đầu của tên (không gọi dịch vụ bên ngoài)                                                                                               | `CustomerLayout.jsx`                      |
| Đánh dấu `TODO` ở mọi chỗ còn gửi giá tiền / tên KTV / giả lập thanh toán                                                                                                       | xem mục 5                                 |

Các file `.jsx` được build bình thường nhưng **chưa được kiểm tra kiểu** (`allowJs`, không `checkJs`). Khi sửa nhiều một màn hình, nên đổi sang `.tsx`.

## 3. Bảng màn hình: cần API gì, ai làm

| Màn hình                     | File (`frontend/src/…`)                                              | API màn hình đang gọi                                                                                | Người phụ trách |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------- |
| Đăng nhập                    | `pages/LoginPage.tsx`                                                | `/auth/*`                                                                                            | ✅ đã chạy      |
| Tổng quan + chuông thông báo | `features/dashboard/DashboardPage.jsx`, `layouts/CustomerLayout.jsx` | `/dashboard`                                                                                         | TV1             |
| Thiết bị & nhắc bảo trì      | `features/appliance/AppliancePage.jsx`                               | `/devices`, `/reminders`, `/bookings`, `/dashboard`                                                  | TV1             |
| Hồ sơ                        | `features/profile/ProfilePage.jsx`                                   | `/profile`, `/payment-methods`, `/profile-options`, `/dashboard`                                     | TV1             |
| Vệ sinh                      | `features/cleaning/CleaningPage.jsx`                                 | `/services`, `/bookings`, `/booking-options`                                                         | TV2             |
| Sửa chữa                     | `features/repair/RepairPage.jsx`                                     | `/services`, `/bookings`, `/repair-options`, `/profile`                                              | TV2             |
| Đặt lịch                     | `features/booking/BookingPage.jsx`                                   | `/services`, `/technicians`, `/booking-options`, `/bookings`, `/profile`, `/technician-availability` | TV2             |
| Thanh toán                   | `features/payment/PaymentPage.jsx`                                   | `/payments`, `/payment-gateways`, `/bookings`, `/booking-options`                                    | TV3             |
| Theo dõi                     | `features/tracking/TrackingPage.jsx`                                 | `/bookings`, `/dashboard` (+ realtime mới)                                                           | TV4             |
| Kỹ thuật viên                | `features/technician/TechnicianPage.jsx`                             | `/technician/dashboard`, `/technician/jobs/…`, `/technician/location`                                | TV4             |

Đường dẫn ở cột API là phần sau `/api/v1` (vd. `/dashboard` = `GET /api/v1/dashboard`). Màn hình nào dùng chung API của người khác (vd. Thiết bị gọi `/bookings`) thì chờ hoặc phối hợp với người làm API đó. Bản gốc của từng màn hình vẫn ở `legacy/web/src` để đối chiếu.

## 4. Việc của mỗi người (bước 2)

1. Làm API backend trong module của mình (skill `nest-module`).
2. **Ưu tiên trả về đúng tên trường mà màn hình đang đọc**, để giao diện gần như không phải sửa. Nếu đổi tên trường thì sửa luôn màn hình trong cùng PR.
3. Xử lý các `TODO` trong màn hình của mình (mục 5).
4. Đổi `ready: true` cho màn hình đó trong `frontend/src/config/modules.ts` → dòng thông báo vàng biến mất.

## 5. Những chỗ BẮT BUỘC sửa (đã đánh dấu `TODO` trong code)

Đây là các lỗ hổng mang từ bản cũ sang. Giữ nguyên thì vi phạm quy tắc kiến trúc (CLAUDE.md) và reviewer sẽ không duyệt.

### 5.1 Đăng nhập và gọi API — ✅ đã sửa ở bước 1

Bản cũ lưu token trong `localStorage` (`auth_token`, `technician_token`…) nên một lỗi XSS là lộ token. Giờ các màn hình gọi `apiFetch`, giữ nguyên kiểu đọc `response.ok` / `response.json()` như code cũ:

```js
// Hiện tại trong các màn hình đã chuyển
const response = await apiFetch('/bookings');
```

Code **mới** nên dùng `api()` (có kiểu, tự ném `ApiError`) cùng TanStack Query:

```ts
import { api } from '../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

const bookings = useQuery({ queryKey: ['bookings'], queryFn: () => api<Booking[]>('/bookings') });
```

Người đang đăng nhập lấy từ `useAuth()` (`frontend/src/auth/auth-context.tsx`). Không bao giờ tự đọc/ghi token.

### 5.2 Không gửi số tiền từ trình duyệt

Bản cũ tự tính tổng tiền rồi gửi lên server, nên ai cũng sửa được giá. Các chỗ đã đánh dấu `TODO(owner)`:

- `features/booking/BookingPage.jsx:398` (TV2)
- `features/cleaning/CleaningPage.jsx:152` (TV2)
- `features/repair/RepairPage.jsx:165` (TV2)
- `features/payment/PaymentPage.jsx:249` (TV3)

Cách đúng: trình duyệt chỉ gửi **ID** (dịch vụ, add-on, địa chỉ, khung giờ, mã voucher). Server tự tính tiền từ bảng giá. Muốn hiện tổng tiền trước khi khách bấm đặt, gọi API báo giá của TV2 (ví dụ `POST /bookings/quote`) và **hiện đúng con số server trả về**.

### 5.3 Không gửi tên kỹ thuật viên hay trạng thái

- `features/booking/BookingPage.jsx:396` (`TODO(TV2)`) gửi `technician: selectedTechnician.name` → gửi `technicianId` (nếu cho khách chọn) hoặc để module dispatch tự gán.
- Trạng thái booking/thanh toán do server quyết định qua state machine. Trình duyệt không bao giờ gửi `status`.

### 5.4 Thanh toán

Bản cũ mô phỏng cổng thanh toán và mã OTP **ngay trên trình duyệt** (`gatewaySteps`, `runGatewaySimulation` trong `PaymentPage.jsx`, `TODO(TV3)` ở dòng 68). Như vậy chỉ cần gọi thẳng API là "thanh toán thành công".

Cách đúng: trình duyệt chuyển hướng sang `payment-sandbox`. Kết quả thanh toán chỉ được ghi nhận khi server nhận IPN có chữ ký hợp lệ ([ADR-0003](adr/0003-mock-vnpay-gateway.md)). Giữ phần giao diện chọn phương thức và hóa đơn; bỏ phần giả lập.

### 5.5 Vị trí kỹ thuật viên

`TechnicianPage.jsx:217` vẫn gửi `POST /technician/location` mỗi 5 giây như bản cũ. Cách đúng: gửi qua Socket.IO, server kiểm tra KTV có đang được gán booking đó không (TV4, [ADR-0005](adr/0005-load-balancing-realtime.md)).

### 5.6 Giá trị và mã

| Bản cũ                                        | App mới                                                                                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain: "Cleaning"`                          | `CLEANING` (enum trong `packages/shared`)                                                                                                           |
| Trạng thái chữ tiếng Việt (`"Đã thanh toán"`) | Mã (`PAID`); giao diện đổi mã sang chữ tiếng Việt bằng một bảng nhãn dùng chung, đặt ở `frontend/src/lib/labels.ts` (tạo khi nối màn hình đầu tiên) |
| ID dạng `BK-24061`                            | ID là UUID; mã hiển thị cho người dùng là trường `code`                                                                                             |
| Dữ liệu mẫu viết cứng trong file              | Lấy từ API; dữ liệu mẫu nằm ở `backend/prisma/seed.ts`                                                                                              |

## 6. Màn hình kỹ thuật viên: web hay app Expo? (cần nhóm quyết định)

Bản web cũ đã được chuyển và chạy ở `/technician` (đăng nhập bằng `TECH-088`…).

|                       | Giữ bản web (`TechnicianPage.jsx`)      | Làm app Expo (`mobile/`, kế hoạch ban đầu) |
| --------------------- | --------------------------------------- | ------------------------------------------ |
| Công sức              | Ít: đã có sẵn                           | Nhiều: viết lại giao diện cho di động      |
| GPS                   | Chỉ chạy khi đang mở trang              | Chạy nền cả khi tắt màn hình               |
| Camera, thông báo đẩy | Chụp ảnh qua trình duyệt, không có push | Đầy đủ                                     |

Gợi ý: dùng bản web cho MVP, làm Expo ở phase sau nếu còn thời gian. Chốt xong thì cập nhật `docs/team.md`.

## 7. Checklist khi mở PR nối dữ liệu cho một màn hình

- [ ] Không tự đọc/ghi token; mọi lời gọi đi qua `apiFetch()` hoặc `api()` / `useQuery`
- [ ] Đã xử lý hết `TODO` trong màn hình: không gửi `amount`, `price`, `total`, `status`, `userId` hay tên KTV
- [ ] Giá tiền hiển thị lấy từ server
- [ ] Đã xử lý 3 trạng thái: đang tải, dữ liệu rỗng, lỗi API
- [ ] Đã đổi `ready: true` trong `frontend/src/config/modules.ts`
- [ ] Đã thử thủ công với tài khoản seed (mật khẩu `Homecare@123`)
