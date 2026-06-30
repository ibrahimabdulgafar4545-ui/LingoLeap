import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLearning } from '../context/LearningContext';
import AppLayout from '../components/common/AppLayout';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  Flame, Zap, Star, Target, BookOpen, Trophy,
  ChevronRight, TrendingUp, Bot, Globe, Gem, ShoppingCart, Users, Activity,
  Heart, CalendarDays, Shield, Gift, Sparkles, CheckCircle2, Award, HeartHandshake, Loader2
} from 'lucide-react';
import Button from '../components/common/Button';
import { socialService } from '../services/socialService';
import LingoLeapLogo from '../components/common/LingoLeapLogo';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// Language flags map
const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

// XP required to reach each level
const xpToNextLevel = (level) => level * level * 100;

const StatCard = ({ icon, value, label, color, bg }) => (
  <motion.div 
    whileHover={{ y: -3, scale: 1.02 }}
    className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border p-4 flex items-center gap-3.5 shadow-sm transition-all duration-200"
  >
    <div className={`p-3 rounded-xl ${bg} ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-text-main leading-none">{value}</p>
      <p className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider mt-1">{label}</p>
    </div>
  </motion.div>
);

const EmptyState = ({ icon, text, action, onClick }) => (
  <div className="text-center py-8 px-4 border-2 border-dashed border-border rounded-2xl bg-bg-main/30 dark:bg-bg-main/5">
    <div className="w-12 h-12 rounded-2xl bg-bg-main dark:bg-bg-card border-2 border-border flex items-center justify-center mx-auto mb-3 text-text-secondary/50">
      {icon}
    </div>
    <p className="text-sm font-bold text-text-secondary leading-relaxed">{text}</p>
    {action && (
      <button onClick={onClick} className="mt-3 text-xs font-black text-secondary hover:text-secondary-hover underline cursor-pointer">
        {action}
      </button>
    )}
  </div>
);

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const { lessons, fetchLessons, learningState, fetchLearningState, claimDailyQuest } = useLearning();
  const navigate = useNavigate();

  const [friendActivity, setFriendActivity] = useState([]);
  const [leagueData, setLeagueData] = useState(null);
  
  // Responsive layout state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Concept selector state (Requirement 8)
  const [activeConcept, setActiveConcept] = useState('gecko');
  const [celebratedIds, setCelebratedIds] = useState(new Set());
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  const [dailyRewardGems, setDailyRewardGems] = useState(0);
  const [loadingLessonId, setLoadingLessonId] = useState(null);

  useEffect(() => {
    if (user && user.dailyLoginRewardClaimedDate) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastSeenPopup = localStorage.getItem('last_seen_daily_login_popup');
      
      if (user.dailyLoginRewardClaimedDate === todayStr && lastSeenPopup !== todayStr) {
        const currentStreak = user.streakCount || 1;
        const rewardGems = 10 + (currentStreak - 1) * 5;
        setDailyRewardGems(rewardGems);
        setShowDailyRewardModal(true);
        localStorage.setItem('last_seen_daily_login_popup', todayStr);
        
        setTimeout(() => {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.65 }
          });
        }, 500);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchLessons(user.targetLanguage);
      fetchLearningState();
      
      socialService.getFriendFeed().then(feed => {
        setFriendActivity(feed.slice(0, 3)); // Show top 3 recent activities
      }).catch(err => console.error("Failed to fetch friend feed:", err));
      
      api.get('/leaderboards/current').then(res => {
        if(res.data) setLeagueData(res.data);
      }).catch(e => console.log('Error fetching league', e));
    }
  }, [user?._id, user?.targetLanguage]);

  if (!user) return null;

  const xp = user.xp || 0;
  const level = user.level || 1;
  const streak = user.streakCount || 0;
  const dailyGoal = user.dailyGoalXp || 20;
  
  const totalLessons = lessons.length;
  const completedCount = lessons.filter(l => l.isCompleted).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const xpNeeded = xpToNextLevel(level);
  const xpProgress = Math.min(Math.round((xp / xpNeeded) * 100), 100);

  // Daily XP earned today
  const todayXp = streak > 0 ? Math.min(xp, dailyGoal) : 0;
  const dailyGoalPct = Math.min(Math.round((todayXp / dailyGoal) * 100), 100);

  // Next unlocked lesson
  const nextLesson = lessons.find(l => !l.isCompleted && !l.isLocked);
  const hearts = (user.hearts && typeof user.hearts === 'object') ? user.hearts : { current: user.hearts ?? 5, max: 5 };
  const quests = learningState?.quests || [];
  const calendar = learningState?.calendar || [];
  const league = learningState?.league?.name || user.league || 'Bronze';

  // Mascot details for the lab showcase (Requirements 1, 2, 8)
  const logoConcepts = {
    gecko: {
      name: "Lingo the Leaping Gecko",
      status: "Official Mascot (Winner)",
      representing: ["Curiosity", "Retention", "Agility", "Progress"],
      badges: ["bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300", "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"],
      description: "Lingo jumps from a speech bubble with curved spine. Wire glasses show learning curiosity, blue headphones denote speech capabilities, and suction toes symbolize vocab retention.",
      rationale: "Selected as the strongest branding design because of its high character appeal, memorable shape, and clever integration of speech, learning, and progress themes."
    },
    fox: {
      name: "Felix the Clever Fox",
      status: "Concept Option B",
      representing: ["Cleverness", "Spoken Confidence", "Logic", "Structure"],
      badges: ["bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300", "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"],
      description: "Felix features a geometric outline fox jumping diagonally in a graduation hat, highlighting speech logic.",
      rationale: "Felt slightly too generic (many platforms use foxes/owls). Geometric construction is premium but lacks the friendly emotional hook of the Gecko."
    },
    hummingbird: {
      name: "Pip the Swift Hummingbird",
      status: "Concept Option C",
      representing: ["Speed", "Rhythm", "Fluidity", "Global Reach"],
      badges: ["bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300", "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"],
      description: "Pip is a high-speed bird flying with wings spread, representing quick conversational fluidity.",
      rationale: "Though highly dynamic and elegant, the hummingbird represents speed, which can run counter to the paced, habit-forming nature of language learning."
    }
  };

  const handleCelebrate = (friendName, id) => {
    if (celebratedIds.has(id)) return;
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.85 }
    });
    setCelebratedIds(prev => new Set([...prev, id]));
    toast.success(`You congratulated ${friendName}! 🎉`, {
      icon: '🙌',
      style: {
        borderRadius: '12px',
        background: '#0F172A',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '12px'
      }
    });
  };

  // ── DEDICATED MOBILE FIRST INTERFACE (Requirement layout) ──
  const MobileDashboardLayout = () => {
    return (
      <div className="flex flex-col gap-4 text-text-main pb-8">
        
        {/* 1. TOP COMPACT HEADER ROW */}
        <div className="flex items-center justify-between gap-2 border-b border-border/80 dark:border-border pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <img 
              src={user.avatarUrl} 
              alt={user.username} 
              className="w-8 h-8 rounded-full border border-primary/20 object-cover bg-bg-main"
              onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`; }}
            />
            <div className="min-w-0">
              <h1 className="text-xs font-black text-text-main leading-tight truncate">Hi, {user.username}! 👋</h1>
              <p className="text-[9px] text-text-secondary font-bold leading-none">{langFlags[user.targetLanguage]} {user.targetLanguage}</p>
            </div>
          </div>
          
          {/* Quick mini-stat pill indicators in a compact layout */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-0.5 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 text-[10px] font-black text-primary">
              <Flame size={11} />
              <span>{streak}</span>
            </div>
            <div className="flex items-center gap-0.5 bg-secondary/10 px-2 py-1 rounded-lg border border-secondary/20 text-[10px] font-black text-secondary">
              <Gem size={10} />
              <span>{user.gems ?? 0}</span>
            </div>
            <div className="flex items-center gap-0.5 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20 text-[10px] font-black text-red-500">
              <Heart size={10} fill="currentColor" />
              <span>{hearts.current}</span>
            </div>
          </div>
        </div>

        {/* 2. CONTINUE LEARNING (FIRST MAJOR CARD - SEEN IMMEDIATELY ABOVE THE FOLD) */}
        {nextLesson ? (
          <div 
            onClick={() => navigate(`/lesson/${nextLesson._id}`)}
            className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-2 right-4 text-white/20 text-5xl font-black select-none pointer-events-none">
              01
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <BookOpen size={13} />
              <span className="font-extrabold text-[9px] tracking-wider uppercase text-white/90">Continue Learning</span>
            </div>
            <h2 className="text-base font-black tracking-tight leading-tight pr-12 truncate">
              {nextLesson.title}
            </h2>
            <p className="text-white/80 text-[10px] font-bold mt-0.5">
              {nextLesson.category} · +{nextLesson.xpReward} XP
            </p>
            
            {/* Minimal progress bar */}
            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div className="bg-white dark:bg-bg-card h-full" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="mt-3.5 flex items-center justify-between">
              <button
                className="bg-white dark:bg-bg-card text-emerald-600 font-black py-2 px-4 rounded-xl text-[10px] shadow-sm cursor-pointer hover:bg-white/90"
              >
                START LESSON
              </button>
              <span className="text-[9px] font-extrabold text-white/85">
                {completedCount}/{totalLessons} Lessons
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md">
            <h2 className="text-base font-black">🎉 Curricula Mastered!</h2>
            <p className="text-xs text-white/80 mt-1">Review core subjects in practice sessions.</p>
            <button
              onClick={() => navigate('/practice')}
              className="mt-3 bg-white dark:bg-bg-card text-blue-600 font-black py-2 px-4 rounded-xl text-[10px] cursor-pointer"
            >
              GO TO PRACTICE
            </button>
          </div>
        )}

        {/* 3. COMPACT DASHBOARD CONTENT */}
        <div className="flex flex-col gap-3">
          
          {/* Staked Goal and Progress card metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Daily Goal */}
            <div className="bg-white dark:bg-bg-card rounded-2xl border border-border p-3 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black text-text-main mb-1.5">
                <span className="flex items-center gap-1 text-[11px]"><Target size={11} className="text-emerald-500" /> Goal</span>
                <span className="text-[9px] text-text-secondary">{todayXp}/{dailyGoal} XP</span>
              </div>
              <div className="w-full bg-bg-main dark:bg-bg-main/20 rounded-full h-2 overflow-hidden border border-border">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-blue-500" style={{ width: `${dailyGoalPct}%` }} />
              </div>
            </div>
            
            {/* Level Progress */}
            <div className="bg-white dark:bg-bg-card rounded-2xl border border-border p-3 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black text-text-main mb-1.5">
                <span className="flex items-center gap-1 text-[11px]"><TrendingUp size={11} className="text-blue-500" /> Level {level}</span>
                <span className="text-[9px] text-text-secondary">{xpProgress}%</span>
              </div>
              <div className="w-full bg-bg-main dark:bg-bg-main/20 rounded-full h-2 overflow-hidden border border-border">
                <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>

          {/* Compact Calendar heatmap (14 days representation) */}
          <div className="bg-white dark:bg-bg-card rounded-2xl border border-border p-3 shadow-sm">
            <div className="flex items-center gap-1 mb-2 text-[11px] font-black text-text-main">
              <CalendarDays size={13} className="text-secondary" />
              <span>Streak Calendar</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 p-1 bg-bg-main/30 dark:bg-bg-main/5 border border-border rounded-xl">
              {Array.from({ length: 14 }).map((_, offset) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - offset));
                const key = date.toISOString().slice(0, 10);
                const day = calendar.find(d => d.date === key);
                const active = (day?.lessons || 0) > 0;
                return (
                  <div
                    key={key}
                    className={`aspect-square rounded border transition-colors ${
                      active ? 'bg-primary border-primary' : 'bg-bg-main dark:bg-bg-main/25 border-border dark:border-border'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Leaderboard status */}
          <div 
            onClick={() => navigate('/leaderboard')}
            className="bg-white dark:bg-bg-card rounded-2xl border border-border p-3 shadow-sm flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Trophy size={15} className="text-amber-500" />
              <div>
                <h4 className="text-[11px] font-black text-text-main">Leaderboard</h4>
                <p className="text-[9px] text-text-secondary font-bold leading-none mt-0.5">
                  {leagueData ? `${leagueData.league} League` : 'Bronze League'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-primary">
                {leagueData ? `#${leagueData.currentRank}` : '#1'}
              </span>
              <ChevronRight size={13} className="text-text-secondary" />
            </div>
          </div>

          {/* Friends Activity Feed */}
          <div className="bg-white dark:bg-bg-card rounded-2xl border border-border p-3 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-black text-text-main pb-1">
              <span className="flex items-center gap-1"><Users size={13} className="text-secondary" /> Friend Feed</span>
              <span onClick={() => navigate('/friends')} className="text-[9px] text-secondary cursor-pointer hover:underline">View All</span>
            </div>
            
            <div className="space-y-2">
              {friendActivity.length === 0 ? (
                <p className="text-[9px] text-text-secondary font-bold text-center py-2">Find friends on search page.</p>
              ) : (
                friendActivity.slice(0, 2).map((act, index) => {
                  const hasCelebrated = celebratedIds.has(act._id);
                  return (
                    <div key={act._id || `act-${index}`} className="flex items-center gap-2 p-2 bg-bg-main/20 dark:bg-bg-main/5 border border-border rounded-xl">
                      <img 
                        src={act.user.avatarUrl} 
                        alt="" 
                        className="w-6.5 h-6.5 rounded-full object-cover"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${act.user.username}`; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-text-main leading-tight truncate">
                          <span className="font-extrabold">{act.user.username}</span> {act.message.toLowerCase()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCelebrate(act.user.username, act._id)}
                        disabled={hasCelebrated}
                        className={`text-[8.5px] font-black px-2 py-0.5 rounded-md border ${
                          hasCelebrated 
                            ? 'bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900' 
                            : 'bg-white dark:bg-bg-card text-text-secondary border-border hover:border-primary'
                        }`}
                      >
                        {hasCelebrated ? '✓' : '🎉'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Branding Design Lab Showcase (Fully Responsive) */}
          <div className="bg-white dark:bg-bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="text-emerald-600 animate-pulse" size={16} />
                <h2 className="font-black text-text-main text-sm">Branding Design Lab</h2>
              </div>
              <p className="text-[10px] text-text-secondary font-bold mt-1">
                Explore the mascot design concepts. Click to trigger their Framer Motion animations on mobile!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-bg-main dark:bg-bg-main/30 p-1 rounded-xl border border-border">
              {Object.keys(logoConcepts).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveConcept(key)}
                  className={`py-1.5 rounded-lg font-black text-[10px] text-center transition cursor-pointer select-none ${
                    activeConcept === key
                      ? 'bg-white dark:bg-bg-card border border-border text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  {key === 'gecko' ? '🦎 Gecko' : key === 'fox' ? '🦊 Fox' : '🐦 Bird'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeConcept}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4 items-center"
              >
                <div className="w-full flex flex-col items-center justify-center p-4 border border-border bg-bg-main/40 dark:bg-bg-main/5 rounded-xl relative">
                  <LingoLeapLogo size={80} concept={activeConcept} variant="compact" animated={true} />
                  <span className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest mt-2">Live SVG Concept</span>
                  {activeConcept === 'gecko' && (
                    <div className="absolute top-2 right-2 bg-primary/20 text-primary border border-primary/30 font-black text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">Winner</div>
                  )}
                </div>

                <div className="w-full space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded border ${
                      activeConcept === 'gecko' ? 'bg-emerald-100 text-emerald-850 border-emerald-250 dark:bg-emerald-950/60 dark:text-emerald-350' : 'bg-bg-main text-text-secondary border-border dark:bg-bg-card'
                    }`}>{logoConcepts[activeConcept].status}</span>
                    <h3 className="text-xs font-black text-text-main">{logoConcepts[activeConcept].name}</h3>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {logoConcepts[activeConcept].representing.map((v, i) => (
                      <span key={`${v}-${i}`} className={`text-[8px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${logoConcepts[activeConcept].badges[i]}`}>{v}</span>
                    ))}
                  </div>

                  <p className="text-[10px] text-text-secondary font-bold leading-relaxed">{logoConcepts[activeConcept].description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    );
  };

  // ── DEDICATED DESKTOP INTERFACE (Original Layout) ──
  const DesktopDashboardLayout = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main learning path left column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Greeting Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-8 shadow-sm relative overflow-hidden flex items-center gap-6"
          >
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex-1 z-10">
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-black tracking-wide uppercase mb-3.5">
                <Sparkles size={12} /> Premium Learning Hub
              </span>
              <h1 className="text-4xl font-black text-text-main tracking-tight leading-[1.1]">
                Ready to leap, <span className="text-primary">{user.username}</span>?
              </h1>
              <p className="text-sm text-text-secondary font-bold mt-2.5 max-w-md leading-relaxed">
                {streak > 0 
                  ? `Your flame is burning bright! Keep that ${streak}-day streak going strong today.` 
                  : "Start a wonderful habit today. Complete a lesson to kick off your streak calendar!"}
              </p>
              
              <div className="mt-5 flex items-center gap-2 bg-bg-main dark:bg-bg-main/30 border border-border w-fit px-3 py-1.5 rounded-xl">
                <span className="text-xl">{langFlags[user.targetLanguage]}</span>
                <span className="text-xs font-black text-text-main uppercase tracking-wider">Learning {user.targetLanguage}</span>
              </div>
            </div>

            {/* Waving Mascot Graphic */}
            <div className="w-36 h-36 flex-shrink-0 flex items-center justify-center relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl border-2 border-primary/20">
              <svg 
                viewBox="0 0 100 100" 
                className="w-28 h-28 select-none overflow-visible origin-bottom animate-[bounce_3s_ease-in-out_infinite]"
              >
                <defs>
                  <linearGradient id="greetGeckoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <path d="M 50,75 C 45,72 40,65 35,50 C 30,35 45,25 55,25 C 65,25 70,32 70,40" stroke="url(#greetGeckoGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="55" cy="25" r="12" fill="url(#greetGeckoGrad)" />
                <circle cx="53" cy="22" r="3.5" fill="#FFFFFF" />
                <circle cx="53" cy="22" r="1.2" fill="#0F172A" />
                <circle cx="61" cy="24" r="3.5" fill="#FFFFFF" />
                <circle cx="61" cy="24" r="1.2" fill="#0F172A" />
                <path d="M 48,22 Q 57,28 65,25" stroke="#FFFFFF" strokeWidth="1" fill="none" />
                <path d="M 46,24 A 12 12 0 0 1 64,18" stroke="#3B82F6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <rect x="44.5" y="22.5" width="2" height="4.5" rx="1" fill="#3B82F6" />
                <rect x="63" y="16.5" width="2" height="4.5" rx="1" fill="#3B82F6" />
                <path d="M 64,32 Q 78,20 84,22" stroke="url(#greetGeckoGrad)" strokeWidth="4.5" strokeLinecap="round" fill="none" className="origin-[64px_32px] animate-[wave_1.5s_ease-in-out_infinite_alternate]" />
                <circle cx="84" cy="22" r="2" fill="url(#greetGeckoGrad)" />
                <path d="M 50,75 Q 38,92 50,92 Q 62,92 56,84" stroke="url(#greetGeckoGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 42,48 C 36,44 32,45 28,45" stroke="url(#greetGeckoGrad)" strokeWidth="3" strokeLinecap="round" />
                <circle cx="28" cy="45" r="1.5" fill="url(#greetGeckoGrad)" />
              </svg>
              <style>{`
                @keyframes wave {
                  0% { transform: rotate(-5deg); }
                  100% { transform: rotate(15deg); }
                }
              `}</style>
              <div className="absolute -top-3 -right-3 bg-secondary text-white font-extrabold text-[9px] py-1 px-2 rounded-xl shadow-md border border-white/20">
                Lingo says Hi!
              </div>
            </div>
          </motion.div>

          {/* Continue Learning card */}
          {nextLesson ? (
            <motion.div 
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                setLoadingLessonId(nextLesson._id);
                navigate(`/lesson/${nextLesson._id}`);
              }}
              className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-blue-600 rounded-[2rem] p-8 text-white shadow-3d-primary relative overflow-hidden cursor-pointer group"
            >
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 skew-x-12 translate-x-10 group-hover:bg-white/10 transition-colors pointer-events-none" />
              <div className="absolute top-4 right-6 text-white/30 text-8xl font-black select-none pointer-events-none leading-none opacity-40">
                01
              </div>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-white/20 text-white backdrop-blur-sm">
                  <BookOpen size={20} />
                </div>
                <span className="font-extrabold text-xs tracking-wider uppercase text-white/95">Continue Learning Path</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight leading-tight max-w-md">
                {nextLesson.title}
              </h2>
              <p className="text-white/85 text-xs font-extrabold tracking-wide mt-2">
                {nextLesson.category} · {nextLesson.questions?.length || 0} questions · +{nextLesson.xpReward} XP
              </p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLoadingLessonId(nextLesson._id);
                    navigate(`/lesson/${nextLesson._id}`);
                  }}
                  className="flex items-center gap-2 bg-white dark:bg-bg-card text-emerald-600 hover:text-emerald-700 font-black py-3.5 px-7 rounded-2xl btn-3d shadow-md hover:bg-white/95 text-xs cursor-pointer"
                >
                  {loadingLessonId === nextLesson._id ? (
                    <span className="flex items-center gap-1.5">LOADING <Loader2 size={13} className="animate-spin" /></span>
                  ) : (
                    <span className="flex items-center gap-1.5">START LESSON <ChevronRight size={16} /></span>
                  )}
                </button>
                <span className="text-xs font-black text-white/80">
                  🎯 Next up in your syllabus
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-8 text-white shadow-3d-secondary relative overflow-hidden">
              <h2 className="text-2xl font-black mb-2">🎉 Curricula Complete!</h2>
              <p className="text-white/80 font-bold text-sm mb-4">You have achieved final mastery in {user.targetLanguage}! Review core skills anytime in practice mode.</p>
              <button
                onClick={() => navigate('/practice')}
                className="flex items-center gap-2 bg-white dark:bg-bg-card text-blue-600 hover:text-blue-700 font-black py-3.5 px-6 rounded-2xl btn-3d shadow-md text-xs cursor-pointer animate-pulse"
              >
                GO TO PRACTICE <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Stats Cards grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Zap size={22} />} value={xp} label="Total XP" color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-950/40" />
            <StatCard icon={<Star size={22} />} value={`Lvl ${level}`} label="Current Level" color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/40" />
            <StatCard icon={<BookOpen size={22} />} value={`${completedCount}/${totalLessons}`} label="Lessons Completed" color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-950/40" />
            <StatCard icon={<Trophy size={22} />} value={`${progressPct}%`} label="Overall Progress" color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-950/40" />
          </div>

          {/* Branding Design Lab Showcase */}
          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-8 shadow-sm flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-600" size={22} />
                <h2 className="font-black text-text-main text-xl">Branding Design Lab</h2>
              </div>
              <p className="text-xs text-text-secondary font-bold mt-1">
                Explore the generated design concepts for the LingoLeap mascot. Click to trigger their Framer Motion animation.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-bg-main dark:bg-bg-main/30 p-1.5 rounded-2xl border border-border">
              {Object.keys(logoConcepts).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveConcept(key)}
                  className={`py-2.5 rounded-xl font-black text-xs text-center transition cursor-pointer select-none ${
                    activeConcept === key
                      ? 'bg-white dark:bg-bg-card border-2 border-border text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  {key === 'gecko' ? '🦎 Gecko' : key === 'fox' ? '🦊 Fox' : '🐦 Hummingbird'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeConcept}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
                <div className="col-span-full md:col-span-4 flex flex-col items-center justify-center p-6 border-2 border-border bg-bg-main/40 dark:bg-bg-main/5 rounded-2xl relative">
                  <LingoLeapLogo size={110} concept={activeConcept} variant="compact" animated={true} />
                  <span className="text-[10px] font-extrabold text-text-secondary uppercase tracking-widest mt-4">Live SVG Concept</span>
                  {activeConcept === 'gecko' && (
                    <div className="absolute top-2 right-2 bg-primary/20 text-primary border border-primary/30 font-black text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">Winner</div>
                  )}
                </div>

                <div className="col-span-full md:col-span-8 space-y-4">
                  <div>
                    <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md border ${
                      activeConcept === 'gecko' ? 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-bg-main text-text-secondary border-border dark:bg-bg-card'
                    }`}>{logoConcepts[activeConcept].status}</span>
                    <h3 className="text-xl font-black text-text-main mt-2">{logoConcepts[activeConcept].name}</h3>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {logoConcepts[activeConcept].representing.map((v, i) => (
                      <span key={`${v}-${i}`} className={`text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${logoConcepts[activeConcept].badges[i]}`}>{v}</span>
                    ))}
                  </div>

                  <p className="text-xs text-text-secondary font-bold leading-relaxed">{logoConcepts[activeConcept].description}</p>
                  
                  <div className="border-t border-border pt-3.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary">Branding Rationale</p>
                    <p className="text-xs text-text-main font-semibold mt-1 italic">"{logoConcepts[activeConcept].rationale}"</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Social feed */}
          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users size={22} className="text-secondary" />
                <h2 className="font-black text-text-main text-xl">Friend Activity</h2>
              </div>
              <button onClick={() => navigate('/friends')} className="text-xs font-black text-secondary hover:text-secondary-hover underline cursor-pointer">Find friends</button>
            </div>

            <div className="space-y-4">
              {friendActivity.length === 0 ? (
                <EmptyState icon={<Activity size={24} />} text="No recent friend activities. Add some learning partners to share stats!" action="Find friends to follow" onClick={() => navigate('/friends')} />
              ) : (
                friendActivity.map((activity, index) => {
                  const hasCelebrated = celebratedIds.has(activity._id);
                  return (
                    <div key={activity._id || `activity-${index}`} className="flex items-center gap-4 p-4 border border-border bg-bg-main/30 dark:bg-bg-main/5 rounded-2xl">
                      <img src={activity.user.avatarUrl} alt="" className="w-11 h-11 rounded-full bg-bg-main border-2 border-primary/30 object-cover" onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${activity.user.username}`; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-main leading-tight">
                          <span className="font-black hover:underline cursor-pointer">{activity.user.username}</span>
                          <span className="text-text-secondary font-bold"> {activity.message.toLowerCase()}</span>
                        </p>
                        <span className="text-[10px] font-extrabold text-text-secondary/70 uppercase tracking-wide mt-1 block">{new Date(activity.timestamp).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => handleCelebrate(activity.user.username, activity._id)}
                        disabled={hasCelebrated}
                        className={`py-2 px-3.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all select-none cursor-pointer ${
                          hasCelebrated 
                            ? 'bg-emerald-50 text-emerald-500 border border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400' 
                            : 'bg-white dark:bg-bg-card border-2 border-border hover:border-primary text-text-secondary hover:text-primary shadow-sm'
                        }`}
                      >
                        <HeartHandshake size={14} />
                        <span>{hasCelebrated ? 'Celebrated' : 'Celebrate'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar gamification (1/3 width) */}
        <div className="flex flex-col gap-6">
          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <div className="relative">
              <img src={user.avatarUrl} alt="" className="w-20 h-20 rounded-full border-4 border-primary/20 object-cover bg-bg-main" onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`; }} />
              <span className="absolute bottom-0 right-0 text-2xl bg-white dark:bg-bg-card p-1 rounded-full border border-border shadow-sm">{langFlags[user.targetLanguage]}</span>
            </div>
            <h3 className="text-xl font-black text-text-main mt-4">{user.username}</h3>
            <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mt-0.5">Learner Level {level}</p>

            <div className="grid grid-cols-3 gap-3 w-full border-t border-border mt-6 pt-5">
              <div className="flex flex-col items-center">
                <Flame size={20} className="text-primary animate-pulse" />
                <span className="font-black text-sm text-text-main mt-1">{streak}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Streak</span>
              </div>
              <div className="flex flex-col items-center border-x border-border">
                <Gem size={18} className="text-secondary" />
                <span className="font-black text-sm text-text-main mt-1.5">{user.gems ?? 0}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Gems</span>
              </div>
              <div className="flex flex-col items-center">
                <Heart size={18} className="text-red-500" fill="currentColor" />
                <span className="font-black text-sm text-text-main mt-1.5">{hearts.current}/{hearts.max || 5}</span>
                <span className="text-[9px] font-extrabold text-text-secondary uppercase">Hearts</span>
              </div>
            </div>
            <button onClick={() => navigate('/settings')} className="mt-6 w-full py-3 bg-bg-main dark:bg-bg-main/30 border-2 border-border text-xs font-black text-text-main hover:bg-border/30 rounded-2xl transition cursor-pointer select-none">Edit Profile</button>
          </div>

          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4.5">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-emerald-500" />
                <h3 className="font-black text-text-main text-base">Daily Goal</h3>
              </div>
              <span className="text-xs font-black text-text-secondary bg-bg-main dark:bg-bg-main/20 px-2.5 py-1 rounded-lg border border-border">{todayXp}/{dailyGoal} XP</span>
            </div>
            <div className="w-full bg-bg-main dark:bg-bg-main/20 rounded-full h-4 overflow-hidden border border-border relative">
              <motion.div initial={{ width: 0 }} animate={{ width: `${dailyGoalPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-gradient-to-r from-emerald-400 to-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4.5">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                <h3 className="font-black text-text-main text-base">Level progress</h3>
              </div>
              <span className="text-xs font-black text-text-secondary bg-bg-main dark:bg-bg-main/20 px-2.5 py-1 rounded-lg border border-border">Level {level} → {level + 1}</span>
            </div>
            <div className="w-full bg-bg-main dark:bg-bg-main/20 rounded-full h-4 overflow-hidden border border-border relative">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-gradient-to-r from-blue-400 to-purple-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Gift size={20} className="text-primary" />
              <h3 className="font-black text-text-main text-base">Daily Quests</h3>
            </div>
            {quests.length === 0 ? (
              <EmptyState icon={<Target size={20} />} text="No active quests. Complete lessons to unlock." />
            ) : (
              <div className="space-y-3.5">
                {quests.map((quest, index) => (
                  <div key={quest.id || `quest-${index}`} className="border border-border bg-bg-main/10 dark:bg-bg-main/5 rounded-2xl p-3.5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-xs font-black text-text-main leading-tight flex items-center gap-1.5 flex-wrap">
                          <span>{quest.title}</span>
                          <span className="inline-flex items-center gap-0.5 text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-200/55 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold px-1.5 py-0.5 rounded leading-none">
                            <Sparkles size={8} className="text-indigo-500" /> AI
                          </span>
                        </p>
                        <p className="text-[10px] font-extrabold text-text-secondary mt-0.5">+{quest.xpReward} XP / +{quest.gemsReward} 💎</p>
                      </div>
                      <Button
                        variant="custom"
                        disabled={!quest.completed || quest.claimed}
                        onClick={async () => {
                          const result = await claimDailyQuest(quest.id);
                          if (result?.success) {
                            confetti({ particleCount: 30, spread: 40 });
                            toast.success(`Quest claimed: +${result.xpEarned} XP`);
                          }
                        }}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          quest.claimed ? 'bg-border/40 text-text-secondary/70' : quest.completed ? 'bg-primary text-white hover:bg-primary-hover shadow-sm' : 'bg-bg-main dark:bg-bg-card border border-border text-text-secondary'
                        }`}
                      >
                        {quest.claimed ? 'Claimed' : quest.completed ? 'Claim' : `${quest.current}/${quest.target}`}
                      </Button>
                    </div>
                    <div className="h-1.5 bg-bg-main dark:bg-bg-card rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${quest.progressPct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={20} className="text-secondary" />
              <h3 className="font-black text-text-main text-base">Study Habit</h3>
            </div>
            <div className="grid grid-cols-7 gap-1.5 p-2 bg-bg-main/30 dark:bg-bg-main/5 border border-border rounded-2xl">
              {Array.from({ length: 28 }).map((_, offset) => {
                const date = new Date();
                date.setDate(date.getDate() - (27 - offset));
                const key = date.toISOString().slice(0, 10);
                const day = calendar.find(d => d.date === key);
                const active = (day?.lessons || 0) > 0;
                return (
                  <div key={key} className={`aspect-square rounded border transition-colors ${active ? 'bg-primary border-primary' : 'bg-bg-main dark:bg-bg-main/20 border-border dark:border-border'}`} />
                );
              })}
            </div>
          </div>

          <div onClick={() => navigate('/leaderboard')} className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-border p-6 shadow-sm cursor-pointer hover:border-primary transition group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-amber-500 animate-[bounce_4s_infinite]" />
                <h3 className="font-black text-text-main text-base">League Rank</h3>
              </div>
              <ChevronRight size={16} className="text-text-secondary group-hover:translate-x-1 transition" />
            </div>
            {leagueData ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-bg-main/40 dark:bg-bg-main/5 p-3 rounded-2xl border border-border">
                  <div>
                    <span className="text-[9px] font-extrabold text-text-secondary uppercase">League</span>
                    <p className="text-sm font-black text-text-main">{leagueData.league} League</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold text-text-secondary uppercase">Rank</span>
                    <p className="text-sm font-black text-primary">#{leagueData.currentRank}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs font-bold text-text-secondary">Loading rank...</p>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <AppLayout>
      {user.lostStreak > 0 && (
        <div className="mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-5 text-white shadow-3d-orange flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-orange-400/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="flex items-center gap-4 relative z-10 text-center md:text-left flex-col sm:flex-row">
            <span className="text-4xl animate-bounce">🔥</span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">Repair Your Streak!</h3>
              <p className="text-white/80 text-xs sm:text-sm font-semibold mt-0.5">
                You lost your <span className="underline font-black">{user.lostStreak}-day</span> learning streak. Restoring it costs <span className="font-extrabold text-yellow-300">50 Gems</span>.
              </p>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                const res = await api.post('/learning/restore-streak');
                if (res.data.success) {
                  toast.success(res.data.message || 'Streak restored!');
                  setUser(res.data.user);
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to restore streak.');
              }
            }}
            className="bg-white dark:bg-bg-card text-orange-600 font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm btn-3d shadow-3d-white hover:scale-105 transition-transform cursor-pointer relative z-10 shrink-0 w-full sm:w-auto"
          >
            💎 Pay 50 Gems
          </button>
        </div>
      )}
      {isMobile ? <MobileDashboardLayout /> : <DesktopDashboardLayout />}

      {/* Daily Login Reward Modal */}
      <AnimatePresence>
        {showDailyRewardModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-bg-card rounded-[2rem] border-2 border-brand-purple/20 p-8 max-w-sm w-full text-center shadow-3d-purple relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-purple via-pink-500 to-indigo-500" />
              
              <div className="text-6xl my-4 animate-bounce">🎁</div>
              <h2 className="text-2xl font-black text-text-main mb-1">Daily Login Reward!</h2>
              <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mb-6">
                Welcome back to LingoLeap! Keep up your streak to earn even more gems tomorrow.
              </p>

              <div className="bg-brand-purple/10 border-2 border-brand-purple/20 rounded-2xl p-4 mb-6 flex flex-col items-center justify-center gap-2">
                <span className="text-[10px] font-black text-brand-purple uppercase tracking-wider">Streak Bonus Reward</span>
                <div className="flex items-center gap-1.5">
                  <Gem size={28} className="text-brand-purple animate-pulse" />
                  <span className="text-3xl font-black text-text-main">+{dailyRewardGems}</span>
                </div>
                <span className="text-[10px] font-bold text-brand-purple/60">added to your wallet</span>
              </div>

              <button
                onClick={() => {
                  setShowDailyRewardModal(false);
                  toast.success('Gems claimed! 💎');
                }}
                className="w-full bg-brand-purple text-white py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm btn-3d shadow-3d-purple border-0 hover:bg-brand-purple/95 transition cursor-pointer"
              >
                Claim Gems
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Dashboard;
