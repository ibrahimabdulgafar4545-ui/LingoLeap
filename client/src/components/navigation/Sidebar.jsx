import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import Button from '../common/Button';
import {
  LayoutDashboard, BookOpen, Zap, Trophy, BarChart2,
  User, Settings, LogOut, Bot, ShoppingCart, Gem, Users, ShieldAlert, Globe
} from 'lucide-react';
import LingoLeapLogo from '../common/LingoLeapLogo';

const navItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={22} />, key: 'dashboard' },
  { to: '/learn', icon: <BookOpen size={22} />, key: 'learn' },
  { to: '/practice', icon: <Zap size={22} />, key: 'practice' },
  { to: '/ai-conversation', icon: <Globe size={22} />, key: 'ai_conversation' },
  { to: '/achievements', icon: <Trophy size={22} />, key: 'achievements' },
  { to: '/leaderboard', icon: <BarChart2 size={22} />, key: 'leaderboard' },
  { to: '/friends', icon: <Users size={22} />, key: 'friends' },
  { to: '/shop', icon: <ShoppingCart size={22} />, key: 'shop' },
  { to: '/profile', icon: <User size={22} />, key: 'profile' },
  { to: '/settings', icon: <Settings size={22} />, key: 'settings' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen border-r-2 border-border dark:border-border bg-white dark:bg-bg-card fixed left-0 top-0 bottom-0 z-30 py-6 px-4">
      {/* Logo */}
      <div className="mb-10 px-2">
        <div className="cursor-pointer" onClick={() => navigate('/dashboard')}>
          <LingoLeapLogo size={40} variant="main" concept="gecko" animated={true} />
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 flex-1">
        {(() => {
          const items = [...navItems];
          if (user && user.role === 'admin') {
            items.push({ to: '/admin', icon: <ShieldAlert size={22} className="text-secondary" />, key: 'admin_panel' });
          }
          return items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-2 border-primary/20'
                    : 'text-text-secondary hover:bg-bg-main/50 dark:hover:bg-bg-main/10 hover:text-text-main border-2 border-transparent'
                }`
              }
            >
              {item.icon}
              {t(item.key)}
            </NavLink>
          ));
        })()}
      </nav>

      {/* User Info */}
      {user && (
        <div className="mt-4 border-t-2 border-border dark:border-border pt-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-10 h-10 rounded-full border-2 border-primary/30 object-cover bg-bg-main"
              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`; }}
            />
            <div className="min-w-0">
              <p className="font-extrabold text-text-main text-sm truncate">{user.username}</p>
              <p className="text-xs text-text-secondary font-semibold flex items-center gap-1">
                {user.xp || 0} XP · Level {user.level || 1}
                {user.gems !== undefined && (
                  <span className="ml-1 flex items-center gap-0.5 text-secondary">
                    · <Gem size={11} /> {user.gems}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button
            variant="custom"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition border-2 border-transparent cursor-pointer"
          >
            <LogOut size={18} />
            {t('log_out')}
          </Button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
