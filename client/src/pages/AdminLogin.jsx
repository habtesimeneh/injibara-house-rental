import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import AuthCategorySlider from '../components/AuthCategorySlider';
import ButtonSpinner from '../components/ButtonSpinner';
import AdminOtpModal from '../components/AdminOtpModal';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { adminVerifyCredentials } = useAuth();
  const navigate = useNavigate();

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminVerifyCredentials(email.trim(), password);

      if (data?.success && data.requires2FA) {
        setStep(2);
      } else {
        setError(data?.error || 'Invalid admin credentials.');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Invalid admin credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep(1);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-[90vh] bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">

      {/* Background Lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">

        {/* LEFT SIDE */}
        <div className="lg:col-span-6 h-full">
          <AuthCategorySlider />
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-6 bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-amber-500/30 shadow-2xl relative space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
              <ShieldCheck size={16} />
              <span>Admin Portal</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              SECURE ACCESS
            </span>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Admin Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in with your administrator credentials.
            </p>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 border">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gold hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-70 mt-4"
            >
              {loading ? (
                <>
                  <ButtonSpinner size={18} />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Are you a tenant or landlord?</span>
            <Link
              to="/login"
              className="font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Customer Login →
            </Link>
          </div>

        </div>
      </div>

      {/* STEP 2: OTP verification (clean modal) */}
      <AdminOtpModal
        isOpen={step === 2}
        email={email}
        onBack={handleBackToCredentials}
        onVerified={() => navigate('/admin', { replace: true })}
      />
    </div>
  );
}
