# HomeCare Super App MFE

HomeCare Super App MFE là hệ thống quản lý dịch vụ chăm sóc nhà ở theo kiến trúc micro frontend. Dự án gồm một cổng đăng nhập chung, dashboard khách hàng, workspace kỹ thuật viên, các phân hệ nghiệp vụ độc lập và backend Node.js lưu dữ liệu theo từng người dùng.

## Tổng Quan

Hệ thống hỗ trợ hai nhóm người dùng chính:

- Khách hàng: quản lý thiết bị trong nhà, đặt lịch vệ sinh/sửa chữa/bảo trì, theo dõi kỹ thuật viên, thanh toán hóa đơn và cập nhật hồ sơ.
- Kỹ thuật viên: xem lịch làm việc, nhận việc, cập nhật trạng thái, gửi vị trí và báo cáo xử lý.

Luồng truy cập chính bắt đầu tại `RootShell`. Sau khi đăng nhập, hệ thống tự nhận diện tài khoản khách hàng hoặc mã kỹ thuật viên và điều hướng đến giao diện phù hợp.

## Công Nghệ

- React 18
- Vite
- Vite Module Federation
- Tailwind CSS
- Lucide React
- Node.js HTTP server
- JSON file database tại `backend/data/db.json`

## Kiến Trúc Thư Mục

```text
homecare-superapp-MFE/
├─ RootShell/          # Cổng đăng nhập chung cho khách hàng và kỹ thuật viên
├─ Shell/              # Dashboard khách hàng, layout, sidebar, header, notification
├─ backend/            # API server và dữ liệu JSON
├─ mfe-auth/           # Auth MFE dùng trong Shell khách hàng
├─ mfe-cleaning/       # Gói vệ sinh và lịch vệ sinh
├─ mfe-repair/         # Dịch vụ sửa chữa và ticket đang xử lý
├─ mfe-appliance/      # Quản lý thiết bị, nhắc việc, đặt lịch bảo trì
├─ mfe-booking/        # Đặt lịch dịch vụ, chọn thời gian và kỹ thuật viên
├─ mfe-payment/        # Hóa đơn, thanh toán, biên nhận, lịch sử giao dịch
├─ mfe-tracking/       # Theo dõi kỹ thuật viên và tiến độ xử lý
├─ mfe-profile/        # Hồ sơ người dùng
└─ mfe-technician/     # Workspace kỹ thuật viên
```

## Port Mặc Định

| Thành phần | Port | Vai trò |
| --- | ---: | --- |
| Backend | `4000` | API và dữ liệu |
| Shell | `3000` | Dashboard khách hàng, được RootShell load remote |
| Auth | `3001` | Remote auth cho Shell |
| Booking | `3002` | Remote đặt lịch |
| Profile | `3004` | Remote hồ sơ |
| Cleaning | `3005` | Remote vệ sinh |
| Repair | `3006` | Remote sửa chữa |
| Appliance | `3007` | Remote thiết bị |
| Payment | `3008` | Remote thanh toán |
| Tracking | `3009` | Remote theo dõi |
| Technician | `3010` | Remote kỹ thuật viên |
| RootShell | `3020` | Cổng vào chung của hệ thống |

## Cài Đặt

Cài dependency cho từng app:

```bash
cd backend
npm install
```

```bash
cd ../RootShell
npm install
```

```bash
cd ../Shell
npm install
```

```bash
cd ../mfe-auth
npm install
```

```bash
cd ../mfe-cleaning
npm install
```

```bash
cd ../mfe-repair
npm install
```

```bash
cd ../mfe-appliance
npm install
```

```bash
cd ../mfe-booking
npm install
```

```bash
cd ../mfe-payment
npm install
```

```bash
cd ../mfe-tracking
npm install
```

```bash
cd ../mfe-profile
npm install
```

```bash
cd ../mfe-technician
npm install
```

## Chạy Dự Án

Mở nhiều terminal riêng.

1. Chạy backend:

```bash
cd backend
npm run dev
```

2. Chạy các remote MFE của khách hàng:

```bash
cd mfe-auth
npm run dev
```

```bash
cd mfe-cleaning
npm run dev
```

```bash
cd mfe-repair
npm run dev
```

```bash
cd mfe-appliance
npm run dev
```

```bash
cd mfe-booking
npm run dev
```

```bash
cd mfe-payment
npm run dev
```

```bash
cd mfe-tracking
npm run dev
```

```bash
cd mfe-profile
npm run dev
```

3. Chạy dashboard khách hàng và workspace kỹ thuật viên:

```bash
cd Shell
npm run dev
```

```bash
cd mfe-technician
npm run dev
```

4. Chạy cổng vào chung:

```bash
cd RootShell
npm run dev
```

Mở ứng dụng tại:

```text
http://127.0.0.1:3020
```

Có thể mở trực tiếp dashboard khách hàng tại `http://127.0.0.1:3000`, nhưng luồng đầy đủ nên đi qua `RootShell`.

## Tài Khoản Mẫu

| Vai trò | Tài khoản | Mật khẩu |
| --- | --- | --- |
| Khách hàng | `khang.nguyen@example.com` | `123456` |
| Khách hàng | `linh.tran@example.com` | `123456` |
| Admin mẫu | `admin@homecare.test` | `123456` |
| Kỹ thuật viên | `TECH-088` | `123456` |

Dữ liệu nghiệp vụ được tách theo `userId`, nên mỗi khách hàng sẽ thấy thiết bị, booking, thanh toán, nhắc việc và hồ sơ riêng.

## Luồng Chính

1. Người dùng truy cập `RootShell`.
2. Đăng nhập bằng email khách hàng hoặc mã kỹ thuật viên.
3. Nếu là khách hàng, hệ thống load `Shell` và các MFE nghiệp vụ:
   - `Cleaning`: chọn gói vệ sinh, lọc dịch vụ, theo dõi lịch vệ sinh.
   - `Repair`: chọn dịch vụ sửa chữa, theo dõi ticket đang xử lý.
   - `Appliance`: quản lý danh mục thiết bị, cập nhật từng thiết bị, tạo nhắc việc, chuyển sang Booking để đặt lịch bảo trì.
   - `Booking`: chọn dịch vụ, thời gian, kỹ thuật viên, kiểm tra trùng lịch và tạo booking.
   - `Payment`: quản lý hóa đơn cần thanh toán, phương thức thanh toán, biên nhận và lịch sử giao dịch.
   - `Tracking`: theo dõi tiến độ và trạng thái kỹ thuật viên.
   - `Profile`: cập nhật hồ sơ người dùng.
4. Nếu là kỹ thuật viên, hệ thống load workspace kỹ thuật viên để nhận việc, cập nhật trạng thái và gửi báo cáo.
5. Header của Shell gom thông báo từ nhắc việc sắp đến hạn, booking đang xử lý, hóa đơn cần thanh toán và cảnh báo thiết bị.

## Backend

Backend nằm trong `backend/`, dùng Node.js HTTP server thuần và lưu dữ liệu tại:

```text
backend/data/db.json
```

Nếu file dữ liệu chưa tồn tại, backend tạo dữ liệu ban đầu từ `backend/src/store.js`.

Các nhóm API chính:

- Auth khách hàng: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`
- Auth kỹ thuật viên: `POST /technician/login`, `GET /technician/me`
- Workspace kỹ thuật viên: `GET /technician/dashboard`, `GET /technician/jobs`, `PUT /technician/jobs/:id/status`, `POST /technician/location`, `POST /technician/jobs/:id/report`
- Dashboard: `GET /dashboard`
- Dịch vụ và kỹ thuật viên: `GET /services`, `GET /technician-availability`
- Thiết bị: `GET /devices`, `POST /devices`, `PUT /devices/:id`
- Nhắc việc: `GET /reminders`, `POST /reminders`, `PUT /reminders/:id`
- Booking: `GET /bookings`, `POST /bookings`
- Thanh toán: `GET /payments`, `POST /payments`, `GET /payment-methods`, `PUT /payment-methods/:id`
- Hồ sơ: `GET /profile`, `PUT /profile`

Các frontend dùng biến môi trường:

```text
VITE_API_URL=http://localhost:4000
```

Nếu không khai báo, mặc định là `http://localhost:4000`.

## Build Và Kiểm Tra

Kiểm tra backend:

```bash
cd backend
node --check src/server.js
```

Build từng frontend:

```bash
cd RootShell
npm run build
```

```bash
cd Shell
npm run build
```

```bash
cd mfe-booking
npm run build
```

Làm tương tự với các MFE còn lại.

## Ghi Chú Phát Triển

- `RootShell` là điểm vào khuyến nghị của toàn hệ thống.
- `Shell` vẫn là dashboard khách hàng và expose remote để `RootShell` load.
- Mỗi MFE expose `Routes` hoặc app chính qua `remoteEntry.js`.
- Dữ liệu nghiệp vụ không lưu cố định ở frontend; các thao tác chính ghi về backend JSON.
- Sidebar khách hàng mặc định thu gọn và chỉ giữ các phân hệ đang dùng.
- Khi thêm remote mới, cần cập nhật `vite.config.js` của Shell hoặc RootShell tương ứng và đảm bảo port không trùng.
