import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAdminAuth } from "../../hooks/useAdminAuth";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  LogIn,
} from "lucide-react";

export default function AdminLogin() {
  const { login, isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (isAdmin) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/admin";
      navigate(from, { replace: true });
    }
  }, [isAdmin, navigate, location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = login(username.trim(), password);
      if (result.success) {
        const from =
          (location.state as { from?: { pathname: string } })?.from?.pathname ||
          "/admin";
        navigate(from, { replace: true });
      } else {
        setError(result.error || "Authentication failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center pt-20 pb-10 px-4 sm:py-12 sm:px-6 lg:px-8 relative overflow-x-clip">
        {/* Decorative gradient glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[380px] w-[380px] sm:h-[500px] sm:w-[600px] rounded-full bg-gradient-to-tr from-indigo-200/50 via-blue-100/40 to-transparent blur-3xl -z-10" />

        {/* Back to reader site button */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <Link
              to="/"
              replace
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-100 hover:text-gray-900 transition backdrop-blur-sm"
            >
              <ArrowLeft size={14} />
              <span>Back to Site</span>
            </Link>
          </div>

          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* Header with Icon */}
            <div className="text-center">
                <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                  <ShieldCheck size={28} />
                </div>
                  <h2 className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Admin Access Portal
                  </h2>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500">
                      Sign in with your administrator credentials to manage ReadOne
                    </p>
                  </div>

                  {/* Login Card */}
                    <div className="mt-6 sm:mt-8 rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white/95 p-5 sm:p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
                      {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200/80 p-3.5 text-xs text-rose-800 animate-in fade-in duration-200">
                          <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold">Authentication Error</p>
                            <p className="mt-0.5">{error}</p>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div>
                          <label
                            htmlFor="admin-username"
                            className="block text-xs font-semibold text-gray-700 mb-1.5"
                          >
                            Admin Username
                          </label>
                          <div className="relative rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                              <User size={16} />
                            </div>
                            <input
                              id="admin-username"
                              type="text"
                              autoComplete="username"
                              value={username}
                              onChange={(e) => {
                                setUsername(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="Enter admin username"
                              className="block w-full rounded-xl border-none bg-transparent py-2.5 pl-10 pr-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden"
                              required
                            />
                          </div>
                        </div>

                        {/* Password Field */}
                        <div>
                          <label
                            htmlFor="admin-password"
                            className="block text-xs font-semibold text-gray-700 mb-1.5"
                          >
                            Admin Password
                          </label>
                          <div className="relative rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                              <Lock size={16} />
                            </div>
                            <input
                              id="admin-password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(null);
                              }}
                              placeholder="Enter admin password"
                              className="block w-full rounded-xl border-none bg-transparent py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                          >
                            <LogIn size={16} />
                            <span>{isLoading ? "Verifying..." : "Authorize Access"}</span>
                          </button>
                        </div>
                      </form>

                      {/* Secure access notice */}
                      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                          <Lock size={12} className="text-gray-400" />
                          <span>Configured with credentials in environment settings</span>
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
              );
}
