import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ButtonSpinner from './ButtonSpinner';

const RESEND_COOLDOWN = 30;

// Clean OTP verification modal for the Admin Login 2FA flow.
// Reuses the existing secure backend endpoints (adminSend2FA / adminVerify2FA).
// No OTP, password, token, or secret is ever stored in frontend state beyond
// the transient 6-digit code the admin types.
export default function AdminOtpModal({ isOpen, email, onBack, onVerified }) {
  const { adminSend2FA, adminVerify2FA } = useAuth();
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const classifyError = (msg) => {
    setError(msg);
    setExpired(/expired|request a new code/i.test(msg || ''));
  };

  // Auto-send the OTP whenever the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setOtp('');
    setError('');
    setExpired(false);
    setSuccess(false);
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  const sendCode = async () => {
    setSending(true);
    setError('');
    setExpired(false);
    try {
      const data = await adminSend2FA(email.trim());
      if (data?.success) {
        setCooldown(RESEND_COOLDOWN);
      } else {
        classifyError(data?.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err) {
      classifyError(
        err?.response?.data?.error || 'Failed to send verification code. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setExpired(false);

    if (otp.trim().length !== 6) {
      classifyError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifying(true);
    try {
      const data = await adminVerify2FA(email.trim(), otp.trim());
      if (data?.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onVerified) onVerified();
        }, 1200);
      } else {
        classifyError(data?.error || 'Invalid verification code.');
        setOtp('');
      }
    } catch (err) {
      classifyError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          'Verification failed. Please try again.'
      );
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl p-8 relative">
        <button
          type="button"
          onClick={onBack}
          className="absolute top-4 left-4 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-black text-white">Two-Factor Verification</h2>
          <p className="text-xs text-slate-400">
            We sent a 6-digit code to the phone linked to{' '}
            <span className="text-amber-300 font-semibold">{email}</span>.
          </p>
        </div>

        {success ? (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            <span>Verified! Redirecting to dashboard…</span>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleVerify}>
            {error && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                  expired
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound size={18} />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  required
                  placeholder="••••••"
                  maxLength={6}
                  disabled={verifying}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-gold text-center tracking-[0.5em] font-bold"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || sending || otp.trim().length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gold hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-70"
            >
              {verifying ? (
                <>
                  <ButtonSpinner size={18} />
                  <span>Verifying…</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Verify &amp; Sign In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              {sending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" /> Sending code…
                </span>
              ) : (
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={cooldown > 0}
                  className="font-semibold text-amber-400 hover:text-amber-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                  <Send size={14} />
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
