// src/pages/ForgotPasswordPage.tsx

import { useState } from "react";

import {
  Mail,
  ArrowLeft,
  Send,
  ShieldCheck,
} from "lucide-react";

type ForgotPasswordPageProps = {
  onBack?: () => void;

  onSubmit?: (email: string) => void;

  loading?: boolean;
};

function ForgotPasswordPage({
  onBack,
  onSubmit,
  loading = false,
}: ForgotPasswordPageProps) {
  const [email, setEmail] =
    useState("");

  const [sent, setSent] =
    useState(false);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(email);
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="grid xl:grid-cols-2 bg-white rounded-[32px] overflow-hidden shadow-xl max-w-5xl w-full">
        {/* LEFT SIDE */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShieldCheck size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  HomeCare
                </h1>

                <p className="text-white/80 text-sm">
                  Super App
                </p>
              </div>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-5">
              Khôi phục tài khoản của bạn
            </h2>

            <p className="text-white/80 leading-relaxed">
              Đừng lo lắng. Chúng tôi sẽ gửi
              hướng dẫn đặt lại mật khẩu đến
              email của bạn.
            </p>
          </div>

          {/* FEATURES */}
          <div className="space-y-4 mt-10">
            <FeatureItem text="Bảo mật tài khoản nhiều lớp" />

            <FeatureItem text="Khôi phục mật khẩu nhanh chóng" />

            <FeatureItem text="Đồng bộ trên mọi thiết bị" />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10 flex flex-col justify-center">
          {!sent ? (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-gray-800">
                  Quên mật khẩu
                </h2>

                <p className="text-gray-500 mt-2">
                  Nhập email để nhận hướng dẫn
                  đặt lại mật khẩu
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* EMAIL */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-3.5 text-gray-400"
                      size={18}
                    />

                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition disabled:opacity-70"
                >
                  {loading
                    ? "Đang gửi..."
                    : "Gửi liên kết"}

                  {!loading && (
                    <Send size={18} />
                  )}
                </button>
              </form>

              {/* BACK */}
              <button
                onClick={onBack}
                className="mt-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition"
              >
                <ArrowLeft size={18} />
                Quay lại đăng nhập
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="inline-flex bg-green-100 p-5 rounded-3xl mb-6">
                <Send
                  className="text-green-600"
                  size={36}
                />
              </div>

              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Kiểm tra email của bạn 📩
              </h2>

              <p className="text-gray-500 leading-relaxed mb-8">
                Chúng tôi đã gửi hướng dẫn đặt
                lại mật khẩu đến:
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 mb-8 font-semibold text-blue-600">
                {email}
              </div>

              <button
                onClick={onBack}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold transition"
              >
                Quay lại đăng nhập
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type FeatureItemProps = {
  text: string;
};

function FeatureItem({
  text,
}: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 bg-white rounded-full"></div>

      <p className="text-white/90">{text}</p>
    </div>
  );
}

export default ForgotPasswordPage;