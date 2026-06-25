import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Zap, Bot, User } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

const bottomNavItems = [
  { to: '/dashboard', icon: <LayoutDashboard size={20} />, key: 'dashboard' },
  { to: '/learn', icon: <BookOpen size={20} />, key: 'learn' },
  { to: '/practice', icon: <Zap size={20} />, key: 'practice' },
  { to: '/ai-tutor', icon: <Bot size={20} />, key: 'ai_tutor' },
  { to: '/profile', icon: <User size={20} />, key: 'profile' },
];

const BottomNavbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-bg-card border-t border-border/80 dark:border-border z-40 flex items-center justify-around px-2 py-2.5 safe-area-bottom shadow-lg">
      {bottomNavItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all duration-150 flex-1 ${
              isActive 
                ? 'text-primary scale-105' 
                : 'text-text-secondary/70 dark:text-text-secondary hover:text-text-main'
            }`
          }
        >
          <div className="flex items-center justify-center">
            {item.icon}
          </div>
          <span className="text-[9px] font-black tracking-wide uppercase">{t(item.key)}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavbar;
