import React from 'react';

// ===== SKELETON LOADER =====
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

// ===== FULL PAGE SPINNER =====
export const FullPageLoader = () => (
  <div className="min-h-screen bg-brand-light flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      <span className="font-extrabold text-brand-dark/40 text-sm tracking-wide">Loading LingoLeap...</span>
    </div>
  </div>
);

// ===== PROGRESS BAR =====
export const ProgressBar = ({ value, max, color = 'brand-green', className = '' }) => {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className={`w-full bg-brand-gray/40 rounded-full overflow-hidden ${className}`} style={{ height: '14px' }}>
      <div
        className={`h-full bg-${color} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ===== XP BADGE (floating pop animation) =====
export const XPBadge = ({ xp }) => (
  <span className="inline-flex items-center gap-1 bg-brand-yellow/20 border-2 border-brand-yellow/40 text-brand-orange font-extrabold text-xs rounded-full px-2.5 py-1 xp-pop">
    ⚡ +{xp} XP
  </span>
);

// ===== STAT CARD =====
export const StatCard = ({ icon, value, label, gradient, className = '' }) => (
  <div className={`bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-5 flex flex-col items-center gap-1.5 shadow-3d-card card-hover ${className}`}>
    <div className="mb-0.5">{icon}</div>
    <span className="text-2xl font-extrabold text-text-main">{value}</span>
    <span className="text-[11px] font-bold text-brand-dark/40 uppercase tracking-widest">{label}</span>
  </div>
);

// ===== LEVEL BADGE =====
export const LevelBadge = ({ level, size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg'
  };
  return (
    <div className={`${sizes[size]} rounded-2xl bg-gradient-to-br from-brand-purple to-purple-600 flex items-center justify-center font-extrabold text-white border-2 border-white shadow-3d-purple`}>
      {level}
    </div>
  );
};

// ===== ACHIEVEMENT TOAST CARD (used inside toast notifications) =====
export const AchievementToastCard = ({ name, icon }) => (
  <div className="flex items-center gap-3 bg-gradient-to-r from-brand-yellow/20 to-yellow-50 border-2 border-brand-yellow/50 rounded-2xl p-3 shadow-lg">
    <span className="text-3xl">{icon}</span>
    <div>
      <p className="text-xs font-extrabold text-brand-orange uppercase tracking-wide">Achievement Unlocked!</p>
      <p className="font-extrabold text-text-main text-sm">{name}</p>
    </div>
  </div>
);

// ===== LANGUAGE FLAG BADGE =====
const langFlags = { Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧', German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹' };
export const LanguageBadge = ({ language, size = 'sm' }) => (
  <span className={`inline-flex items-center gap-1 bg-brand-blue/10 border border-brand-blue/20 rounded-full font-bold text-brand-blue ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
    {langFlags[language]} {language}
  </span>
);
