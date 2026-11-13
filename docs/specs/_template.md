# Spec: <Tên tính năng>

- Module: <booking | payments | ...> · Người phụ trách: <TVx> · Trạng thái: Nháp / Đã duyệt / Đã xong
- Liên quan: <ADR, issue, PR>

## 1. Mục tiêu

<!-- Vì sao cần, ai dùng, thành công trông như thế nào (đo được). -->

## 2. Phạm vi

- Trong phạm vi:
- Ngoài phạm vi:

## 3. Luồng người dùng

<!-- Các bước; sơ đồ sequence Mermaid nếu có nhiều bên tham gia. -->

## 4. API (hợp đồng)

| Method | Path | Vai trò | Request (zod schema) | Response | Lỗi (`code`) |
| ------ | ---- | ------- | -------------------- | -------- | ------------ |

## 5. Dữ liệu

<!-- Model/field mới trong prisma/schema/<module>.prisma, index, ràng buộc; migration có tương thích ngược không? -->

## 6. Quy tắc nghiệp vụ & chống bypass

<!-- Ai được làm gì; trạng thái nào được chuyển; client có thể gian lận ở đâu và server chặn thế nào. -->

## 7. Event

<!-- Event phát ra qua outbox (tên, payload) và event tiêu thụ (handler có idempotent không?). -->

## 8. Kiểm thử

- Unit:
- E2E (gồm cả trường hợp bị từ chối 401/403/409):

## 9. Câu hỏi mở
