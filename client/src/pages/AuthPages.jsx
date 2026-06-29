import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import LingoLeapLogo from '../components/common/LingoLeapLogo';
import Button from '../components/common/Button';

const AuthPages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, error: authError, setError } = useAuth();

  const isLoginMode = location.pathname === '/login';

  // Input states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [loading, setLoading] = useState(false);
  const [valError, setValError] = useState(null);

  const languages = [
    { name: 'English', flag: '🇬🇧' },
    { name: 'French', flag: '🇫🇷' },
    { name: 'Spanish', flag: '🇪🇸' },
    { name: 'German', flag: '🇩🇪' },
    { name: 'Arabic', flag: '🇸🇦' },
    { name: 'Italian', flag: '🇮🇹' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValError(null);
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setValError('Please fill out all required fields.');
      setLoading(false);
      return;
    }

    if (!isLoginMode && !username) {
      setValError('Please choose a username.');
      setLoading(false);
      return;
    }

    try {
      localStorage.setItem('verify_email_holder', email);
      if (isLoginMode) {
        const result = await login(email, password);
        if (result.success) {
          navigate('/dashboard');
        }
      } else {
        const result = await signup(username, email, password, targetLanguage);
        if (result.success) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      {/* Back to Home Header */}
      <div className="absolute top-6 left-6">
        <div 
          onClick={() => navigate('/')} 
          className="cursor-pointer select-none"
        >
          <LingoLeapLogo size={32} variant="main" concept="gecko" animated={true} />
        </div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-3xl p-8 shadow-sm">
        <h2 className="text-3xl font-extrabold text-text-main text-center mb-2">
          {isLoginMode ? 'Welcome Back!' : 'Create Profile'}
        </h2>
        <p className="text-sm font-semibold text-brand-dark/50 text-center mb-6">
          {isLoginMode ? 'Login to continue your streak' : 'Start your language learning adventure'}
        </p>

        {/* Dynamic Alerts */}
        {(valError || authError) && (
          <div className="mb-4 p-4 bg-brand-red/10 border-2 border-brand-red/20 text-brand-red rounded-2xl flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{valError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Username Input for SignUp */}
          {!isLoginMode && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark/70 ml-1">USERNAME</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 w-5 h-5 text-brand-dark/30" />
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-brand-light/50 border-2 border-brand-gray focus:border-brand-blue rounded-2xl outline-none font-semibold text-sm transition"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-dark/70 ml-1">EMAIL</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-5 h-5 text-brand-dark/30" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-brand-light/50 border-2 border-brand-gray focus:border-brand-blue rounded-2xl outline-none font-semibold text-sm transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-brand-dark/70">PASSWORD</label>
              {isLoginMode && (
                <span
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-bold text-brand-blue cursor-pointer hover:underline"
                >
                  Forgot password?
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-5 h-5 text-brand-dark/30" />
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-brand-light/50 border-2 border-brand-gray focus:border-brand-blue rounded-2xl outline-none font-semibold text-sm transition"
              />
            </div>
          </div>

          {/* Target Language Selection for SignUp */}
          {!isLoginMode && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-brand-dark/70 ml-1">WHAT LANGUAGE DO YOU WANT TO LEARN?</label>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.name}
                    type="button"
                    onClick={() => setTargetLanguage(lang.name)}
                    className={`py-2 px-1 border-2 rounded-xl text-center flex flex-col items-center justify-center font-bold text-xs gap-1 transition ${
                      targetLanguage === lang.name 
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue shadow-sm' 
                        : 'border-brand-gray hover:bg-brand-light text-brand-dark/70'
                    }`}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            loading={loading}
            variant={isLoginMode ? 'blue' : 'primary'}
            className="w-full mt-4"
          >
            {isLoginMode ? 'LOG IN' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        {/* Footer toggling login / register */}
        <div className="mt-6 text-center border-t-2 border-border dark:border-border pt-4">
          <p className="text-sm font-semibold text-brand-dark/50">
            {isLoginMode ? "New to LingoLeap?" : "Already have an account?"}{' '}
            <span
              onClick={() => {
                setError(null);
                setValError(null);
                navigate(isLoginMode ? '/register' : '/login');
              }}
              className="text-brand-blue cursor-pointer font-bold hover:underline"
            >
              {isLoginMode ? 'Create an account' : 'Log in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPages;
