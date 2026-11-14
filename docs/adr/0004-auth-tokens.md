# ADR-0004: JWT ngắn hạn + refresh token xoay vòng + thu hồi qua Redis

- Trạng thái: Đã chấp nhận, đã cài đặt (`backend/src/modules/identity`)
- Ngày: 2026-11-13

## Bối cảnh

API chạy nhiều replica sau load balancer nên không thể giữ session trong RAM. Đồng thời phải logout và khóa tài khoản **có hiệu lực ngay**, phát hiện refresh token bị đánh cắp, và hỗ trợ cả web lẫn mobile.

## Quyết định

- **Access token:** JWT HS256, 15 phút, claims `{ sub, role, sid }`, có kiểm tra issuer/audience. Mọi replica tự verify được, không cần DB.
- **Refresh token:** chuỗi ngẫu nhiên 48 byte, DB chỉ lưu SHA-256. Mỗi lần dùng thì **xoay vòng**. Nếu token đã dùng bị đưa ra lần nữa, toàn bộ session bị thu hồi (OAuth 2.0 Security BCP). Việc "giành" token là một `UPDATE ... WHERE used_at IS NULL` nguyên tử, nên hai request đồng thời không thể cùng thắng.
- **Thu hồi tức thì:** khi logout, khóa tài khoản hoặc phát hiện tái sử dụng, ghi `auth:revoked-sid:{sid}` vào Redis với TTL bằng thời hạn access token. Guard kiểm tra key này; nếu Redis không phản hồi thì **từ chối request (fail closed)**.
- **Web:** refresh token đặt trong cookie `httpOnly; SameSite=Strict; Path=/api/v1/auth`. Access token chỉ giữ trong RAM. Refresh giữa các tab được xếp hàng bằng Web Locks API để không tự kích hoạt cơ chế phát hiện tái sử dụng.
- **Mobile:** header `x-client-type: mobile` thì refresh token trả trong body, app lưu bằng `expo-secure-store`.
- **Mật khẩu:** argon2id (m=19 MiB, t=2, p=1). Với tài khoản không tồn tại vẫn verify một hash giả để thời gian phản hồi giống nhau.
- **Chống dò mật khẩu:** rate limit (Redis, dùng chung giữa các replica) và khóa identifier 15 phút sau 5 lần sai.

## Hệ quả

- (+) Stateless, scale ngang, thu hồi tức thì, phát hiện đánh cắp token. Đã có e2e test cho từng hành vi.
- (−) Mọi request phụ thuộc Redis. Có thể giảm bằng cache cục bộ vài giây hoặc Redis Sentinel.
- (−) Khóa theo identifier có thể bị lợi dụng để khóa người khác trong 15 phút (DoS nhẹ). Chấp nhận ở mức MVP.
