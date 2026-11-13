<!-- Nhánh đích: PR tính năng/sửa lỗi vào `dev`. Chỉ release PR `dev → main` hoặc `hotfix/*` được vào `main` (ADR-0007). -->

## Mục tiêu

<!-- Thay đổi này giải quyết vấn đề gì? Link spec/issue: docs/specs/... -->

## Module bị ảnh hưởng

- [ ] identity / profile (TV1)
- [ ] catalog / booking / dispatch (TV2)
- [ ] payments (TV3)
- [ ] technician / tracking / notifications (TV4)
- [ ] shared kernel (`apps/api/src/common`, `packages/shared`, `infra/`) — cần cả nhóm review

## Checklist (Definition of Done)

- [ ] Có test: unit cho logic, e2e cho endpoint mới (kể cả trường hợp **bị từ chối**: 401/403/IDOR)
- [ ] Client chỉ gửi ID — giá tiền, trạng thái, quyền sở hữu do server quyết định
- [ ] Input validate bằng zod schema (trong `packages/shared` nếu client cũng dùng)
- [ ] Thay đổi trạng thái đi qua state machine + ghi audit log; event qua outbox (cùng transaction)
- [ ] Migration Prisma tương thích ngược (expand → migrate → contract), không sửa migration cũ
- [ ] Không import ruột module khác (chỉ qua `index.ts`) — `pnpm lint` pass
- [ ] Đã chạy `/review` (homecare-reviewer) hoặc `pr-review-toolkit` và xử lý góp ý
- [ ] Cập nhật docs (ADR nếu là quyết định kiến trúc)

## Cách kiểm thử

<!-- Lệnh đã chạy, ảnh chụp màn hình, request mẫu -->
