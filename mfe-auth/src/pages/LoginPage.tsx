import { useState } from "react";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

type LoginPageProps = {
  onSubmit: (
    email: string,
    password: string
  ) => void;

  onForgotPassword?: () => void;

  onRegister?: () => void;

  loading?: boolean;
};

type FeatureItemProps = {
  text: string;
};

function LoginPage({
  onSubmit,
  onForgotPassword,
  onRegister,
  loading = false,
}: LoginPageProps) {
  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    onSubmit(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="grid xl:grid-cols-2 bg-white rounded-[32px] overflow-hidden shadow-xl max-w-6xl w-full">
        {/* LEFT */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-10 text-white flex flex-col justify-between">
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
              Chăm sóc mọi thiết bị trong ngôi nhà của bạn
            </h2>

            <p className="text-white/80 leading-relaxed">
              Theo dõi thiết bị, đặt lịch vệ sinh,
              sửa chữa và thanh toán trong
              một ứng dụng duy nhất.
            </p>
          </div>

          <div className="space-y-4 mt-10">
            <FeatureItem text="Theo dõi kỹ thuật viên realtime" />

            <FeatureItem text="Đặt lịch sửa chữa nhanh chóng" />

            <FeatureItem text="Quản lý vật dụng thông minh" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
              Đăng nhập
            </h2>

            <p className="text-gray-500 mt-2">
              Chào mừng bạn quay trở lại 👋
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
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
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Mật khẩu
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={18}
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-12 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-4 top-3.5 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* OPTIONS */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" />
                Ghi nhớ đăng nhập
              </label>

              <button
                type="button"
                onClick={onForgotPassword}
                className="text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition disabled:opacity-70"
            >
              {loading
                ? "Đang đăng nhập..."
                : "Đăng nhập"}

              {!loading && (
                <ArrowRight size={18} />
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <button
              type="button"
              onClick={onRegister}
              className="text-blue-600 font-semibold hover:underline"
            >
              Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default LoginPage;
