import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LearningProvider } from './context/LearningContext';
import { LanguageProvider } from './context/LanguageContext';
import { Toaster } from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';

// Pages - lazy loaded for code splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const AuthPages = React.lazy(() => import('./pages/AuthPages'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Learn = React.lazy(() => import('./pages/Learn'));
const LessonRunner = React.lazy(() => import('./pages/LessonRunner'));
const Practice = React.lazy(() => import('./pages/Practice'));
const AITutor = React.lazy(() => import('./pages/AITutor'));
const AIConversation = React.lazy(() => import('./pages/AIConversation'));
const Achievements = React.lazy(() => import('./pages/Achievements'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Friends = React.lazy(() => import('./pages/Friends'));
const Chat = React.lazy(() => import('./pages/Chat'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
import { VerifyEmailPage, ResendVerificationPage } from './pages/VerifyEmail';
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

// Loading Spinner
const FullPageLoader = () => (
  <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      <span className="font-extrabold text-brand-dark/40 text-sm">Loading LingoLeap...</span>
    </div>
  </div>
);

// Protected route guard (Dashboard and other primary learner pages)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (!user.isOnboarded) return <Navigate to="/onboarding" replace />;
  return children;
};

// Protected admin route guard
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center font-sans">
        <div className="bg-white border-2 border-brand-gray/40 rounded-3xl p-8 max-w-sm text-center shadow-3d-card">
          <div className="w-16 h-16 bg-rose-100 border-2 border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4 animate-bounce">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-black text-brand-dark mb-2">Access Denied</h1>
          <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mb-6">
            You do not have the required administrative privileges to access this area.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-brand-green text-brand-dark px-6 py-3 rounded-2xl font-extrabold text-xs btn-3d shadow-3d-green hover:bg-brand-green-hover transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return children;
};

// Verification page route guard
const VerificationRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.emailVerified) {
    if (!user.isOnboarded) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Onboarding page route guard
const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (user.isOnboarded) return <Navigate to="/dashboard" replace />;
  return children;
};

// Public-only route (redirect to dashboard/verification/onboarding if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) {
    if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
    if (!user.isOnboarded) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <React.Suspense fallback={<FullPageLoader />}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><AuthPages /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><AuthPages /></PublicRoute>} />

      {/* Verification & Resend Verification */}
      <Route path="/verify-email" element={<VerificationRoute><VerifyEmailPage /></VerificationRoute>} />
      <Route path="/verify-email/:token" element={<VerificationRoute><VerifyEmailPage /></VerificationRoute>} />
      <Route path="/resend-verification" element={<PublicRoute><ResendVerificationPage /></PublicRoute>} />
      
      {/* Onboarding Flow */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Password reset — public */}
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Protected Learner Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
      <Route path="/lesson/:id" element={<ProtectedRoute><LessonRunner /></ProtectedRoute>} />
      <Route path="/practice" element={<ProtectedRoute><Practice /></ProtectedRoute>} />
      <Route path="/ai-tutor" element={<ProtectedRoute><AITutor /></ProtectedRoute>} />
      <Route path="/ai-conversation" element={<ProtectedRoute><AIConversation /></ProtectedRoute>} />
      <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
      <Route path="/buy-gems" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      
      {/* Protected Admin Routes */}
      <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </React.Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <LearningProvider>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster position="top-center" reverseOrder={false} />
        </LearningProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
