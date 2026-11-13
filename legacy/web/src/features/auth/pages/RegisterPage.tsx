// src/pages/RegisterPage.tsx

import { useState } from "react";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";

type RegisterPageProps = {
  onSubmit: (
    name: string,
    email: string,
    password: string
  ) => void;

  onLogin?: () => void;

  loading?: boolean;
};

function RegisterPage({
  onSubmit,
  onLogin,
  loading = false,
}: RegisterPageProps) {
  const [name, setName] = useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert(
        "Mật khẩu xác nhận không khớp"
      );

      return;
    }

    onSubmit(name, email, password);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="grid xl:grid-cols-2 bg-white rounded-[32px] overflow-hidden shadow-xl max-w-6xl w-full">
        {/* LEFT SIDE */}
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-10 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-3 rounded-2xl">
                <UserPlus size={28} />
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
              Tạo tài khoản để quản lý ngôi nhà thông minh
            </h2>

            <p className="text-white/80 leading-relaxed">
              Theo dõi thiết bị, đặt lịch dịch vụ,
              sửa chữa và thanh toán nhanh chóng
              ngay trên một nền tảng duy nhất.
            </p>
          </div>

          {/* FEATURES */}
          <div className="space-y-4 mt-10">
            <FeatureItem text="Quản lý toàn bộ thiết bị gia đình" />

            <FeatureItem text="Đặt lịch dịch vụ chỉ với vài bước" />

            <FeatureItem text="Theo dõi trạng thái kỹ thuật viên realtime" />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-800">
              Đăng ký
            </h2>

            <p className="text-gray-500 mt-2">
              Bắt đầu trải nghiệm HomeCare 🚀
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* NAME */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Họ và tên
              </label>

              <div className="relative">
                <User
                  className="absolute left-4 top-3.5 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

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

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Xác nhận mật khẩu
              </label>

              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 px-4 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>

            {/* TERMS */}
            <label className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                className="mt-1"
                required
              />

              <span>
                Tôi đồng ý với điều khoản sử
                dụng và chính sách bảo mật của
                HomeCare
              </span>
            </label>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-2xl font-semibold transition disabled:opacity-70"
            >
              {loading
                ? "Đang đăng ký..."
                : "Tạo tài khoản"}
            </button>
          </form>

          {/* LOGIN LINK */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <button
              type="button"
              onClick={onLogin}
              className="text-blue-600 font-semibold hover:underline"
            >
              Đăng nhập ngay
            </button>
          </div>
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

export default RegisterPage;
