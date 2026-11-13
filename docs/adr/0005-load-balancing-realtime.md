# ADR-0005: Nginx load balancer, WebSocket không cần sticky session

- Trạng thái: Đã chấp nhận. Nginx và compose stack đã có; Socket.IO gateway do TV4 làm ở Phase 2.
- Ngày: 2026-11-13

## Bối cảnh

Cần chứng minh hệ thống scale ngang được. Realtime dùng WebSocket là kết nối dài. Mặc định Socket.IO bắt đầu bằng HTTP long-polling, và chế độ đó cần sticky session.

## Quyết định

- **Nginx 1.28** làm edge:
  - `least_conn`.
  - `server api:4000 resolve`: phân giải lại DNS mỗi 10 giây, nên scale replica không cần reload Nginx.
  - Passive health check (`max_fails`).
  - Chỉ retry khi lỗi kết nối hoặc 502/503.
  - Rate limit theo IP.
  - Chặn `/metrics` và `/health/*` từ bên ngoài.
  - Kiêm luôn việc phục vụ SPA tĩnh.
- **Socket.IO:** client bắt buộc `transports: ['websocket']`, nên **không cần sticky session**. Sự kiện được phát chéo giữa các replica bằng `@socket.io/redis-adapter`.
- Mỗi response có header `x-served-by` và log Nginx có trường `upstream`, để demo việc cân bằng tải.

## Phương án đã loại

- **Sticky session theo `ip_hash`:** phân bố tải lệch khi nhiều người dùng chung NAT, và mất kết nối khi replica chết.
- **HAProxy/Traefik:** tốt nhưng Nginx quen thuộc hơn với nhóm, lại phục vụ static được luôn.

## Hệ quả

- (+) Scale tự do: `docker compose ... up --scale api=5`.
- (−) Client cũ không hỗ trợ WebSocket sẽ không fallback được (chấp nhận: mọi trình duyệt và app hiện đại đều hỗ trợ).
