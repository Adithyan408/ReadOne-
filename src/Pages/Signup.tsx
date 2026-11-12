import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaBookOpen } from "react-icons/fa";
import { loginWithGoogle, signup } from "../services/authService";
import { useState } from "react";
import AlertModal from "../Components/AlertModal";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const validateForm = () => {
    if (!username.trim()) {
      showError("Full name cannot be empty.");
      return false;
    }

    if (!email.trim()) {
      showError("Email cannot be empty.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showError("Please enter a valid email address.");
      return false;
    }

    if (!password.trim()) {
      showError("Password cannot be empty.");
      return false;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return false;
    }

    if (!confirmPassword.trim()) {
      showError("Please confirm your password.");
      return false;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to sign up with Google";
      showError(msg);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !username.trim() &&
      !email.trim() &&
      !password.trim() &&
      !confirmPassword.trim()
    ) {
      showError("All Fields are required");
      return false;
    }
    if (!validateForm()) return;

    try {
      setLoading(true);

      await signup(username.trim(), email.trim(), password);

      navigate("/", { replace: true });
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Failed to sign up";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={showErrorModal}
        message={errorMessage}
        onClose={() => setShowErrorModal(false)}
      />
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F8F6F2] px-4 py-6 sm:px-6 sm:py-10">
            <div className="w-full max-w-[460px] rounded-2xl sm:rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-slate-50 px-5 py-7 sm:px-10 sm:py-8 shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
              {/* Logo */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-blue-100">
                      <FaBookOpen className="text-base sm:text-lg text-blue-600" />
                    </div>

                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800">
                        Read<span className="text-blue-600">One</span>
                      </h1>
                  </div>

                  <p className="mt-2.5 sm:mt-3 text-sm text-gray-500">Read • Write • Inspire</p>
                </div>

                {/* Heading */}
                    <div className="mt-5 sm:mt-6 text-center">
                      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">
                        Create your account
                      </h2>

                        <p className="mt-1.5 sm:mt-2 text-sm text-gray-500">
                          Join our community and start sharing your stories.
                        </p>
                    </div>

                    {/* Form */}
                    <form className="mt-6 space-y-4" onSubmit={handleSignUp}>
                      {/* Full Name */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Full Name
                        </label>

                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="John Doe"
                          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

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
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Password
                        </label>

                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Confirm Password
                        </label>

                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your password"
                          className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 pt-1 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        <span>
                          I agree to the{" "}
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Terms of Service
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Privacy Policy
                          </button>
                        </span>
                      </label>

                      {/* Create Account */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50"
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center">
                      <div className="h-px flex-1 bg-gray-200" />

                      <span className="mx-4 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                        OR
                      </span>

                      <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    {/* Google Signup */}
                    <button
                      onClick={handleGoogleSignup}
                      className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <FcGoogle size={20} />
                      Continue with Google
                    </button>

                    {/* Footer */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Login
                      </Link>
                    </p>
                </div>
              </div>
            </>
            );
}

            export default Signup;
