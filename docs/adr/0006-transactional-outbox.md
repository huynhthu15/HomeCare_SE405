# ADR-0006: Transactional outbox cho domain event

- Trạng thái: Đã chấp nhận. Relay đã cài đặt (`backend/src/common/outbox`).
- Ngày: 2026-11-13

## Bối cảnh

Khi payment thành công, booking phải chuyển `PAID`, gửi thông báo và bắt đầu điều phối. Nếu ghi DB xong rồi mới phát event (hoặc ngược lại), một trong hai có thể thất bại (lỗi dual write), dẫn đến khách đã trả tiền nhưng booking vẫn treo.

## Quyết định

- Event được ghi vào bảng `outbox_events` **trong cùng transaction** với thay đổi trạng thái (`OutboxService.enqueue(tx, …)`).
- Worker chạy `OutboxRelay`: cứ 1 giây khóa một lô bằng `FOR UPDATE SKIP LOCKED`, phát event qua `EventEmitter2`, rồi đánh dấu `published_at`. Lỗi thì tăng `attempts`; quá 10 lần thì để lại cho người kiểm tra (dead letter).
- Giao **at-least-once**, nên handler (`@OnEvent`) phải idempotent (kiểm tra trạng thái trước khi làm).
- Tên event theo dạng `<module>.<sự_kiện_quá_khứ>`, ví dụ `identity.user_registered` hay `payments.payment_succeeded`.

## Hệ quả

- (+) Không mất event, không cần thêm message broker; nhiều worker chạy song song vẫn an toàn.
- (−) Độ trễ khoảng 1 giây (khoảng poll); bảng outbox cần dọn định kỳ (job xóa event đã publish quá 7 ngày).
- Khi tách microservice: relay publish lên Kafka/RabbitMQ thay vì EventEmitter.
