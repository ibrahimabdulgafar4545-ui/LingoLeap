import React, { useEffect, useState } from 'react';
import { useLearning } from '../context/LearningContext';
import AppLayout from '../components/common/AppLayout';
import UserProfileModal from '../components/common/UserProfileModal';
import { Trophy, Star, Zap, Medal, Crown, TrendingUp, TrendingDown, Users, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LEAGUES = [
  { name: 'Bronze', color: 'bg-amber-700 text-white', border: 'border-amber-700' },
  { name: 'Silver', color: 'bg-slate-400 text-white', border: 'border-slate-400' },
  { name: 'Gold', color: 'bg-yellow-500 text-white', border: 'border-yellow-500' },
  { name: 'Sapphire', color: 'bg-blue-500 text-white', border: 'border-blue-500' },
  { name: 'Ruby', color: 'bg-red-500 text-white', border: 'border-red-500' },
  { name: 'Emerald', color: 'bg-emerald-500 text-white', border: 'border-emerald-500' },
  { name: 'Diamond', color: 'bg-cyan-400 text-white', border: 'border-cyan-400' }
];

const Leaderboard = () => {
  const { fetchLeagueLeaderboard, fetchFriendsLeaderboard } = useLearning();
  const [activeTab, setActiveTab] = useState('league'); // 'league' or 'friends'
  const [loading, setLoading] = useState(true);
  const [leagueData, setLeagueData] = useState(null);
  const [friendsData, setFriendsData] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'league') {
      const data = await fetchLeagueLeaderboard();
      setLeagueData(data);
    } else {
      const data = await fetchFriendsLeaderboard();
      setFriendsData(data);
    }
    setLoading(false);
  };

  const currentLeagueObj = LEAGUES.find(l => l.name === leagueData?.league) || LEAGUES[0];

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-main mb-1">Leaderboards 🏆</h1>
          <p className="text-text-secondary font-semibold text-sm">Compete weekly to advance through the leagues!</p>
        </div>
      </div>

      <div className="flex bg-bg-main dark:bg-bg-main/20 rounded-xl p-1 mb-6 max-w-sm">
        <button
          onClick={() => setActiveTab('league')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${activeTab === 'league' ? 'bg-white dark:bg-bg-card text-secondary shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
        >
          <Trophy size={16} />
          League
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${activeTab === 'friends' ? 'bg-white dark:bg-bg-card text-secondary shadow-sm' : 'text-text-secondary hover:text-text-main'}`}
        >
          <Users size={16} />
          Friends
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'league' && leagueData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:gap-6 max-w-2xl mx-auto w-full">
          {/* League Banner */}
          <div className={`p-4 sm:p-6 rounded-3xl ${currentLeagueObj.color} shadow-3d-card flex items-center justify-between gap-3`}>
            <div>
              <p className="text-white/80 font-bold text-xs uppercase tracking-widest">{currentLeagueObj.name} LEAGUE</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">Rank #{leagueData.currentRank}</h2>
              <p className="text-white/90 font-semibold mt-1.5 flex items-center gap-1 text-xs sm:text-sm">
                <Zap size={14} className="text-white" />
                {leagueData.weeklyXp} XP this week
              </p>
            </div>
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="text-white w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>

          <div className="bg-white dark:bg-bg-card rounded-3xl p-3 sm:p-4 shadow-3d-card border-2 border-border dark:border-border">
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <AnimatePresence>
                {leagueData.users.map((leader, index) => {
                  const rank = index + 1;
                  const isPromotion = rank <= leagueData.promoteCount;
                  const isDemotion = rank > leagueData.totalInLeague - leagueData.demoteCount;
                  const isCurrentUser = rank === leagueData.currentRank;

                  return (
                    <motion.div
                      key={leader._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        setSelectedUserId(leader._id);
                        setIsProfileModalOpen(true);
                      }}
                      className={`relative flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-2xl transition-colors cursor-pointer ${
                        isCurrentUser ? 'bg-secondary/10 border-2 border-secondary' : 'hover:bg-bg-main/50'
                      } ${isPromotion ? 'border-l-4 border-l-primary' : ''} ${isDemotion ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <div className="w-7 sm:w-8 font-extrabold text-xs sm:text-sm text-text-secondary/50 text-center flex flex-col items-center justify-center flex-shrink-0">
                        <span>{rank}</span>
                        {isPromotion && <TrendingUp size={11} className="text-primary mt-0.5" />}
                        {isDemotion && <TrendingDown size={11} className="text-red-500 mt-0.5" />}
                      </div>
                      
                      <img
                        src={leader.avatarUrl}
                        alt={leader.username}
                        className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full border border-border dark:border-border object-cover bg-bg-main flex-shrink-0"
                        onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${leader.username}`; }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-extrabold text-xs sm:text-sm truncate ${isCurrentUser ? 'text-secondary' : 'text-text-main'}`}>
                          {leader.username}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-0.5 sm:gap-1 font-extrabold text-text-main flex-shrink-0">
                        <span className="text-xs sm:text-sm">{leader.weeklyXp}</span>
                        <span className="text-[10px] sm:text-xs text-text-secondary">XP</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            <div className="mt-4 pt-4 border-t-2 border-border dark:border-border flex justify-between text-[10px] sm:text-xs font-bold text-text-secondary/70">
              <span className="text-primary flex items-center gap-1"><TrendingUp size={13}/> Top {leagueData.promoteCount} Advance</span>
              <span className="text-red-500 flex items-center gap-1"><TrendingDown size={13}/> Bottom {leagueData.demoteCount} Demote</span>
            </div>
          </div>
        </motion.div>
      ) : activeTab === 'friends' && friendsData ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2.5 sm:gap-3 max-w-2xl mx-auto w-full">
          {friendsData.users.map((leader, index) => {
            const isCurrentUser = index + 1 === friendsData.currentRank;
            return (
              <div
                key={leader._id}
                onClick={() => {
                  setSelectedUserId(leader._id);
                  setIsProfileModalOpen(true);
                }}
                className={`flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-2xl border-2 cursor-pointer ${
                  isCurrentUser ? 'bg-secondary/10 border-secondary' : 'bg-white dark:bg-bg-card border-border dark:border-border hover:border-text-secondary/35'
                } shadow-sm transition-colors`}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-sm flex-shrink-0 ${
                  index < 3 ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'bg-bg-main dark:bg-bg-main/20 text-text-secondary'
                }`}>
                  {index < 3 ? <Medal className="w-4 h-4 sm:w-5 sm:h-5" /> : `#${index + 1}`}
                </div>
                
                <img
                  src={leader.avatarUrl}
                  alt={leader.username}
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 border-border object-cover bg-bg-main flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <p className={`font-extrabold text-sm sm:text-lg truncate ${isCurrentUser ? 'text-secondary' : 'text-text-main'}`}>
                    {leader.username}
                  </p>
                  <p className="text-[10px] sm:text-xs font-bold text-text-secondary truncate">Level {leader.level} · {leader.targetLanguage}</p>
                </div>
                
                <div className="flex items-center gap-0.5 sm:gap-1 text-primary font-extrabold bg-primary/10 px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  <span className="text-xs sm:text-sm">{leader.weeklyXp} XP</span>
                </div>
              </div>
            );
          })}
          {friendsData.users.length <= 1 && (
             <div className="text-center py-10 text-text-secondary">
               <Users size={48} className="mx-auto mb-3 opacity-30" />
               <p className="font-extrabold text-lg">No friends yet!</p>
               <p className="text-sm font-semibold">Add friends to compare your progress.</p>
             </div>
          )}
        </motion.div>
      ) : null}

      <UserProfileModal
        userId={selectedUserId}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </AppLayout>
  );
};

export default Leaderboard;
