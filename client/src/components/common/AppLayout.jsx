import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../navigation/Sidebar';
import BottomNavbar from '../navigation/BottomNavbar';
import NotificationBell from '../navigation/NotificationBell';
import LingoLeapLogo from './LingoLeapLogo';
import { useLearning } from '../../context/LearningContext';
import { useAuth } from '../../context/AuthContext';
import { WifiOff, CloudLightning, Gem, Heart, Sun, Moon, LogOut } from 'lucide-react';

const AppLayout = ({ children, noPadding = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = React.useState(() => document.documentElement.classList.contains('dark'));

  React.useEffect(() => {
    const handleThemeChange = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const isDark = !darkMode;
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      window.dispatchEvent(new Event('themechange'));
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      window.dispatchEvent(new Event('themechange'));
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex flex-col font-sans">

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar />
        
        {/* Main Content Area Wrapper */}
        <div className="md:ml-64 flex-grow flex flex-col min-h-screen">
          {/* Global Sticky Top Header */}
          <header className="sticky top-0 bg-white/80 dark:bg-bg-card/85 backdrop-blur-md border-b-2 border-border dark:border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 transition-all">
            {/* Left: Mobile-only brand identifier */}
            <div className="flex items-center gap-2">
              <div 
                onClick={() => navigate('/dashboard')}
                className="md:hidden flex items-center cursor-pointer hover:opacity-90 animate-fade-in"
              >
                <LingoLeapLogo size={28} variant="compact" concept="gecko" animated={true} />
              </div>
            </div>

            {/* Right: Theme switch + Notification bell + Stats */}
            <div className="flex items-center gap-3 ml-auto">
              {user && (
                <div className="flex items-center gap-2">
                  {/* Gems Display */}
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-[11px] font-black border border-amber-500/20 shadow-sm">
                    <Gem size={11} className="fill-current text-amber-500" />
                    <span>{user.gems ?? 0}</span>
                  </div>

                  {/* Hearts Display */}
                  <div className="flex items-center gap-1 bg-brand-red/10 text-brand-red px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-[11px] font-black border border-brand-red/20 shadow-sm">
                    <Heart size={11} className="fill-current text-brand-red animate-pulse" />
                    <span>{((user.hearts && typeof user.hearts === 'object') ? user.hearts.current : user.hearts) ?? 5}</span>
                  </div>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 border-2 border-border dark:border-border0 dark:border-border/40 hover:border-primary/40 rounded-full text-brand-dark/70 dark:text-white/80 bg-white/50 dark:bg-bg-card hover:bg-primary/5 dark:hover:bg-primary/10 transition shadow-sm cursor-pointer flex items-center justify-center"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-brand-purple" />}
              </button>

              {/* Notification Bell Dropdown */}
              <NotificationBell />

              {/* Mobile Profile Link */}
              {user && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 cursor-pointer border border-primary/20 hover:border-primary/50 rounded-full p-0.5 transition"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full border border-primary/10 object-cover bg-bg-main"
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`; }}
                  />
                </button>
              )}
            </div>
          </header>
 
          {/* Actual Page Render Component */}
          <main className={`flex-grow ${
            noPadding 
              ? 'p-0 pb-[58px] md:pb-8 md:px-8 md:py-6' 
              : 'pb-24 pt-4 px-3 md:pb-8 md:px-8 md:py-6'
          }`}>

            {children}
          </main>
        </div>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default AppLayout;
