# ADR-0002: PostgreSQL + Prisma 7, schema chia file theo module

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-13

## Bối cảnh

Cần CSDL quan hệ có transaction, ràng buộc mạnh (unique, exclusion constraint), JSON và kiểu mảng. ORM phải dễ học cho cả nhóm, có migration và type-safety với TypeScript.

## Quyết định

- **PostgreSQL 16.** Dùng exclusion constraint GiST chống trùng lịch KTV, `FOR UPDATE SKIP LOCKED` cho outbox, `timestamptz`, JSONB.
- **Prisma 7.10** (bản stable; 8.x đang RC), generator `prisma-client` sinh code TS vào `src/generated/prisma`, driver adapter `@prisma/adapter-pg`, cấu hình trong `prisma.config.ts`.
- Schema **nhiều file** trong `prisma/schema/`, mỗi module một file, có ghi người phụ trách.
- Ràng buộc Prisma chưa hỗ trợ (exclusion constraint, partial index) viết bằng SQL trong migration (`prisma migrate dev --create-only` rồi sửa SQL).

## Hệ quả

- (+) Type-safe end-to-end, migration có version, Prisma Studio để xem dữ liệu.
- (−) Quan hệ FK giữa module khiến model "biết" nhau; quy tắc bổ sung: không `include` quan hệ của module khác trong truy vấn.
- (−) Mỗi replica có pool riêng: tổng kết nối = replica × `max` (10). Khi vượt `max_connections` thì thêm PgBouncer.
