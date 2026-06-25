import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  CreditCard,
  Banknote,
  FileText,
  LockKeyhole,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import "./index.css";

const fallbackInvoices = [
  {
    id: "BK-9042",
    service: "Vệ sinh máy lạnh",
    provider: "HomeCare Cleaning",
    due: "Hôm nay, 15:30",
    amount: 397000,
    status: "Chờ thanh toán",
  },
  {
    id: "RP-1186",
    service: "Sửa ổ cắm phòng khách",
    provider: "HomeCare Repair",
    due: "Ngày mai, 09:00",
    amount: 248000,
    status: "Đặt cọc",
  },
  {
    id: "AP-5017",
    service: "Bảo trì tủ lạnh",
    provider: "HomeCare Appliance",
    due: "Thứ 6, 14:00",
    amount: 455000,
    status: "Chờ thanh toán",
  },
];

const gateways = [
  {
    id: "vnpay",
    name: "VNPay",
    detail: "QR Pay, thẻ ATM nội địa và tài khoản ngân hàng",
    settlement: "Tiền về sau 1 ngày làm việc",
    successRate: "99.2%",
    fee: 0,
    referencePrefix: "VNPAY",
    icon: QrCode,
    authTitle: "Xác thực thanh toán VNPay",
    authHint: "Nhập mã OTP gồm 6 chữ số được gửi từ VNPay Sandbox.",
  },
  {
    id: "momo",
    name: "MoMo",
    detail: "Ví điện tử, số điện thoại và xác thực OTP",
    settlement: "Xác nhận gần như tức thì",
    successRate: "98.8%",
    fee: 2500,
    referencePrefix: "MOMO",
    icon: Smartphone,
    authTitle: "Xác thực ví MoMo",
    authHint: "Xác nhận giao dịch bằng mã OTP trong ứng dụng MoMo Sandbox.",
  },
  {
    id: "napas",
    name: "NAPAS",
    detail: "Cổng thẻ nội địa và xác thực 3D Secure",
    settlement: "Xác nhận trong ngày",
    successRate: "99.0%",
    fee: 1500,
    referencePrefix: "NAPAS",
    icon: CreditCard,
    authTitle: "Xác thực thẻ NAPAS",
    authHint: "Nhập mã 3D Secure được gửi tới chủ thẻ.",
  },
  {
    id: "cash",
    name: "Tiền mặt",
    detail: "Thanh toán trực tiếp cho kỹ thuật viên sau khi hoàn tất dịch vụ",
    settlement: "Kỹ thuật viên xác nhận",
    successRate: "Tại nhà",
    fee: 0,
    referencePrefix: "CASH",
    icon: Banknote,
    authTitle: "Xác nhận thanh toán tiền mặt",
    authHint: "Xác nhận khách hàng sẽ thanh toán tiền mặt cho kỹ thuật viên.",
    cash: true,
  },
];

const gatewaySteps = [
  "Tạo phiên thanh toán",
  "Gửi yêu cầu sang cổng",
  "Xác thực giao dịch",
  "Nhận kết quả thành công",
];

const transactions = [
  {
    id: "TXN-78291",
    service: "Đặt lịch vệ sinh bếp",
    time: "18/06/2026, 10:42",
    amount: 312000,
    status: "Thành công",
  },
  {
    id: "TXN-78144",
    service: "Kiểm tra máy giặt",
    time: "15/06/2026, 16:10",
    amount: 180000,
    status: "Hoàn tiền một phần",
  },
  {
    id: "TXN-77903",
    service: "Thay lõi lọc nước",
    time: "12/06/2026, 08:55",
    amount: 265000,
    status: "Thành công",
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const isPaidInvoice = (invoice) =>
  ["Đã thanh toán", "Thành công", "Da thanh toan", "paid"].includes(invoice.status);

const createGatewayRef = (gateway) =>
  `${gateway.referencePrefix}-${Date.now().toString().slice(-8)}`;

export default function PaymentApp() {
  const [invoices, setInvoices] = useState(fallbackInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState(fallbackInvoices[0]);
  const [paymentHistory, setPaymentHistory] = useState(transactions);
  const [selectedGatewayId, setSelectedGatewayId] = useState(gateways[0].id);
  const [useVoucher, setUseVoucher] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState("Chưa khởi tạo");
  const [gatewayRef, setGatewayRef] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedGateway =
    gateways.find((gateway) => gateway.id === selectedGatewayId) || gateways[0];
  const SelectedGatewayIcon = selectedGateway.icon;
  const pendingInvoices = invoices.filter((invoice) => !isPaidInvoice(invoice));

  useEffect(() => {
    fetch(`${API_BASE_URL}/bookings`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        const openInvoices = items
          .slice(-6)
          .reverse()
          .map((booking) => ({
            id: booking.id,
            service: booking.service,
            provider: `HomeCare ${booking.domain}`,
            due: booking.time,
            amount: booking.amount,
            status: booking.status,
            technician: booking.technician,
            address: booking.address,
          }));

        const pendingBookingId = new URLSearchParams(window.location.search).get("bookingId");
        const pendingInvoice = openInvoices.find((invoice) => invoice.id === pendingBookingId);
        setInvoices(openInvoices);
        setSelectedInvoice(pendingInvoice || openInvoices.find((invoice) => !isPaidInvoice(invoice)) || openInvoices[0]);
      })
      .catch(() => {
        setInvoices(fallbackInvoices);
        setSelectedInvoice(fallbackInvoices[0]);
      });

    fetch(`${API_BASE_URL}/payments`, {
      headers: getAuthHeaders(),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((items) => {
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }

        setPaymentHistory(
          items
            .slice(-6)
            .reverse()
            .map((payment) => ({
              id: payment.id,
            service: payment.service,
            time: new Date(payment.createdAt).toLocaleString("vi-VN"),
              amount: payment.amount,
              status: payment.status,
              method: payment.method,
              gateway: payment.gateway,
              gatewayRef: payment.gatewayRef,
              bookingId: payment.bookingId,
              methodDetail: payment.methodDetail,
            }))
        );
      })
      .catch(() => setPaymentHistory(transactions));
  }, []);

  useEffect(() => {
    setGatewayStatus("Chưa khởi tạo");
    setGatewayRef("");
  }, [selectedGatewayId, selectedInvoice.id]);

  const discount = useVoucher ? 30000 : 0;
  const protectionFee = Math.round(selectedInvoice.amount * 0.015);
  const total = useMemo(
    () => Math.max(selectedInvoice.amount + selectedGateway.fee + protectionFee - discount, 0),
    [discount, protectionFee, selectedGateway.fee, selectedInvoice.amount]
  );
  const canPay = !saving && !isPaidInvoice(selectedInvoice) && selectedInvoice.amount > 0;
  const exportReceipt = (transaction) => {
    const lines = [
      "BIEN NHAN THANH TOAN HOMECARE",
      `Ma giao dich: ${transaction.id}`,
      `Ma booking: ${transaction.bookingId || "Khong co"}`,
      `Dich vu: ${transaction.service}`,
      `Thoi gian: ${transaction.time}`,
      `Cong thanh toan: ${transaction.gateway || transaction.method || "Khong co"}`,
      `Ma tham chieu: ${transaction.gatewayRef || "Khong co"}`,
      `So tien: ${formatCurrency(transaction.amount)}`,
      `Trang thai: ${transaction.status}`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bien-nhan-${transaction.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const runGatewaySimulation = async () => {
    const reference = createGatewayRef(selectedGateway);
    setGatewayRef(reference);

    for (const step of gatewaySteps) {
      setGatewayStatus(step);
      await new Promise((resolve) => window.setTimeout(resolve, 550));
    }

    setGatewayStatus("Thanh toán mô phỏng thành công");
    return reference;
  };

  const confirmPayment = async () => {
    if (!canPay) {
      return;
    }

    setAuthCode("");
    setAuthError("");
    setAuthOpen(true);
  };

  const submitGatewayAuthentication = async () => {
    if (!selectedGateway.cash && !/^\d{6}$/.test(authCode.trim())) {
      setAuthError("Vui lòng nhập mã xác thực gồm 6 chữ số.");
      return;
    }

    setAuthOpen(false);
    setSaving(true);

    try {
      const gatewayRef = await runGatewaySimulation();
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          bookingId: selectedInvoice.id,
          service: selectedInvoice.service,
          method: selectedGateway.name,
          methodDetail: selectedGateway.detail,
          gateway: selectedGateway.name,
          gatewayRef,
          amount: total,
        }),
      });
      const payment = await response.json();

      if (!response.ok) {
        throw new Error(payment.message || "Không thể ghi nhận thanh toán");
      }

      setPaymentStatus(
        `Thanh toán ${payment.id} cho ${selectedInvoice.id} qua ${selectedGateway.name} đã thành công.`
      );
      const nextPendingInvoice = invoices.find(
        (invoice) => invoice.id !== selectedInvoice.id && !isPaidInvoice(invoice)
      );
      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === selectedInvoice.id
            ? { ...invoice, status: "Đã thanh toán", paymentId: payment.id }
            : invoice
        )
      );
      setSelectedInvoice((current) => ({
        ...current,
        status: "Đã thanh toán",
        paymentId: payment.id,
      }));
      setPaymentHistory((current) => [
        {
          id: payment.id,
          service: payment.service,
          time: new Date(payment.createdAt).toLocaleString("vi-VN"),
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          gateway: payment.gateway || selectedGateway.name,
          gatewayRef: payment.gatewayRef || gatewayRef,
          bookingId: payment.bookingId,
          methodDetail: payment.methodDetail || selectedGateway.detail,
        },
        ...current,
      ]);
      if (nextPendingInvoice) {
        setSelectedInvoice(nextPendingInvoice);
      }
    } catch (error) {
      setPaymentStatus(error instanceof Error ? error.message : "Không thể lưu thanh toán.");
    } finally {
      setSaving(false);
      window.setTimeout(() => setPaymentStatus(""), 4200);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <WalletCards size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
                  Trung tâm thanh toán
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
                  Thanh toán dịch vụ chăm sóc nhà
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Chọn hóa đơn, cập nhật phương thức và ghi nhận thanh toán trực tiếp vào hệ thống.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-100 p-2 text-center">
              <Metric value={pendingInvoices.length} label="Chờ thanh toán" />
              <Metric value={paymentHistory.length} label="Giao dịch" />
              <Metric value={gateways.length} label="Cổng thanh toán" />
            </div>
          </div>
        </header>

        {paymentStatus && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <Check size={18} />
            {paymentStatus}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
          <main className="space-y-6">
            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Hóa đơn cần thanh toán</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Chọn booking hoặc dịch vụ cần xử lý thanh toán.
                  </p>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700 ring-1 ring-cyan-100">
                  {formatCurrency(pendingInvoices.reduce((sum, item) => sum + item.amount, 0))}
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {pendingInvoices.map((invoice) => {
                  const active = selectedInvoice.id === invoice.id;
                  const paid = isPaidInvoice(invoice);

                  return (
                    <button
                      key={invoice.id}
                      onClick={() => setSelectedInvoice(invoice)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-cyan-400 bg-cyan-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                          <ReceiptText size={19} />
                        </div>
                        {active && <Check className="text-cyan-700" size={19} />}
                      </div>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        {invoice.id}
                      </p>
                      <h3 className="mt-1 font-bold text-slate-950">{invoice.service}</h3>
                      <p className="mt-1 text-sm text-slate-500">{invoice.provider}</p>
                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {paid ? "Đã thanh toán" : "Chờ thanh toán"}
                      </span>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-500">{invoice.due}</span>
                        <span className="font-bold text-slate-950">{formatCurrency(invoice.amount)}</span>
                      </div>
                    </button>
                  );
                })}
                {pendingInvoices.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500 lg:col-span-3">
                    Không còn hóa đơn chờ thanh toán.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Chọn cổng thanh toán</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Giao dịch sẽ được xác thực qua cổng bạn chọn trước khi ghi nhận vào hệ thống.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                  {selectedGateway.settlement}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {gateways.map((gateway) => {
                  const GatewayIcon = gateway.icon;
                  const active = selectedGateway.id === gateway.id;

                  return (
                    <button
                      key={gateway.id}
                      type="button"
                      onClick={() => setSelectedGatewayId(gateway.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-cyan-400 bg-cyan-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                          <GatewayIcon size={20} />
                        </div>
                        {active && <Check className="text-cyan-700" size={19} />}
                      </div>
                      <h3 className="mt-4 font-bold text-slate-950">{gateway.name}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-500">{gateway.detail}</p>
                      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-slate-500">{gateway.successRate}</span>
                        <span className="font-bold text-slate-950">{formatCurrency(gateway.fee)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Lịch sử giao dịch</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bấm xuất ở giao dịch cần lấy biên nhận.
                  </p>
                </div>
              </div>

              <div className="mt-5 max-h-[300px] space-y-3 overflow-y-auto pr-2">
                {paymentHistory.map((transaction) => (
                  <article key={transaction.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{transaction.id}</p>
                      <h3 className="mt-1 font-bold text-slate-950">{transaction.service}</h3>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Clock3 size={15} />
                        {transaction.time}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-slate-950">{formatCurrency(transaction.amount)}</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">{transaction.status}</p>
                      {transaction.method && (
                        <p className="mt-1 text-xs font-semibold text-slate-400">{transaction.method}</p>
                      )}
                      {transaction.gatewayRef && (
                        <p className="mt-1 text-xs font-semibold text-slate-400">{transaction.gatewayRef}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="mt-3 h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <LockKeyhole size={20} />
                </div>
                <div>
                  <h2 className="font-bold">Tóm tắt thanh toán</h2>
                  <p className="text-sm text-slate-300">Mã hóa và xác thực 2 lớp.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Mã đơn" value={selectedInvoice.id} />
                <SummaryRow label="Dịch vụ" value={selectedInvoice.service} />
                <SummaryRow label="Cổng xử lý" value={selectedGateway.name} />
                <SummaryRow label="Tiền dịch vụ" value={formatCurrency(selectedInvoice.amount)} />
                <SummaryRow label="Phí bảo vệ" value={formatCurrency(protectionFee)} />
                <SummaryRow label="Phí cổng" value={formatCurrency(selectedGateway.fee)} />
                <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 px-3 py-2">
                  <span className="text-slate-300">Voucher HOMECARE30</span>
                  <input
                    checked={useVoucher}
                    onChange={(event) => setUseVoucher(event.target.checked)}
                    className="h-5 w-5 accent-cyan-400"
                    type="checkbox"
                  />
                </label>
                {useVoucher && <SummaryRow label="Giảm giá" value={`-${formatCurrency(discount)}`} />}
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <SummaryRow label="Tổng thanh toán" value={formatCurrency(total)} strong />
                <button
                  onClick={confirmPayment}
                  disabled={!canPay}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                >
                  <ShieldCheck size={18} />
                  {saving ? "Đang thanh toán..." : isPaidInvoice(selectedInvoice) ? "Đã thanh toán" : "Xác nhận thanh toán"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-lg font-bold">Kiểm soát rủi ro</h2>
              <div className="mt-4 space-y-3">
                <PromiseItem icon={<ShieldCheck size={18} />} title="Giữ tiền an toàn" detail="Chỉ giải ngân khi dịch vụ hoàn tất." />
                <PromiseItem icon={<ReceiptText size={18} />} title="Biên nhận tự động" detail="Lưu hóa đơn theo từng booking." />
                <PromiseItem icon={<LockKeyhole size={18} />} title="Xác thực giao dịch" detail="OTP cho cổng online hoặc xác nhận thu tiền mặt tại nhà." />
              </div>
            </section>
          </aside>
        </div>
      </div>

      {authOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <SelectedGatewayIcon size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-950">{selectedGateway.authTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{selectedGateway.authHint}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-500">Mã đơn</span>
                <span className="font-bold text-slate-950">{selectedInvoice.id}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-500">Số tiền</span>
                <span className="font-bold text-slate-950">{formatCurrency(total)}</span>
              </div>
            </div>

            {!selectedGateway.cash && (
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-700">Mã xác thực</span>
                <input
                  value={authCode}
                  onChange={(event) => {
                    setAuthCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    setAuthError("");
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-bold tracking-[0.4em] outline-none transition focus:border-cyan-400 focus:bg-white"
                  inputMode="numeric"
                  placeholder="000000"
                />
              </label>
            )}
            {authError && <p className="mt-2 text-sm font-semibold text-rose-600">{authError}</p>}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAuthOpen(false)}
                className="h-12 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitGatewayAuthentication}
                className="h-12 rounded-2xl bg-cyan-500 text-sm font-bold text-white"
              >
                {selectedGateway.cash ? "Xác nhận" : "Xác thực"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">Chi tiết hóa đơn</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{selectedTransaction.service}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700"
              >
                Đóng
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoTile label="Mã giao dịch" value={selectedTransaction.id} />
              <InfoTile label="Mã booking" value={selectedTransaction.bookingId || "Không có"} />
              <InfoTile label="Thời gian" value={selectedTransaction.time} />
              <InfoTile label="Trạng thái" value={selectedTransaction.status} />
              <InfoTile label="Cổng thanh toán" value={selectedTransaction.gateway || selectedTransaction.method || "Không có"} />
              <InfoTile label="Mã tham chiếu" value={selectedTransaction.gatewayRef || "Không có"} />
              <InfoTile label="Số tiền" value={formatCurrency(selectedTransaction.amount)} />
              <InfoTile label="Chi tiết" value={selectedTransaction.methodDetail || selectedTransaction.method || "Đã ghi nhận"} />
            </div>

            <button
              type="button"
              onClick={() => exportReceipt(selectedTransaction)}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-bold text-white"
            >
              <FileText size={18} />
              Xuất hóa đơn
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ value, label }) {
  return (
    <div className="min-w-0 rounded-xl bg-white px-3 py-2">
      <p className="truncate text-lg font-bold text-slate-950">{value}</p>
      <p className="truncate text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "text-base font-bold text-white" : "text-slate-300"}>{label}</span>
      <span className={strong ? "text-xl font-bold text-cyan-300" : "text-right font-semibold text-white"}>{value}</span>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PromiseItem({ icon, title, detail }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-slate-50 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 ring-1 ring-slate-200">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
