import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Zap, Bot, User, ShieldAlert, Globe } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const bottomNavItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, key: 'dashboard' },
  { to: '/learn', icon: <BookOpen size={18} />, key: 'learn' },
  { to: '/practice', icon: <Zap size={18} />, key: 'practice' },
  { to: '/ai-conversation', icon: <Globe size={18} />, key: 'ai_conversation' },
  { to: '/profile', icon: <User size={18} />, key: 'profile' },
];

const BottomNavbar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Dynamically insert Admin Panel icon if user is admin
  const items = [...bottomNavItems];
  if (user && user.role === 'admin') {
    items.splice(4, 0, { to: '/admin', icon: <ShieldAlert size={18} className="text-secondary" />, key: 'admin_panel' });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-bg-card border-t border-border/80 dark:border-border z-40 flex items-center justify-around px-1.5 py-2 safe-area-bottom shadow-lg">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-all duration-150 flex-1 ${
              isActive 
                ? 'text-primary scale-105 font-black' 
                : 'text-text-secondary/70 dark:text-text-secondary hover:text-text-main'
            }`
          }
        >
          <div className="flex items-center justify-center">
            {item.icon}
          </div>
          <span className="text-[8px] font-black tracking-tight uppercase text-center truncate w-full block">
            {t(item.key)}
          </span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavbar;
