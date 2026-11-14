# Phân công & lộ trình — nhóm 4 người

> Mỗi người sở hữu **một domain end-to-end**: schema Prisma, module API, màn hình web/mobile, test và tài liệu của domain đó.
> Shared kernel (`backend/src/common`, `packages/shared`, `infra`, `.github`) thuộc **cả nhóm**: mọi PR chạm vào đây cần ≥ 2 người review.

| Thành viên | Domain                                                                           | Thư mục chính                                                                                              | Màn hình                                       |
| ---------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **TV1**    | Identity _(đã có mẫu)_, Profile, Địa chỉ, Thiết bị & Nhắc bảo trì, Admin console | `modules/identity`, `modules/profile`, `schema/identity.prisma`, `schema/profile.prisma`                   | Dashboard, Hồ sơ, Thiết bị, Admin › Người dùng |
| **TV2**    | Catalog, Booking (state machine), Dispatch (điều phối)                           | `modules/catalog`, `modules/booking`, `modules/dispatch`, `schema/catalog.prisma`, `schema/booking.prisma` | Vệ sinh, Sửa chữa, Đặt lịch, Admin › Điều phối |
| **TV3**    | Payments, payment-sandbox (mock VNPay), hoàn tiền, biên nhận                     | `modules/payments`, `payment-sandbox`, `schema/payments.prisma`                                            | Thanh toán, Admin › Đối soát                   |
| **TV4**    | App KTV (Expo), Tracking realtime (Socket.IO), Notifications, simulator          | `mobile`, `modules/technician`, `modules/tracking`, `modules/notifications`, `schema/technician.prisma`    | Theo dõi, app di động, Admin › Bản đồ realtime |

Điền GitHub username vào `.github/CODEOWNERS` để PR tự yêu cầu review đúng người.

## Lộ trình

### Phase 0 — Nền móng ✅ (đã xong trên nhánh `feat/mvp-foundation`)

Monorepo pnpm, NestJS + Prisma + Postgres + Redis, shared kernel (config, log, lỗi chuẩn, health, metrics, audit, outbox), **module identity hoàn chỉnh làm mẫu**, web TS (đăng nhập, layout, admin người dùng), Docker + Nginx LB + Prometheus/Grafana, CI/CD, tài liệu kiến trúc, bộ skill/agent cho Claude Code.

### Phase 1 — Luồng đặt dịch vụ cơ bản

> **Giao diện: dùng lại bản cũ, không viết lại.** Toàn bộ màn hình cũ đã được chuyển vào `frontend/src/features` (bước 1 ✅). Việc của mỗi người là làm API để màn hình của mình có dữ liệu và xử lý các `TODO` trong màn hình đó (bước 2). Bảng màn hình ↔ API ↔ người phụ trách và các chỗ bắt buộc sửa (token, giá tiền, thanh toán): [docs/frontend-migration.md](frontend-migration.md).

| TV  | Việc                                                                                                                                       | Xong khi                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| TV1 | `profile`: CRUD địa chỉ (có lat/lng), thiết bị, nhắc bảo trì; `GET /me/dashboard`                                                          | Port xong Dashboard/Thiết bị/Hồ sơ từ `legacy/`; e2e có test IDOR            |
| TV2 | `catalog` (dịch vụ, add-on, voucher, **báo giá phía server**), `booking` (tạo, hủy, state machine + history + outbox, Idempotency-Key)     | Đặt được booking từ web, không thể sửa giá; unit test bảng chuyển trạng thái |
| TV3 | `payment-sandbox` + `payments` (tạo URL ký HMAC, IPN idempotent, hết hạn 15')                                                              | Demo: thành công / thất bại / hủy / IPN lặp 2 lần                            |
| TV4 | Màn hình KTV: **chốt web (dùng lại `TechnicianApp.jsx`) hay Expo** (xem frontend-migration.md mục 6); đăng nhập bằng mã KTV, danh sách job | Đăng nhập được và xem job trên điện thoại thật                               |

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

```
feat/* fix/* chore/*  ──PR──▶  dev (staging)  ──release PR──▶  main (production)  ──tag vX.Y.Z
hotfix/* (tách từ main) ──PR──▶  main, rồi merge main ngược về dev
```

1. **Nhánh:** tách từ `dev`, đặt tên `feat/<module>-<mô-tả>`, `fix/...`, `chore/...`. Không push thẳng vào `dev` hay `main`. Chi tiết: [ADR-0007](adr/0007-branching-strategy.md).
   ```bash
   git switch dev && git pull
   git switch -c feat/booking-create
   ```
2. **Trước khi code:** viết spec ngắn trong `docs/specs/<tính-năng>.md` theo `_template.md` (dùng skill `homecare-feature-workflow`).
3. **Commit:** Conventional Commits (`feat(booking): ...`). Lệnh `/commit` của plugin commit-commands giúp viết message.
4. **PR vào `dev`:** điền template; CI phải xanh; ≥ 1 review của thành viên khác (≥ 2 nếu chạm shared kernel); chạy agent `homecare-reviewer` trước khi xin review. Merge xong thì xóa nhánh tính năng.
5. **Thử trên staging:** sau khi merge, CI build image và CD tự deploy `dev` lên staging. Cả nhóm thử luồng chéo module ở đây.
6. **Phát hành (cuối mỗi phase / trước demo):** một người mở PR `dev → main` ghi tóm tắt thay đổi. Merge xong gắn tag trên `main`:
   ```bash
   git switch main && git pull
   git tag -a v0.1.0 -m "Phase 0: nền móng"
   git push origin v0.1.0
   ```
   CI chặn mọi PR vào `main` không xuất phát từ `dev` hoặc `hotfix/*`.
7. **Hotfix:** tách `hotfix/<mô-tả>` từ `main`, PR vào `main`, rồi mở PR `main → dev` để bản sửa không bị mất ở lần phát hành sau.
8. **Họp ngắn 2 lần/tuần:** mỗi người báo đã xong / sắp làm / đang vướng; cập nhật bảng lộ trình ở trên.

### Cấu hình GitHub (chủ repo làm một lần)

Settings → Rules → Rulesets, tạo ruleset cho `main` và `dev`:

- Restrict deletions, Block force pushes.
- Require a pull request before merging, 1 approval (bỏ qua approval cũ khi có commit mới).
- Require status checks to pass: `Lint · Typecheck · Test · Build`, `analyze` (CodeQL); thêm `Branch policy` cho `main`.

Settings → Environments: tạo `staging` và `production`; `production` bật **Required reviewers**. Mỗi environment có bộ secret riêng (xem đầu file `.github/workflows/cd.yml`). Bật deploy bằng biến repo `STAGING_DEPLOY_ENABLED=true` / `DEPLOY_ENABLED=true`.
