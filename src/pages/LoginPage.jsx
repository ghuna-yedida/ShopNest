/**
 * LoginPage.jsx
 *
 * Design: editorial dark split — left panel with brand story, right panel with form.
 * This two-column layout psychologically signals "welcome, take your time"
 * instead of a bare centered box that feels rushed.
 *
 * DummyJSON test credentials:
 *   username: emilys   password: emilyspass
 *   username: michaelw password: michaelwpass
 */

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const EyeIcon = ({ open }) =>
  open ? (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [touched, setTouched] = useState({});

  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to where the user came from (e.g., /checkout) after login
  // WHY? If a user tries to checkout while logged out, we send them to login.
  // After a successful login, we send them BACK to checkout, not the home page.
  const from = location.state?.from?.pathname || "/";

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  const handleBlur = (field) => () => {
    setTouched((p) => ({ ...p, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (!form.username.trim() || !form.password.trim()) return;

    const result = await login(form.username.trim(), form.password);
    if (result.success) navigate(from, { replace: true });
  };

  // Inline validation — only shown after the field has been touched
  const errors = {
    username:
      touched.username && !form.username.trim() ? "Username is required" : "",
    password:
      touched.password && !form.password.trim() ? "Password is required" : "",
  };

  return (
    <div className="min-h-screen bg-dark-900 flex overflow-hidden">
      {/* ── Left Panel: Brand Storytelling ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 via-dark-900 to-black" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        {/* Content above background */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-glow">
              <span className="text-white font-display font-bold text-lg">
                S
              </span>
            </div>
            <span className="font-display font-bold text-2xl text-white">
              Shop<span className="text-brand-400">Nest</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="font-display text-5xl xl:text-6xl font-bold text-white leading-tight">
              Your world.
              <br />
              <span className="text-brand-400">One nest.</span>
            </h1>
            <p className="mt-4 text-gray-400 text-lg font-body leading-relaxed max-w-md">
              Curated collections from electronics to fashion. Discover products
              you'll love at prices that make sense.
            </p>
          </div>

          {/* Social proof chips */}
          <div className="flex flex-wrap gap-3">
            {[
              "500K+ Products",
              "Free Returns",
              "Secure Checkout",
              "24/7 Support",
            ].map((chip) => (
              <span
                key={chip}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full 
                           text-sm text-gray-300 font-body backdrop-blur-sm"
              >
                ✦ {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Floating product cards decoration */}
        <div className="relative z-10 text-xs text-gray-600 font-body">
          © 2026 ShopNest. All rights reserved.
        </div>
      </div>

      {/* ── Right Panel: Login Form ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">
                S
              </span>
            </div>
            <span className="font-display font-bold text-xl text-gray-900">
              Shop<span className="text-brand-500">Nest</span>
            </span>
          </Link>

          <h2 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500 font-body text-sm mb-8">
            Sign in to your account to continue shopping
          </p>

          {/* API error banner */}
          {error && (
            <div
              className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl
                            text-sm text-red-700 font-body animate-fade-in flex items-center gap-2"
            >
              <span className="text-red-400">⚠</span> {error}
            </div>
          )}

          {/* Hint banner */}
          <div className="mb-6 px-4 py-3 bg-brand-50 border border-brand-200 rounded-xl text-sm font-body">
            <p className="text-brand-700 font-semibold mb-1">
              Demo credentials
            </p>
            <p className="text-brand-600">
              Username:{" "}
              <code className="font-mono bg-brand-100 px-1 rounded">
                emilys
              </code>
            </p>
            <p className="text-brand-600">
              Password:{" "}
              <code className="font-mono bg-brand-100 px-1 rounded">
                emilyspass
              </code>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={form.username}
                onChange={handleChange("username")}
                onBlur={handleBlur("username")}
                placeholder="Enter your username"
                className={`w-full px-4 py-3 rounded-xl border-2 font-body text-sm transition-all
                  focus:outline-none bg-gray-50 focus:bg-white
                  ${
                    errors.username
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-brand-400"
                  }`}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500 font-body">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 font-body mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange("password")}
                  onBlur={handleBlur("password")}
                  placeholder="Enter your password"
                  className={`w-full pl-4 pr-12 py-3 rounded-xl border-2 font-body text-sm transition-all
                    focus:outline-none bg-gray-50 focus:bg-white
                    ${
                      errors.password
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 focus:border-brand-400"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-body">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300
                         text-white font-semibold font-body text-sm rounded-xl
                         transition-all duration-200 shadow-glow hover:shadow-none
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 font-body">
            Continue as guest?{" "}
            <Link
              to="/"
              className="text-brand-500 hover:text-brand-600 font-semibold"
            >
              Browse without login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
