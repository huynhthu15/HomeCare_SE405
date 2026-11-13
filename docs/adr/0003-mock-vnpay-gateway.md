# ADR-0003: Cổng thanh toán mô phỏng kiểu VNPay

- Trạng thái: Đã chấp nhận (cài đặt: TV3, Phase 1)
- Ngày: 2026-11-13

## Bối cảnh

Đồ án cần thanh toán "giống thật" nhưng không xử lý tiền thật, và phải demo được các kịch bản khó: thất bại, người dùng hủy, IPN đến trễ hoặc đến nhiều lần, chữ ký sai.

## Quyết định

- Dựng `apps/payment-sandbox`: một service **tách biệt** (port 4100, secret riêng) mô phỏng giao thức VNPay 2.1:
  - API tạo URL thanh toán có `vnp_SecureHash` (HMAC-SHA512 trên query đã sắp xếp), `vnp_TxnRef` duy nhất, số tiền ×100 như VNPay.
  - Trang sandbox cho chọn: thành công / thất bại / hủy / "IPN gửi 2 lần" / "IPN trễ 30 s".
  - Sandbox gọi **IPN server-to-server** về API; chỉ IPN được đổi trạng thái payment. `returnUrl` chỉ để hiển thị.
- Trong API, interface `PaymentProvider` (`createPaymentUrl`, `verifyCallback`, `refund`) có hai implementation: `MockVnpayProvider` và `VnpayProvider` (sandbox thật), chọn bằng biến môi trường.
- IPN: verify chữ ký → ghi `payment_events` (kể cả khi sai) → khóa dòng payment (`FOR UPDATE`) → nếu đã ở trạng thái cuối thì trả `RspCode=02` (idempotent) → kiểm tra số tiền → cập nhật + outbox `payments.payment_succeeded` trong một transaction.
- Job BullMQ hủy payment `PENDING` quá 15 phút → booking `EXPIRED`.

## Hệ quả

- (+) Demo được mọi nhánh lỗi; khi có merchant VNPay chỉ cần đổi provider.
- (−) Phải tự viết sandbox (khoảng 1 ngày công).
