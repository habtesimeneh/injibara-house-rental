import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  Lock,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import AuthCategorySlider from "../components/AuthCategorySlider";
import Logo from "../components/Logo";
import ButtonSpinner from "../components/ButtonSpinner";
import { useLanguage } from "../context/LanguageContext";

export default function Login() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageContent, setPageContent] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    axios
      .get("/api/auth-page/settings")
      .then((res) => {
        setPageContent(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const successMessage = location.state?.message;
  const redirectPath =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedUser = await login(email, password);

      if (loggedUser.role === "Admin") {
        navigate("/admin");
      } else {
        navigate(redirectPath || "/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Background Lighting Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: House Categories Auto Slider */}
        <div className="lg:col-span-6 h-full">
          <AuthCategorySlider />
        </div>

        {/* Right Column: Customer Login Form */}
        <div className="lg:col-span-6 bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <Logo size="md" />
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs px-3 py-1.5 rounded-xl">
                <User size={14} />
                <span>{t("signIn")}</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === "am"
                ? pageContent?.login_title_am || t("signInTitle")
                : pageContent?.login_title_en || t("signInTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {language === "am"
                ? pageContent?.login_subtitle_am || t("signInSubtitle")
                : pageContent?.login_subtitle_en || t("signInSubtitle")}
            </p>
          </div>

          {/* Notifications */}
          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2
                size={16}
                className="text-emerald-400 flex-shrink-0"
              />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-2xl text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {language === "am"
                  ? "ኢሜይል ወይም ስልክ ቁጥር (Email or Phone Number)"
                  : "Email or Phone Number"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder={
                    language === "am"
                      ? "ምሳሌ፡ abebe@example.com ወይም 09..."
                      : "e.g., abebe@example.com or 09..."
                  }
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {t("password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? (
                <>
                  <ButtonSpinner size={18} />
                  <span>{t("loggingIn")}</span>
                </>
              ) : (
                <>
                  <span>{t("loginLink")}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Links Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-3 text-xs text-slate-400">
            <p className="text-center">
              {t("dontHaveAccount")}{" "}
              <Link
                to="/register"
                className="font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                {t("registerLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
