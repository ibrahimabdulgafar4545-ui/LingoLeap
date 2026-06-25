import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail, RefreshCw, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/* ──────────────────────────────────────────────
   Shared page shell
   ────────────────────────────────────────────── */
const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 relative"
       style={{ background: 'linear-gradient(135deg, #09090e 0%, #111124 50%, #0d1527 100%)' }}>
    {/* Back to home */}
    <div className="absolute top-6 left-6">
      <Link to="/" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition text-sm font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Home
      </Link>
    </div>

    {/* Logo */}
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-extrabold text-white">
        Lingo<span style={{ color: '#818cf8' }}>Leap</span>
      </h1>
      <p className="text-white/40 text-xs mt-1 font-bold tracking-wider uppercase">Language Learning Platform</p>
    </div>

    {/* Card */}
    <div className="w-full max-w-md rounded-3xl p-8 text-center"
         style={{
           background: 'linear-gradient(145deg, #16162a, #111a30)',
           border: '2px solid rgba(129,140,248,0.2)',
           boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
         }}>
      {children}
    </div>
  </div>
);

/* ──────────────────────────────────────────────
   Verify Email page with 6-digit Code Box Entry
   ────────────────────────────────────────────── */
export const VerifyEmailPage = () => {
  const { token } = useParams(); // For backward compatibility / prefilled links
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | success | error
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resendStatus, setResendStatus] = useState('');

  // Handle auto-submit if code matches token (if URL is `/verify-email/123456`)
  useEffect(() => {
    if (token && token.length === 6 && /^\d+$/.test(token)) {
      setCode(token);
      verifyCode(token);
    }
  }, [token]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const verifyCode = async (codeToVerify) => {
    const finalCode = codeToVerify || code;
    if (!finalCode || finalCode.length !== 6) {
      setStatus('error');
      setMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const email = user?.email || localStorage.getItem('verify_email_holder');
      const res = await api.post('/auth/verify-email', { 
        code: finalCode,
        email
      });

      if (res.data.success) {
        setStatus('success');
        setMessage(res.data.message || 'Your email address has been verified!');
        
        // Cache user verified state and refresh local state
        if (res.data.user) {
          localStorage.setItem('lingoleap_user', JSON.stringify(res.data.user));
          setUser(res.data.user);
        }
        
        // Transition to onboarding page
        setTimeout(() => {
          navigate('/onboarding');
        }, 1800);
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Verification code is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendStatus('Sending code...');
    try {
      const email = user?.email || localStorage.getItem('verify_email_holder');
      if (!email) {
        setResendStatus('Error: Log in first or request via resend page.');
        return;
      }
      await api.post('/auth/resend-verification', { email });
      setResendStatus('✅ Verification code sent successfully!');
      setCooldown(60); // 60 seconds cooldown
    } catch (err) {
      setResendStatus(err.response?.data?.message || '❌ Failed to send code. Please try again.');
    }
  };

  const logoutAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lingoleap_user');
    setUser(null);
    navigate('/login');
  };

  return (
    <Shell>
      {status === 'success' ? (
        <div className="animate-bounce">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-500/10 border-2 border-green-500/35">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Verified! 🎉</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-4">{message}</p>
          <p className="text-indigo-400 text-xs font-bold animate-pulse">Launching onboarding experience...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-indigo-500/10 border-2 border-indigo-500/35">
              <Key className="w-9 h-9 text-indigo-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Enter Verification Code</h2>
          <p className="text-white/50 text-xs font-semibold leading-relaxed mb-6">
            A secure 6-digit code has been sent to your email address: <br/>
            <span className="text-indigo-300 font-extrabold">{user?.email || localStorage.getItem('verify_email_holder') || 'your email'}</span>
          </p>

          {/* Error notifications */}
          {status === 'error' && (
            <div className="mb-5 p-3.5 rounded-2xl text-xs font-semibold text-left flex items-start gap-2 bg-red-500/15 border border-red-500/30 text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* Code input */}
          <div className="flex flex-col gap-4 mb-6">
            <input
              type="text"
              maxLength="6"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // numbers only
                setCode(val);
                if (val.length === 6) verifyCode(val);
              }}
              placeholder="123456"
              className="w-full tracking-[12px] text-center text-2xl font-black py-4 rounded-2xl text-white outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '2px solid rgba(255,255,255,0.12)',
              }}
              onFocus={e => e.target.style.borderColor = '#818cf8'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />

            <button
              onClick={() => verifyCode()}
              disabled={loading || code.length !== 6}
              className="w-full py-4 bg-brand-purple text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 btn-3d shadow-3d-purple disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Verification Code'}
            </button>
          </div>

          {/* Resend actions block */}
          <div className="border-t border-white/5 pt-4">
            {resendStatus && (
              <p className="text-[11px] font-bold text-indigo-400 mb-2">{resendStatus}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-white/50">
              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className={`flex items-center gap-1.5 transition ${
                  cooldown > 0 ? 'opacity-35 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-300'
                }`}
              >
                <RefreshCw size={12} />
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
              </button>
              <span>·</span>
              <button onClick={logoutAndRedirect} className="text-red-400 hover:text-red-300">
                Cancel & Logout
              </button>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
};

/* ──────────────────────────────────────────────
   Resend Verification page (standalone)
   ────────────────────────────────────────────── */
export const ResendVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      localStorage.setItem('verify_email_holder', email);
      setSent(true);
      setTimeout(() => {
        navigate('/verify-email');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      {sent ? (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-green-500/10 border-2 border-green-500/35">
              <Mail className="w-9 h-9 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Check your inbox!</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            A fresh 6-digit verification code has been sent. Check spam folders if you don't receive it shortly.
          </p>
          <p className="text-indigo-400 text-xs font-bold animate-pulse">Navigating to verification page...</p>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-indigo-500/10 border-2 border-indigo-500/35">
              <Mail className="w-9 h-9 text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Resend Code</h2>
          <p className="text-white/50 text-xs font-bold leading-normal mb-8">Enter your email and we'll send a fresh 6-digit verification code.</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-xs font-semibold text-left flex items-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            <div>
              <label className="text-[10px] font-black text-white/50 mb-1.5 block ml-1 tracking-wider">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-white text-sm font-semibold outline-none transition"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '2px solid rgba(255,255,255,0.12)',
                  }}
                  onFocus={e => e.target.style.borderColor = '#818cf8'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-purple text-white rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 btn-3d shadow-3d-purple transition-all duration-200 mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-4 h-4" /> Send Verification Code</>}
            </button>
          </form>

          <Link to="/login" className="block mt-6 text-white/40 hover:text-white/70 text-xs font-bold transition">
            Back to login
          </Link>
        </>
      )}
    </Shell>
  );
};

export default VerifyEmailPage;
