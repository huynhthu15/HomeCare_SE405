// src/AuthApp.tsx

import { useEffect, useState } from "react";
import "./index.css";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

import {
  login,
  register,
  type User,
} from "./services/authService";

type AuthAppProps = {
  onAuthenticated?: () => void;
  onLogout?: () => void;
};

type AuthSession = {
  token: string;
  user: User;
};

const notifyAuthChanged = () => {
  window.dispatchEvent(new Event("homecare-auth-changed"));
};

function readAuthSession(): AuthSession | null {
  const token = localStorage.getItem("auth_token");
  const storedUser = localStorage.getItem("auth_user");

  if (!token || !storedUser) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(storedUser) as User,
    };
  } catch {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    return null;
  }
}

function AuthApp({
  onAuthenticated,
  onLogout,
}: AuthAppProps) {
  const [view, setView] = useState<
    "login" | "register" | "forgot"
  >("login");

  const [busy, setBusy] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [session, setSession] = useState<AuthSession | null>(() =>
    readAuthSession()
  );

  useEffect(() => {
    if (session) {
      onAuthenticated?.();
    }
  }, [onAuthenticated, session]);

  const setAuth = (token: string, user: User) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setSession({ token, user });
    notifyAuthChanged();
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setSession(null);
    notifyAuthChanged();
  };

  // STATUS MESSAGE
  const updateStatus = (
    message: string
  ) => {
    setStatusMessage(message);

    setTimeout(() => {
      setStatusMessage("");
    }, 4000);
  };

  // LOGIN
  const handleLogin = async (
    email: string,
    password: string
  ) => {
    setBusy(true);

    try {
      const response = await login(
        email,
        password
      );

      setAuth(
        response.token,
        response.user
      );

      onAuthenticated?.();

      updateStatus(
        "Đăng nhập thành công"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Đăng nhập thất bại";

      updateStatus(message);
    } finally {
      setBusy(false);
    }
  };

  // REGISTER
  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    setBusy(true);

    try {
      const response = await register(
        name,
        email,
        password
      );

      setAuth(
        response.token,
        response.user
      );

      onAuthenticated?.();

      updateStatus(
        "Đăng ký thành công"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Đăng ký thất bại";

      updateStatus(message);
    } finally {
      setBusy(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgotPassword = async (
    email: string
  ) => {
    setBusy(true);

    try {
      // MOCK API
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      updateStatus(
        `Đã gửi email khôi phục tới ${email}`
      );
    } catch (error) {
      updateStatus(
        "Không thể gửi email khôi phục"
      );
    } finally {
      setBusy(false);
    }
  };

  // AUTHENTICATED
  if (session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] shadow-xl p-10 max-w-xl w-full text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6">
            <img
              src="https://i.pravatar.cc/200"
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            Xin chào 👋
          </h2>

          <p className="text-xl text-blue-600 font-semibold mb-2">
            {session.user.name ||
              session.user.email}
          </p>

          <p className="text-gray-500 mb-8">
            Đang chuyển về HomeCare Super App...
          </p>

          {statusMessage && (
            <div className="mb-6 bg-green-50 border border-green-100 text-green-600 py-3 px-4 rounded-2xl">
              {statusMessage}
            </div>
          )}

          <button
            onClick={() => {
              logout();
              onLogout?.();
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-semibold transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  // UNAUTHENTICATED
  return (
    <div className="relative">
      {/* STATUS */}
      {statusMessage && (
        <div className="fixed top-6 right-6 z-50 bg-white shadow-lg border border-gray-100 px-5 py-4 rounded-2xl text-gray-700">
          {statusMessage}
        </div>
      )}

      {/* TOP SWITCH */}
      {view !== "forgot" && (
        <div className="fixed top-6 right-6 z-40 flex gap-3">
          <button
            onClick={() =>
              setView("login")
            }
            className={`px-5 py-2 rounded-full font-medium transition ${
              view === "login"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Đăng nhập
          </button>

          <button
            onClick={() =>
              setView("register")
            }
            className={`px-5 py-2 rounded-full font-medium transition ${
              view === "register"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Đăng ký
          </button>
        </div>
      )}

      {/* LOGIN */}
      {view === "login" && (
        <LoginPage
          onSubmit={handleLogin}
          onForgotPassword={() =>
            setView("forgot")
          }
          onRegister={() =>
            setView("register")
          }
          loading={busy}
        />
      )}

      {/* REGISTER */}
      {view === "register" && (
        <RegisterPage
          onSubmit={handleRegister}
          onLogin={() =>
            setView("login")
          }
          loading={busy}
        />
      )}

      {/* FORGOT PASSWORD */}
      {view === "forgot" && (
        <ForgotPasswordPage
          onSubmit={
            handleForgotPassword
          }
          onBack={() =>
            setView("login")
          }
          loading={busy}
        />
      )}
    </div>
  );
}

export default AuthApp;
