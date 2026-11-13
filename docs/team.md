# Phân công & lộ trình — nhóm 4 người

> Mỗi người sở hữu **một domain end-to-end**: schema Prisma, module API, màn hình web/mobile, test và tài liệu của domain đó.
> Shared kernel (`apps/api/src/common`, `packages/shared`, `infra`, `.github`) thuộc **cả nhóm**: mọi PR chạm vào đây cần ≥ 2 người review.

| Thành viên | Domain                                                                           | Thư mục chính                                                                                                    | Màn hình                                       |
| ---------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **TV1**    | Identity _(đã có mẫu)_, Profile, Địa chỉ, Thiết bị & Nhắc bảo trì, Admin console | `modules/identity`, `modules/profile`, `schema/identity.prisma`, `schema/profile.prisma`                         | Dashboard, Hồ sơ, Thiết bị, Admin › Người dùng |
| **TV2**    | Catalog, Booking (state machine), Dispatch (điều phối)                           | `modules/catalog`, `modules/booking`, `modules/dispatch`, `schema/catalog.prisma`, `schema/booking.prisma`       | Vệ sinh, Sửa chữa, Đặt lịch, Admin › Điều phối |
| **TV3**    | Payments, payment-sandbox (mock VNPay), hoàn tiền, biên nhận                     | `modules/payments`, `apps/payment-sandbox`, `schema/payments.prisma`                                             | Thanh toán, Admin › Đối soát                   |
| **TV4**    | App KTV (Expo), Tracking realtime (Socket.IO), Notifications, simulator          | `apps/technician`, `modules/technician`, `modules/tracking`, `modules/notifications`, `schema/technician.prisma` | Theo dõi, app di động, Admin › Bản đồ realtime |

Điền GitHub username vào `.github/CODEOWNERS` để PR tự yêu cầu review đúng người.

## Lộ trình

### Phase 0 — Nền móng ✅ (đã xong trên nhánh `feat/mvp-foundation`)

Monorepo pnpm, NestJS + Prisma + Postgres + Redis, shared kernel (config, log, lỗi chuẩn, health, metrics, audit, outbox), **module identity hoàn chỉnh làm mẫu**, web TS (đăng nhập, layout, admin người dùng), Docker + Nginx LB + Prometheus/Grafana, CI/CD, tài liệu kiến trúc, bộ skill/agent cho Claude Code.

### Phase 1 — Luồng đặt dịch vụ cơ bản

| TV  | Việc                                                                                                                                   | Xong khi                                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| TV1 | `profile`: CRUD địa chỉ (có lat/lng), thiết bị, nhắc bảo trì; `GET /me/dashboard`                                                      | Port xong Dashboard/Thiết bị/Hồ sơ từ `legacy/`; e2e có test IDOR            |
| TV2 | `catalog` (dịch vụ, add-on, voucher, **báo giá phía server**), `booking` (tạo, hủy, state machine + history + outbox, Idempotency-Key) | Đặt được booking từ web, không thể sửa giá; unit test bảng chuyển trạng thái |
| TV3 | `payment-sandbox` + `payments` (tạo URL ký HMAC, IPN idempotent, hết hạn 15')                                                          | Demo: thành công / thất bại / hủy / IPN lặp 2 lần                            |
| TV4 | Khung app Expo: đăng nhập bằng mã KTV (refresh token trong SecureStore), danh sách job                                                 | Đăng nhập được trên điện thoại thật                                          |

### Phase 2 — Realtime & điều phối

| TV  | Việc                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------- |
| TV1 | Admin: khóa/mở khóa (đã có), quản lý KTV, xem audit log                                                                    |
| TV2 | `dispatch`: chọn KTV theo kỹ năng/khu vực/lịch trống, offer có timeout (BullMQ), **exclusion constraint** chống trùng lịch |
| TV3 | Hoàn tiền khi hủy (chính sách theo thời điểm hủy), biên nhận PDF/email                                                     |
| TV4 | `tracking` gateway (Socket.IO + Redis adapter), GPS nền trên app, ETA, notifications in-app + email (Mailpit)              |

### Phase 3 — Hoàn thiện & bảo vệ

- Ảnh trước/sau qua MinIO presigned URL; KTV hoàn tất job.
- `sim:technician` chạy KTV ảo theo lộ trình để demo không cần ra đường.
- Playwright e2e cho luồng chính; k6 load test và **ảnh Grafana khi scale 1 → 3 → 5 replica** để đưa vào báo cáo.
- Deploy VPS qua CD; viết báo cáo (export sơ đồ Mermaid trong `system-design.md`).

## Quy trình làm việc

1. **Nhánh:** `feat/<module>-<mô-tả>`, `fix/...`, `chore/...`. Không push thẳng `main`.
2. **Trước khi code:** viết spec ngắn trong `docs/specs/<tính-năng>.md` theo `_template.md` (dùng skill `homecare-feature-workflow`).
3. **Commit:** Conventional Commits (`feat(booking): ...`). Lệnh `/commit` của plugin commit-commands giúp viết message.
4. **PR:** điền template; CI phải xanh; ≥ 1 review của thành viên khác (≥ 2 nếu chạm shared kernel); chạy agent `homecare-reviewer` trước khi xin review.
5. **Họp ngắn 2 lần/tuần:** mỗi người báo đã xong / sắp làm / đang vướng; cập nhật bảng lộ trình ở trên.
