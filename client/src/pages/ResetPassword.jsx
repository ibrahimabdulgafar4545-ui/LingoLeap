import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';

/* ──────────────────────────────────────────────
   Shared page shell
────────────────────────────────────────────── */
const Shell = ({ children }) => (
  <div
    className="min-h-screen flex flex-col items-center justify-center p-4"
    style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}
  >
    {/* Back link */}
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

/* ── Password strength helper ── */
const getStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { level: 1, label: 'Weak', color: '#ef4444' },
    { level: 2, label: 'Fair', color: '#f59e0b' },
    { level: 3, label: 'Good', color: '#3b82f6' },
    { level: 4, label: 'Strong', color: '#22c55e' },
  ];
  return map[score - 1] || { level: 0, label: '', color: 'transparent' };
};

const PasswordStrengthBar = ({ password }) => {
  const strength = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2 px-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)',
            }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold" style={{ color: strength.color }}>
        {strength.label}
      </p>
    </div>
  );
};

/* ──────────────────────────────────────────────
   Reset Password page — /reset-password/:token
────────────────────────────────────────────── */
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        // Store token if provided (auto-login after reset)
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        setSuccess(true);
        // Auto-redirect to dashboard after 2.5s
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'This reset link is invalid or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) {
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
          <h2 className="text-2xl font-bold text-white mb-3">Password Reset! 🎉</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Your password has been updated successfully. Redirecting you to your dashboard…
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
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
          <ShieldCheck className="w-9 h-9" style={{ color: '#818cf8' }} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-2">
        Set a new password
      </h2>
      <p className="text-white/50 text-sm text-center mb-8 leading-relaxed">
        Choose a strong, unique password for your LingoLeap account.
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* New password */}
        <div>
          <label className="text-xs font-bold text-white/50 mb-1.5 block ml-1">
            NEW PASSWORD
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-white text-sm font-semibold outline-none transition placeholder-white/20"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-xs font-bold text-white/50 mb-1.5 block ml-1">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              id="reset-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-white text-sm font-semibold outline-none transition placeholder-white/20"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '2px solid rgba(255,255,255,0.1)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {/* Match indicator */}
          {confirmPassword && (
            <p
              className="text-xs font-semibold mt-1.5 ml-1"
              style={{ color: password === confirmPassword ? '#4ade80' : '#f87171' }}
            >
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          id="reset-submit"
          loading={loading}
          icon={<ShieldCheck className="w-4 h-4" />}
          variant="custom"
          className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 mt-1"
          style={{
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Reset Password
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <Link
          to="/forgot-password"
          className="text-white/40 hover:text-white/70 text-sm transition font-semibold"
        >
          Request a new reset link
        </Link>
      </div>
    </Shell>
  );
};

export default ResetPassword;
