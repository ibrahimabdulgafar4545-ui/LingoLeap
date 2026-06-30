import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/common/AppLayout';
import { Trophy, Target, Sparkles, User, LogOut, Camera, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await api.get('/learning/profile-insights');
        if (res.data && res.data.insights) {
          setInsights(res.data.insights);
        }
      } catch (e) {
        console.error('Failed to load profile insights:', e);
      } finally {
        setLoadingInsights(false);
      }
    };
    fetchInsights();
  }, []);

  if (!user) return null;

  const level = user.level || 1;
  const xp = user.xp || 0;
  const xpNeeded = level * 100;
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);

  const todayXp = user.todayXp || 0; // Or calculate from recentActivity if not available
  const dailyGoal = user.dailyGoalXp || 20;
  const goalPct = Math.min(100, (todayXp / dailyGoal) * 100);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-1">Profile</h1>
        <p className="text-text-secondary font-semibold text-sm">Your learning journey at a glance</p>
      </div>

      <div className="max-w-2xl flex flex-col gap-6">

        {/* ── Hero Profile Card ── */}
        <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-6 text-white shadow-3d-primary relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 relative z-10 text-center sm:text-left">
            {/* Avatar with edit button */}
            <div className="relative flex-shrink-0">
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-4 border-white/40 object-cover bg-white/20 shadow-lg"
                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`; }}
              />
              <button
                onClick={() => navigate('/settings')}
                className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-white dark:bg-bg-card text-primary rounded-full p-1.5 shadow-lg border-2 border-white/80 hover:bg-bg-main transition cursor-pointer"
                title="Change profile photo"
              >
                <Camera size={12} className="text-primary" />
              </button>
            </div>

            <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start w-full">
              <h2 className="text-xl sm:text-2xl font-extrabold truncate w-full">{user.username}</h2>
              <p className="text-white/70 text-xs sm:text-sm font-semibold truncate w-full">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-2 bg-white/10 px-3 py-1 rounded-xl border border-white/15">
                <span className="text-base sm:text-xl leading-none">{langFlags[user.targetLanguage]}</span>
                <span className="text-xs font-bold text-white/90">Studying {user.targetLanguage}</span>
              </div>
            </div>

            {/* League badge */}
            <div className="flex-shrink-0 bg-white/20 border border-white/30 rounded-2xl px-3.5 py-1.5 text-center flex sm:flex-col items-center gap-1 sm:gap-0.5 mt-1 sm:mt-0">
              <Trophy size={16} className="text-white flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider">{user.league || 'Bronze'} League</span>
            </div>
          </div>

          {/* Level XP Bar */}
          <div className="mt-5 relative z-10">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-white/70">Level {level}</span>
              <span className="text-xs font-bold text-white/70">{xp.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="h-3 bg-white dark:bg-bg-card rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${xpPct}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 animate-pulse" />
              </div>
            </div>
            <p className="text-xs text-white/60 font-semibold mt-1">{xpNeeded - xp} XP to Level {level + 1}</p>
          </div>
        </div>

        {/* ── Today's Progress ── */}
        <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-4 sm:p-5 shadow-3d-card">
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} className="text-primary" />
            <h3 className="font-extrabold text-text-main text-sm">Today's Goal</h3>
            <span className="ml-auto text-xs font-extrabold text-primary">{todayXp} / {dailyGoal} XP</span>
          </div>
          <div className="w-full bg-border dark:bg-border/20 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
              style={{ width: `${goalPct}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary font-semibold mt-1.5">
            {goalPct >= 100 ? '🎉 Daily goal reached!' : `${dailyGoal - todayXp} XP remaining today`}
          </p>
        </div>

        {/* ── AI Learning Insights ── */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-3xl border-2 border-indigo-200/40 p-5 sm:p-6 shadow-3d-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <h3 className="font-extrabold text-indigo-950 dark:text-indigo-200 text-sm sm:text-base mb-4 flex items-center gap-2 relative z-10">
            <Sparkles size={18} className="text-indigo-500 animate-pulse" /> AI Tutor Insights
          </h3>
          
          {loadingInsights ? (
            <div className="flex justify-center py-6">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : insights ? (
            <div className="flex flex-col gap-4 relative z-10">
              <div>
                <h4 className="text-[10px] sm:text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1.5">🌟 Key Strengths</h4>
                <ul className="flex flex-col gap-1.5">
                  {insights.strongAreas?.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm font-bold text-indigo-900/80 dark:text-indigo-200/80 flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5 font-black">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-indigo-200/30 pt-3">
                <h4 className="text-[10px] sm:text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-1.5">🎯 Areas to Review</h4>
                <ul className="flex flex-col gap-1.5">
                  {insights.weakAreas?.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm font-bold text-purple-900/80 dark:text-purple-200/80 flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5 font-black">!</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-indigo-200/30 pt-3">
                <h4 className="text-[10px] sm:text-xs font-black text-pink-700 dark:text-pink-400 uppercase tracking-wider mb-1.5">🚀 Next Action Plan</h4>
                <ul className="flex flex-col gap-1.5">
                  {insights.recommendations?.map((item, idx) => (
                    <li key={idx} className="text-xs sm:text-sm font-bold text-pink-900/80 dark:text-pink-200/80 flex items-start gap-2">
                      <span className="text-pink-500 mt-0.5 font-black">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-text-secondary">Could not load insights at this time. Start practicing to generate stats!</p>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-3 sm:p-4 text-center shadow-3d-card">
            <div className="flex justify-center mb-1.5 sm:mb-2"><span className="text-2xl">❤️</span></div>
            <p className="text-lg sm:text-xl font-extrabold text-text-main">{((user.hearts && typeof user.hearts === 'object') ? user.hearts.current : user.hearts) || 0}</p>
            <p className="text-[10px] sm:text-xs font-bold text-text-secondary">Hearts</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-3 sm:p-4 text-center shadow-3d-card">
            <div className="flex justify-center mb-1.5 sm:mb-2"><span className="text-2xl">💎</span></div>
            <p className="text-lg sm:text-xl font-extrabold text-text-main">{user.gems || 0}</p>
            <p className="text-[10px] sm:text-xs font-bold text-text-secondary">Gems</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-3 sm:p-4 text-center shadow-3d-card">
            <div className="flex justify-center mb-1.5 sm:mb-2"><span className="text-2xl">👥</span></div>
            <p className="text-lg sm:text-xl font-extrabold text-text-main">{user.friendsCount || user.friends?.length || 0}</p>
            <p className="text-[10px] sm:text-xs font-bold text-text-secondary">Friends</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-2xl p-3 sm:p-4 text-center shadow-3d-card">
            <div className="flex justify-center mb-1.5 sm:mb-2"><span className="text-2xl">🏆</span></div>
            <p className="text-lg sm:text-xl font-extrabold text-text-main">{user.achievements?.length || 0}</p>
            <p className="text-[10px] sm:text-xs font-bold text-text-secondary">Achievements</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-2xl p-3 sm:p-4 text-center shadow-3d-card">
            <div className="flex justify-center mb-1.5 sm:mb-2"><span className="text-2xl">🔥</span></div>
            <p className="text-lg sm:text-xl font-extrabold text-text-main">{user.streakCount || 0}</p>
            <p className="text-[10px] sm:text-xs font-bold text-text-secondary">Day Streak</p>
          </div>
        </div>

        {/* ── Account Info ── */}
        <div className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-5 sm:p-6 shadow-3d-card">
          <h3 className="font-extrabold text-text-main text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
            <User size={20} className="text-secondary" /> Account Info
          </h3>
          <div className="flex flex-col gap-1 sm:gap-2">
            {[
              { label: 'Username', value: user.username },
              { label: 'Email', value: user.email },
              { label: 'Daily Goal', value: `${user.dailyGoalXp || 20} XP/day` },
              { label: 'Learning', value: `${langFlags[user.targetLanguage]} ${user.targetLanguage}` },
              { label: 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b border-border dark:border-border last:border-0 gap-0.5 sm:gap-4">
                <span className="text-xs sm:text-sm font-bold text-text-secondary">{item.label}</span>
                <span className="text-xs sm:text-sm font-extrabold text-text-main truncate max-w-full">{item.value}</span>
              </div>
            ))}
          </div>
          {user.role === 'admin' && (
            <Button
              variant="custom"
              onClick={() => navigate('/admin')}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-purple-500/10 text-purple-500 border-2 border-purple-500/20 py-2.5 rounded-2xl font-extrabold text-xs hover:bg-purple-500/20 transition cursor-pointer"
            >
              <ShieldAlert size={14} /> Admin Panel
            </Button>
          )}

          <Button
            variant="custom"
            onClick={() => navigate('/settings')}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-secondary/10 text-secondary border-2 border-secondary/20 py-2.5 rounded-2xl font-extrabold text-xs hover:bg-secondary/20 transition cursor-pointer"
          >
            <Camera size={14} /> Edit Profile & Settings
          </Button>
          
          <Button
            variant="custom"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border-2 border-red-500/20 py-2.5 rounded-2xl font-extrabold text-xs hover:bg-red-500/20 transition cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
