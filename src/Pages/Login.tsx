import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaBookOpen } from "react-icons/fa";
import { login, loginWithGoogle } from "../services/authService";
import { useState } from "react";
import AlertModal from "../Components/AlertModal";
import {
  setActiveRole,
  setLastUserPath,
} from "../utils/rolePersistence";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };
  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      showError("Email cannot be empty.");
      return;
    }

    if (!password.trim()) {
      showError("Password cannot be empty.");
      return;
    }
    try {
      await login(email, password);
      setActiveRole("user");
      setLastUserPath("/");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to sign in";
      showError(msg);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setActiveRole("user");
      setLastUserPath("/");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to sign in with Google";
      showError(msg);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />

      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8F6F2] px-4 py-8 sm:px-6 sm:py-10">
        <div className="w-full max-w-[420px] rounded-2xl sm:rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-slate-50 px-5 py-7 sm:px-10 sm:py-9 shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-blue-100">
                <FaBookOpen className="text-lg sm:text-xl text-blue-600" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-800">
                Read<span className="text-blue-600">One</span>
              </h1>
            </div>

            <p className="mt-3 sm:mt-4 text-sm text-gray-500">Read • Write • Inspire</p>
          </div>

          {/* Heading */}
          <div className="mt-6 sm:mt-8 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Welcome Back
            </h2>

            <p className="mt-1.5 sm:mt-2 text-sm text-gray-500">
              Sign in to continue your journey.
            </p>
          </div>

          {/* Form */}
          <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>

                {/* <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Forgot password?
                </button> */}
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Login */}
            <button
              onClick={handleLogin}
              className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
            >
              Login
            </button>

            {/* Divider */}
            <div className="flex items-center pt-2">
              <div className="h-px flex-1 bg-gray-200" />

              <span className="mx-4 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                OR
              </span>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>

            {/* Footer */}
            <p className="pt-2 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/signup"
                replace
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
