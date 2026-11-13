# ADR-0001: Modular monolith với NestJS

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-13

## Bối cảnh

Nhóm 4 người, một học kỳ, cần một MVP chạy thật với realtime, thanh toán và tracking, đồng thời thể hiện được tư duy thiết kế hệ thống (scale ngang, load balancing, CI/CD). Bản prototype cũ là một server Node thuần ghi file JSON.

## Quyết định

- Một ứng dụng **NestJS 11** chia thành các module theo bounded context (`identity`, `profile`, `catalog`, `booking`, `dispatch`, `payments`, `technician`, `tracking`, `notifications`), triển khai thành **một image** chạy hai vai trò `api` và `worker`.
- Ranh giới module được **ép bằng công cụ** (ESLint `no-restricted-imports`), không chỉ bằng quy ước.
- Giao tiếp bất đồng bộ giữa module qua **transactional outbox**.
- Chọn NestJS 11 thay vì 12: Nest 12 chỉ hỗ trợ ESM và hệ sinh thái (`nestjs-zod`, nhiều ví dụ/tài liệu) chưa theo kịp. Sẽ nâng cấp khi `nestjs-zod` hỗ trợ.

## Hệ quả

- (+) Một repo, một pipeline, transaction ACID giữa các module; dễ debug và demo.
- (+) Scale ngang bằng nhiều replica sau Nginx.
- (−) Không scale riêng từng module; một module lỗi nặng có thể ảnh hưởng process. Giảm thiểu: tách worker, health check, giới hạn tài nguyên.
- Đường tách microservice: system-design.md §11.
