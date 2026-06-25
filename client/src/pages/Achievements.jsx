import React from 'react';
import AppLayout from '../components/common/AppLayout';
import { Trophy, Flame, Zap, Lock, Sparkles, Star, Users, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';

export const allAchievements = [
  { id: 'first_lesson', name: 'First Lesson', description: 'Complete your first lesson', icon: '🎉', requireType: 'lessons', requireValue: 1, reward: 25 },
  { id: 'xp_100', name: '100 XP Earned', description: 'Earn 100 total XP', icon: '⚡', requireType: 'xp', requireValue: 100, reward: 50 },
  { id: 'streak_7', name: '7 Day Streak', description: 'Study for 7 days in a row', icon: '🔥', requireType: 'streak', requireValue: 7, reward: 100 },
  { id: 'streak_30', name: '30 Day Streak', description: 'Study for 30 days in a row', icon: '👑', requireType: 'streak', requireValue: 30, reward: 250 },
  { id: 'unit_1', name: 'Complete Unit 1', description: 'Complete 4 lessons', icon: '📚', requireType: 'lessons', requireValue: 4, reward: 50 },
  { id: 'lessons_10', name: 'Complete 10 Lessons', description: 'Complete 10 lessons', icon: '⭐', requireType: 'lessons', requireValue: 10, reward: 100 },
  { id: 'lessons_50', name: 'Complete 50 Lessons', description: 'Complete 50 lessons', icon: '🏆', requireType: 'lessons', requireValue: 50, reward: 300 },
  { id: 'xp_500', name: 'Earn 500 XP', description: 'Earn 500 total XP', icon: '🌟', requireType: 'xp', requireValue: 500, reward: 150 },
  { id: 'xp_1000', name: 'Earn 1000 XP', description: 'Earn 1000 total XP', icon: '💎', requireType: 'xp', requireValue: 1000, reward: 300 },
  { id: 'join_leaderboard', name: 'Join Leaderboard', description: 'Earn weekly XP to rank', icon: '⚔️', requireType: 'weeklyXp', requireValue: 1, reward: 50 },
  { id: 'first_ai_conv', name: 'AI Tutor Conversation', description: 'Send a message to the AI Tutor', icon: '🤖', requireType: 'aiMessages', requireValue: 1, reward: 50 }
];

const Achievements = () => {
  const { user } = useAuth();
  const { learningState, fetchLearningState, lessons } = useLearning();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    fetchLearningState();
  }, []);

  const completedLessons = lessons.filter(l => l.isCompleted).length;

  const getProgress = (achievement) => {
    if (!user) return { current: 0, earned: false, pct: 0 };
    let current = 0;
    if (achievement.requireType === 'xp') current = user.xp || 0;
    if (achievement.requireType === 'streak') current = user.streakCount || 0;
    if (achievement.requireType === 'lessons') current = completedLessons;
    if (achievement.requireType === 'weeklyXp') current = user.weeklyXp || 0;
    if (achievement.requireType === 'aiMessages') current = (user.recentActivity || []).filter(a => a.type === 'ai_chat').length > 0 ? 1 : 0;
    
    const earned = current >= achievement.requireValue;
    const pct = Math.min(Math.round((current / achievement.requireValue) * 100), 100);
    return { current, earned, pct };
  };

  const earned = allAchievements.filter(a => getProgress(a).earned);
  const locked = allAchievements.filter(a => !getProgress(a).earned);
  const completionPercentage = allAchievements.length > 0 ? Math.round((earned.length / allAchievements.length) * 100) : 0;

  return (
    <AppLayout>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-text-main tracking-tight mb-1">Your Achievements</h1>
        <p className="text-brand-dark/50 font-semibold text-xs sm:text-sm">Challenge yourself and earn gems by unlocking accomplishments!</p>
      </div>

      {/* Statistics Header Banner */}
      <div className="bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-3xl p-4 sm:p-6 shadow-3d-card mb-6 sm:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
          <div className="flex items-center gap-3 sm:gap-4 border-b-2 md:border-b-0 md:border-r-2 border-border dark:border-border pb-3 sm:pb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-extrabold text-text-main">{earned.length} / {allAchievements.length}</p>
              <p className="text-[10px] sm:text-xs font-bold text-brand-dark/40 uppercase tracking-wide">Achievements Earned</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 border-b-2 md:border-b-0 md:border-r-2 border-border dark:border-border pb-3 sm:pb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange flex-shrink-0">
              <Flame className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-extrabold text-text-main">{user?.streakCount || 0} days</p>
              <p className="text-[10px] sm:text-xs font-bold text-brand-dark/40 uppercase tracking-wide">Current Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 pb-1 md:pb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-grow">
              <p className="text-lg sm:text-2xl font-extrabold text-text-main">{completionPercentage}%</p>
              <p className="text-[10px] sm:text-xs font-bold text-brand-dark/40 uppercase tracking-wide">Completion Mastery</p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-5 w-full bg-brand-gray/30 rounded-full h-2.5 sm:h-3.5 overflow-hidden border border-border dark:border-border">
          <div className="h-full bg-gradient-to-r from-brand-purple to-violet-500 rounded-full transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
        </div>
      </div>

      {/* Unlocked Achievements Section */}
      {earned.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-extrabold text-text-main mb-4 flex items-center gap-2">
            <CheckCircle className="text-brand-green w-5 h-5 sm:w-6 sm:h-6" /> Unlocked ({earned.length})
          </h2>
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {earned.map((ach) => (
                <div key={ach.id} className="bg-gradient-to-br from-brand-yellow/5 to-yellow-50/20 border-2 border-brand-yellow/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm">
                  <div className="w-11 h-11 rounded-full bg-white dark:bg-bg-card border border-brand-yellow/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">{ach.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-text-main text-xs truncate">{ach.name}</p>
                    <p className="text-[10px] text-brand-dark/50 font-semibold mt-0.5 leading-tight">{ach.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-black text-brand-purple">💎 +{ach.reward}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider bg-brand-green/10 text-brand-green px-2 py-0.5 rounded-md border border-brand-green/20">
                      Earned
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {earned.map((ach) => (
                <div key={ach.id} className="bg-gradient-to-br from-brand-yellow/15 to-yellow-50/50 border-2 border-brand-yellow/30 rounded-3xl p-5 text-center shadow-3d-card relative group hover:-translate-y-0.5 transition-transform duration-300">
                  <div className="absolute top-3 right-3 text-xs font-extrabold text-brand-purple">💎 +{ach.reward}</div>
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-bg-card border-2 border-brand-yellow/40 flex items-center justify-center mx-auto mb-3 text-3xl shadow-sm">{ach.icon}</div>
                  <p className="font-extrabold text-text-main text-base">{ach.name}</p>
                  <p className="text-xs text-brand-dark/50 font-semibold mt-1.5">{ach.description}</p>
                  <div className="mt-4 text-[10px] font-extrabold uppercase tracking-wide bg-brand-green/10 text-brand-green px-3 py-1 rounded-full inline-block">
                    Earned
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Locked Achievements Section */}
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-text-main mb-4 flex items-center gap-2">
          <Lock className="text-brand-dark/40 w-4.5 h-4.5 sm:w-5 sm:h-5" /> In Progress ({locked.length})
        </h2>
        {isMobile ? (
          <div className="flex flex-col gap-3">
            {locked.map((ach) => {
              const { current, pct } = getProgress(ach);
              return (
                <div key={ach.id} className="bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-light border border-border dark:border-border flex items-center justify-center text-brand-dark/30 flex-shrink-0">
                      <Lock size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-text-main text-xs truncate">{ach.name}</p>
                      <p className="text-[10px] text-brand-dark/40 font-semibold leading-tight mt-0.5">{ach.description}</p>
                    </div>
                    <span className="text-[10px] font-black text-brand-purple flex-shrink-0">💎 +{ach.reward}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-brand-gray/20 rounded-full h-2 border border-border dark:border-border">
                      <div className="h-full bg-brand-green/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-text-secondary/60 shrink-0">{current} / {ach.requireValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locked.map((ach) => {
              const { current, pct } = getProgress(ach);
              return (
                <div key={ach.id} className="bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 text-center shadow-3d-card flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-300">
                  <div>
                    <div className="w-16 h-16 rounded-full bg-brand-light border-2 border-border dark:border-border flex items-center justify-center mx-auto mb-3 text-brand-dark/30">
                      <Lock size={24} />
                    </div>
                    <p className="font-extrabold text-text-main text-base">{ach.name}</p>
                    <p className="text-xs text-brand-dark/40 font-semibold mt-1.5">{ach.description}</p>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-brand-gray/30 rounded-full h-2 border border-border dark:border-border">
                      <div className="h-full bg-brand-green/60 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-bold text-brand-dark/40">
                      <span>{current} / {ach.requireValue}</span>
                      <span>Reward: 💎 {ach.reward}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Achievements;
