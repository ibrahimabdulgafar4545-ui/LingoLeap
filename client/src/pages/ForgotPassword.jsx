import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import api from '../services/api';

/* ──────────────────────────────────────────────
   Shared page shell
────────────────────────────────────────────── */
const Shell = ({ children }) => (
  <div
    className="min-h-screen flex flex-col items-center justify-center p-4"
    style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}
  >
    {/* Back to login */}
    <div className="absolute top-6 left-6">
      <Link
        to="/login"
        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition text-sm font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Login
      </Link>
    </div>

    {/* Logo */}
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-extrabold text-white">
        Lingo<span style={{ color: '#a5f3fc' }}>Leap</span>
      </h1>
      <p className="text-white/40 text-sm mt-1">Language Learning Platform</p>
    </div>

    {/* Card */}
    <div
      className="w-full max-w-md rounded-3xl p-8"
      style={{
        background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
        border: '1px solid rgba(99,102,241,0.25)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}
    >
      {children}
    </div>
  </div>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Something went wrong. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Sent state ── */
  if (sent) {
    return (
      <Shell>
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(34,197,94,0.12)',
                border: '2px solid rgba(34,197,94,0.3)',
              }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: '#4ade80' }} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your inbox!</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-2">
            If <strong className="text-white/80">{email}</strong> is linked to a LingoLeap account,
            you'll receive a password reset link shortly.
          </p>
          <p className="text-white/40 text-xs mb-8">
            Don't see it? Check your spam or junk folder.
          </p>

          {/* Resend */}
          <button
            onClick={() => { setSent(false); setEmail(''); }}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition block mx-auto mb-4"
          >
            Didn't receive it? Try again
          </button>
          <Link
            to="/login"
            className="text-white/40 hover:text-white/70 text-sm transition"
          >
            Back to login
          </Link>
        </div>
      </Shell>
    );
  }

  /* ── Form state ── */
  return (
    <Shell>
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(79,70,229,0.15)',
            border: '2px solid rgba(79,70,229,0.3)',
          }}
        >
          <KeyRound className="w-9 h-9" style={{ color: '#818cf8' }} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Forgot your password?
      </h2>
      <p className="text-white/50 text-sm text-center mb-8 leading-relaxed">
        No worries! Enter your email and we'll send you a secure link to reset it.
      </p>

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
          }}
        >
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email field */}
        <div>
          <label className="text-xs font-bold text-white/50 mb-1.5 block ml-1">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-white text-sm font-semibold outline-none transition placeholder-white/20"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="forgot-submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 mt-2"
          style={{
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Mail className="w-4 h-4" />
              Send Reset Link
            </>
          )}
        </button>
      </form>

      {/* Footer link */}
      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-white/40 hover:text-white/70 text-sm transition font-semibold"
        >
          ← Back to login
        </Link>
      </div>
    </Shell>
  );
};

export default ForgotPassword;
