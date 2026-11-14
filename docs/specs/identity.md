# Spec: Identity — đăng nhập, phiên, phân quyền (spec mẫu)

- Module: identity · Người phụ trách: TV1 · Trạng thái: **Đã xong** (Phase 0)
- Liên quan: [ADR-0004](../adr/0004-auth-tokens.md)

## 1. Mục tiêu

Một cơ chế xác thực dùng chung cho web, app di động và mọi replica API; logout/khóa tài khoản có hiệu lực tức thì; phát hiện token bị đánh cắp.

## 2. Phạm vi

- Trong phạm vi: đăng ký khách hàng, đăng nhập (email hoặc mã KTV), refresh rotation, logout (một thiết bị / tất cả), `GET /auth/me`, admin liệt kê + khóa/mở khóa người dùng, RBAC.
- Ngoài phạm vi (sau): quên mật khẩu qua email (TV1 + TV4 notifications), xác minh email/SĐT bằng OTP, đăng nhập Google.

## 4. API

| Method | Path                           | Vai trò                       | Request                       | Response              | Lỗi                                                               |
| ------ | ------------------------------ | ----------------------------- | ----------------------------- | --------------------- | ----------------------------------------------------------------- |
| POST   | /api/v1/auth/register          | public                        | `registerSchema`              | `AuthResponse` 201    | `AUTH_EMAIL_TAKEN`, `VALIDATION_FAILED`                           |
| POST   | /api/v1/auth/login             | public                        | `loginSchema`                 | `AuthResponse`        | `AUTH_INVALID_CREDENTIALS`, `AUTH_ACCOUNT_LOCKED`, `RATE_LIMITED` |
| POST   | /api/v1/auth/refresh           | public (cookie / body mobile) | `refreshSchema`               | `AuthResponse`        | `AUTH_REFRESH_INVALID`, `AUTH_REFRESH_REUSED`                     |
| POST   | /api/v1/auth/logout            | mọi vai trò                   | –                             | 204                   |                                                                   |
| POST   | /api/v1/auth/logout-all        | mọi vai trò                   | –                             | 204                   |                                                                   |
| GET    | /api/v1/auth/me                | mọi vai trò                   | –                             | `AuthUser`            |                                                                   |
| GET    | /api/v1/admin/users            | ADMIN                         | `role,status,q,page,pageSize` | `Page<AdminUserView>` | `FORBIDDEN`                                                       |
| PATCH  | /api/v1/admin/users/:id/status | ADMIN                         | `{status, reason}`            | `AdminUserView`       | `NOT_FOUND`, `FORBIDDEN` (tự khóa mình)                           |

## 6. Quy tắc & chống bypass

- Tự đăng ký luôn là `CUSTOMER`; field lạ (vd `role`) bị từ chối.
- 5 lần sai / 15 phút / identifier → khóa tạm; rate limit theo IP ở Nginx và API.
- Khóa tài khoản → thu hồi mọi session ngay lập tức.

## 7. Event

- Phát: `identity.user_registered { userId, email, fullName }` (outbox, cùng transaction với tạo user).

## 8. Kiểm thử

- Unit: `password.service.spec.ts`, `token.service.spec.ts`, `roles.guard.spec.ts`, `env.schema.spec.ts`.
- E2E: `backend/test/auth.e2e-spec.ts` — 12 kịch bản gồm reuse detection, logout tức thì, khóa tài khoản, RBAC, mass assignment.
