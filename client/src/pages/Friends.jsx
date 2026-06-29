import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Activity, UserPlus, UserMinus, ShieldAlert, Award, Clock,
  Bell, Check, X, Flame, Trophy, Ban, Globe, Sparkles, BookOpen, AlertCircle,
  UserCheck, Phone, Video, Mic, MessageSquare, PhoneCall
} from 'lucide-react';
import { socialService } from '../services/socialService';
import AppLayout from '../components/common/AppLayout';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

// Language flags map
const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

// Profile level XP helper
const xpToNextLevel = (level) => level * level * 100;

export default function Friends() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed', 'friends', 'search', 'requests'
  const [friends, setFriends] = useState([]);
  const [feed, setFeed] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const unreadNotificationsCount = user?.notifications?.filter(n => !n.read).length || 0;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Call simulation state
  const [activeCall, setActiveCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile Modal State
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'feed') {
        const data = await socialService.getFriendFeed();
        setFeed(data);
      } else if (activeTab === 'friends') {
        const data = await socialService.getFriends();
        setFriends(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationsAndRequests = async () => {
    try {
      const notis = await socialService.getNotifications();
      setNotifications(notis);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Removing local polling block to use global AuthContext state instead

  useEffect(() => {
    if (activeTab !== 'search' && activeTab !== 'requests') {
      loadData();
    } else if (activeTab === 'requests') {
      loadNotificationsAndRequests();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (searchQuery.length < 3) {
      toast.error('Search query must be at least 3 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const results = await socialService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await socialService.sendFriendRequest(userId);
      toast.success('Friend request sent!');
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'sent_pending' } : u))
      );
      loadNotificationsAndRequests();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleCancelRequest = async (userId) => {
    try {
      await socialService.cancelFriendRequest(userId);
      toast.success('Friend request cancelled!');
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'none' } : u))
      );
      loadNotificationsAndRequests();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await socialService.acceptFriendRequest(userId);
      toast.success('Friend request accepted!');
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'friends' } : u))
      );
      setNotifications(prev => prev.filter(n => !(n.type === 'friend_request' && n.sender?._id === userId)));
      loadData();
      loadNotificationsAndRequests();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await socialService.rejectFriendRequest(userId);
      toast.success('Friend request rejected');
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'none' } : u))
      );
      setNotifications(prev => prev.filter(n => !(n.type === 'friend_request' && n.sender?._id === userId)));
      loadNotificationsAndRequests();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      await socialService.removeFriend(userId);
      toast.success('Friend removed');
      setFriends(prev => prev.filter(f => f._id !== userId));
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'none' } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user? This will remove them from your friends and block further interactions.')) return;
    try {
      await socialService.blockUser(userId);
      toast.success('User blocked');
      setFriends(prev => prev.filter(f => f._id !== userId));
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'blocked' } : u))
      );
      loadNotificationsAndRequests();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      await socialService.unblockUser(userId);
      toast.success('User unblocked');
      setSearchResults(prev =>
        prev.map(u => (u._id === userId ? { ...u, relationship: 'none' } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleOpenProfile = async (userId) => {
    try {
      const profile = await socialService.getFriendProfile(userId);
      setSelectedFriend(profile);
      setShowProfileModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    }
  };

  const triggerSimulatedCall = (type) => {
    if (!selectedFriend) return;
    setActiveCall({
      type,
      user: selectedFriend,
      status: 'ringing'
    });
    setTimeout(() => {
      setActiveCall(prev => (prev ? { ...prev, status: 'connected' } : null));
    }, 2500);
  };

  const handleMarkAllRead = async () => {
    try {
      await socialService.markNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      refreshUser();
      toast.success('Notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark notifications as read');
    }
  };

  // 28-day Activity Grid Render Component
  const ContributionGrid = ({ studyCalendar }) => {
    const days = [];
    const today = new Date();
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const entry = studyCalendar?.find(item => item.date === dateStr) || { xp: 0 };
      days.push({ date: dateStr, xp: entry.xp });
    }

    return (
      <div className="bg-brand-light border-2 border-border dark:border-border rounded-3xl p-5 mt-5">
        <h5 className="text-sm font-extrabold text-text-main mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-blue" />
          Recent Activity Calendar (Last 28 Days)
        </h5>
        <div className="grid grid-cols-7 gap-2 max-w-xs mx-auto">
          {days.map((day, idx) => {
            let bgColor = 'bg-brand-gray/40'; // 0 XP
            let textColor = 'text-brand-dark/45';
            if (day.xp > 0 && day.xp < 20) {
              bgColor = 'bg-green-100 border border-green-300';
              textColor = 'text-green-800';
            }
            if (day.xp >= 20 && day.xp < 50) {
              bgColor = 'bg-brand-green/45 border border-brand-green/60';
              textColor = 'text-brand-green-hover';
            }
            if (day.xp >= 50) {
              bgColor = 'bg-brand-green border border-brand-green-hover text-white';
              textColor = 'text-white';
            }

            return (
              <div
                key={idx}
                className={`w-9 h-9 rounded-xl ${bgColor} flex flex-col items-center justify-center text-[10px] font-extrabold ${textColor} transition-all hover:scale-110 shadow-3d-card relative group`}
                title={`${day.date}: ${day.xp} XP`}
              >
                <span>{day.xp > 0 ? day.xp : ''}</span>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[8px] py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1 z-50 pointer-events-none font-bold">
                  {day.xp} XP
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[9px] font-extrabold text-brand-dark/50 mt-4 px-2">
          <span>Active days show XP earned</span>
          <div className="flex gap-1 items-center">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded bg-brand-gray/40 border border-border dark:border-border"></div>
            <div className="w-3.5 h-3.5 rounded bg-green-100 border border-green-300"></div>
            <div className="w-3.5 h-3.5 rounded bg-brand-green/45 border border-brand-green/60"></div>
            <div className="w-3.5 h-3.5 rounded bg-brand-green border border-brand-green-hover"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-brand-blue/10 border-2 border-brand-blue/20 p-4 rounded-3xl shadow-3d-card">
            <Users className="w-8 h-8 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-text-main">Social Friends</h1>
            <p className="text-sm font-bold text-brand-dark/50">Build your learning network, request friends, track XP, and level up together!</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-brand-light rounded-3xl border-2 border-border dark:border-border p-1.5 mb-8 gap-1.5">
          {[
            { id: 'feed', label: 'Activity Feed', mobileLabel: 'Feed', icon: Activity, badge: 0 },
            { id: 'friends', label: 'My Friends', mobileLabel: 'Friends', icon: Users, badge: 0 },
            { id: 'search', label: 'Find Friends', mobileLabel: 'Search', icon: Search, badge: 0 },
            {
              id: 'requests',
              label: 'Notifications',
              mobileLabel: 'Alerts',
              icon: Bell,
              badge: unreadNotificationsCount
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'requests') {
                    handleMarkAllRead();
                  }
                }}
                className={`relative flex items-center justify-center gap-1 sm:gap-2 py-2 px-1 sm:py-3 sm:px-4 rounded-2xl font-extrabold text-[10px] sm:text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-bg-card text-brand-blue border-2 border-brand-blue/20 shadow-3d-card'
                    : 'text-brand-dark/65 hover:bg-white/50 border-2 border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>{isMobile ? tab.mobileLabel : tab.label}</span>
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-brand-red/20 text-brand-red p-4 rounded-2xl mb-8 flex items-center gap-3 shadow-3d-card">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-blue border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* FEED TAB */}
              {activeTab === 'feed' && (
                <div className="space-y-4">
                  {feed.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border shadow-3d-card">
                      <Activity className="w-16 h-16 text-brand-dark/20 mx-auto mb-4" />
                      <h3 className="text-xl font-extrabold text-text-main mb-2">No Social Activity Yet</h3>
                      <p className="text-sm font-bold text-brand-dark/50 max-w-sm mx-auto">
                        Search and request friends to see their achievements, completed lessons, level ups, and study streaks in real-time!
                      </p>
                    </div>
                  ) : (
                    feed.map(activity => (
                      <div
                        key={activity._id}
                        className="bg-white dark:bg-bg-card p-5 rounded-3xl border-2 border-border dark:border-border shadow-3d-card flex gap-4 items-start hover:-translate-y-0.5 transition-all"
                      >
                        <img
                          src={activity.user?.avatarUrl}
                          alt={activity.user?.username}
                          className="w-14 h-14 rounded-2xl bg-brand-light border-2 border-border dark:border-border flex-shrink-0 cursor-pointer hover:opacity-85"
                          onClick={() => handleOpenProfile(activity.user?._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <h4
                              className="font-extrabold text-text-main text-lg hover:text-brand-blue cursor-pointer transition-colors"
                              onClick={() => handleOpenProfile(activity.user?._id)}
                            >
                              {activity.user?.username}
                            </h4>
                            <span className="text-xs font-bold text-brand-dark/45 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(activity.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-brand-dark/80 font-bold text-sm mt-1">{activity.message}</p>
                          {activity.xp > 0 && (
                            <div className="mt-3 inline-flex items-center gap-1.5 bg-brand-yellow/10 border border-brand-yellow/30 text-brand-orange px-3 py-1 rounded-xl text-xs font-black shadow-3d-card">
                              <Award className="w-4 h-4 text-brand-yellow" />
                              +{activity.xp} XP
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* FRIENDS LIST TAB */}
              {activeTab === 'friends' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {friends.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border shadow-3d-card">
                      <Users className="w-16 h-16 text-brand-dark/20 mx-auto mb-4" />
                      <h3 className="text-xl font-extrabold text-text-main mb-2">Your Friends List is Empty</h3>
                      <p className="text-sm font-bold text-brand-dark/50 max-w-sm mx-auto mb-5">
                        Add friends to compete, track accomplishments, and keep each other motivated!
                      </p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="bg-brand-blue hover:bg-brand-blue-hover text-white px-5 py-3 rounded-2xl font-black text-sm shadow-3d-blue hover:translate-y-0.5 active:translate-y-1 transition-all"
                      >
                        Find Friends Now
                      </button>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div
                        key={friend._id}
                        className="bg-white dark:bg-bg-card p-3 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border-2 border-border shadow-3d-card flex items-center gap-2.5 sm:gap-4 hover:-translate-y-0.5 transition-all"
                      >
                        <img
                          src={friend.avatarUrl}
                          alt={friend.username}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-brand-light dark:bg-bg-main/20 border-2 border-border flex-shrink-0 cursor-pointer hover:opacity-85"
                          onClick={() => handleOpenProfile(friend._id)}
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenProfile(friend._id)}>
                          <h4 className="font-extrabold text-text-main dark:text-text-main text-sm sm:text-lg truncate flex items-center gap-1 sm:gap-1.5 hover:text-brand-blue">
                            {friend.username}
                            <span title={`Learning ${friend.targetLanguage}`} className="text-base sm:text-lg">
                              {langFlags[friend.targetLanguage] || '🌐'}
                            </span>
                          </h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-3 mt-1 text-[10px] sm:text-xs font-bold text-brand-dark/60 dark:text-text-secondary">
                            <span className="bg-brand-light dark:bg-bg-main border border-border px-1.5 py-0.5 rounded-lg text-brand-dark/70 dark:text-text-main">
                              Lvl {friend.level}
                            </span>
                            <span className="flex items-center gap-0.5 text-brand-orange">
                              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                              {friend.streakCount || 0}
                            </span>
                            <span className="flex items-center gap-0.5 text-brand-blue">
                              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {friend.xp} XP
                            </span>
                          </div>
                        </div>

                        {/* Friend Action Panel */}
                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                          <Button
                            variant="custom"
                            onClick={() => handleRemoveFriend(friend._id)}
                            className="p-1.5 sm:p-2 text-text-secondary hover:text-brand-red hover:bg-brand-red/10 border-2 border-transparent hover:border-brand-red/20 rounded-xl transition-all"
                            title="Remove Friend"
                          >
                            <UserMinus className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                          </Button>
                          <Button
                            variant="custom"
                            onClick={() => handleBlockUser(friend._id)}
                            className="p-1.5 sm:p-2 text-text-secondary hover:text-brand-red hover:bg-brand-red/10 border-2 border-transparent hover:border-brand-red/20 rounded-xl transition-all"
                            title="Block User"
                          >
                            <Ban className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SEARCH TAB */}
              {activeTab === 'search' && (
                <div>
                  {/* Search Bar */}
                  <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dark/40 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Search users by username or email..."
                          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-bg-card border-2 border-border dark:border-border rounded-2xl outline-none font-bold text-text-main focus:border-brand-blue transition-colors shadow-3d-card"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-brand-blue hover:bg-brand-blue-hover text-white px-6 py-4 rounded-2xl font-black text-sm shadow-3d-blue hover:translate-y-0.5 active:translate-y-1 transition-all"
                      >
                        Search
                      </button>
                    </div>
                  </form>

                  {/* Search Results Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {searchResults.length === 0 ? (
                      searchQuery.length >= 3 && !loading ? (
                        <div className="col-span-full text-center py-10 font-bold text-brand-dark/50">
                          No users found matching "{searchQuery}"
                        </div>
                      ) : (
                        <div className="col-span-full text-center py-12 bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border shadow-3d-card">
                          <Search className="w-12 h-12 text-brand-dark/20 mx-auto mb-3" />
                          <p className="font-extrabold text-text-main">Search for LingoLeap Users</p>
                          <p className="text-xs font-bold text-brand-dark/50 mt-1">
                            Type a username or email address and press search to locate friends!
                          </p>
                        </div>
                      )
                    ) : (
                      searchResults.map(user => (
                        <div
                          key={user._id}
                          className="bg-white dark:bg-bg-card p-3 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border-2 border-border shadow-3d-card flex items-center gap-2.5 sm:gap-4 hover:-translate-y-0.5 transition-all"
                        >
                          <img
                            src={user.avatarUrl}
                            alt={user.username}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-brand-light dark:bg-bg-main/20 border-2 border-border flex-shrink-0 cursor-pointer"
                            onClick={() => handleOpenProfile(user._id)}
                          />
                          <div className="flex-1 min-w-0" onClick={() => handleOpenProfile(user._id)}>
                            <h4 className="font-extrabold text-text-main dark:text-text-main text-sm sm:text-lg truncate flex items-center gap-1 sm:gap-1.5 cursor-pointer hover:text-brand-blue">
                              {user.username}
                              <span title={`Learning ${user.targetLanguage}`} className="text-base sm:text-lg">
                                {langFlags[user.targetLanguage] || '🌐'}
                              </span>
                            </h4>
                            <p className="text-[10px] sm:text-[11px] font-bold text-brand-dark/45 truncate mt-0.5">{user.email}</p>
                            <div className="flex gap-1.5 sm:gap-2.5 mt-1 text-[10px] sm:text-xs font-bold text-brand-dark/55 dark:text-text-secondary">
                              <span className="bg-brand-light dark:bg-bg-main border border-border px-1.5 py-0.5 rounded-lg text-brand-dark/70 dark:text-text-main text-[9px] sm:text-[10px]">
                                Lvl {user.level}
                              </span>
                              <span className="flex items-center gap-0.5 text-brand-blue text-[9px] sm:text-[10px]">
                                {user.xp} XP
                              </span>
                            </div>
                          </div>

                          {/* Relationship Action Buttons */}
                          <div className="flex flex-col gap-1 sm:gap-1.5 flex-shrink-0">
                            {user.relationship === 'friends' && (
                              <div className="flex flex-col sm:flex-row gap-2">
                                <span className="bg-brand-green/10 border border-brand-green/20 text-brand-green font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                                  <Check className="w-3.5 h-3.5" />
                                  Friends
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/chat?userId=${user._id}`);
                                  }}
                                  className="bg-brand-blue hover:bg-brand-blue-hover text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-3d-blue flex items-center justify-center gap-1 hover:translate-y-0.5 active:translate-y-1 transition-all"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Message
                                </button>
                              </div>
                            )}

                            {user.relationship === 'sent_pending' && (
                              <div className="flex flex-col gap-1">
                                <span className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-orange font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                                  <Clock className="w-3.5 h-3.5" />
                                  Request Sent
                                </span>
                                <Button
                                  variant="custom"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    return handleCancelRequest(user._id);
                                  }}
                                  className="text-[10px] font-bold text-brand-dark/45 hover:text-brand-red hover:underline"
                                >
                                  Cancel Request
                                </Button>
                              </div>
                            )}

                            {user.relationship === 'received_pending' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="custom"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    return handleAcceptRequest(user._id);
                                  }}
                                  className="bg-brand-green hover:bg-brand-green-hover text-white px-3 py-2 rounded-xl text-xs font-black shadow-3d-green hover:translate-y-0.5 active:translate-y-1 transition-all"
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="custom"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    return handleRejectRequest(user._id);
                                  }}
                                  className="bg-brand-red hover:bg-brand-red/90 text-white px-3 py-2 rounded-xl text-xs font-black shadow-3d-red hover:translate-y-0.5 active:translate-y-1 transition-all"
                                >
                                  Reject
                                </Button>
                              </div>
                            )}

                            {user.relationship === 'none' && (
                              <Button
                                variant="custom"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  return handleSendRequest(user._id);
                                }}
                                className="bg-brand-blue hover:bg-brand-blue-hover text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-3d-blue flex items-center justify-center gap-1 hover:translate-y-0.5 active:translate-y-1 transition-all"
                              >
                                <UserPlus className="w-4 h-4" />
                                Add Friend
                              </Button>
                            )}

                            {user.relationship === 'blocked' && (
                              <span className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-black text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm">
                                <Ban className="w-3.5 h-3.5" />
                                Blocked
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* REQUESTS & NOTIFICATIONS TAB */}
              {activeTab === 'requests' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-extrabold text-text-main text-lg">Recent Social Alerts</h3>
                    {notifications.some(n => !n.read) && (
                      <Button
                        variant="custom"
                        onClick={handleMarkAllRead}
                        className="text-xs font-bold text-brand-blue hover:underline bg-brand-blue/5 border border-brand-blue/20 rounded-lg px-2.5 py-1 cursor-pointer"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border shadow-3d-card">
                      <Bell className="w-16 h-16 text-brand-dark/20 mx-auto mb-4" />
                      <h3 className="text-xl font-extrabold text-text-main mb-2">All Caught Up!</h3>
                      <p className="text-sm font-bold text-brand-dark/50 max-w-sm mx-auto">
                        No friend requests or social notifications found right now.
                      </p>
                    </div>
                  ) : (
                    notifications.map(noti => (
                      <div
                        key={noti._id}
                        className={`bg-white dark:bg-bg-card p-5 rounded-3xl border-2 shadow-3d-card flex items-center gap-4 transition-all ${
                          noti.read ? 'border-border dark:border-border opacity-80' : 'border-brand-blue/40 bg-brand-blue/5'
                        }`}
                      >
                        <img
                          src={noti.sender?.avatarUrl || 'https://api.dicebear.com/7.x/adventurer/svg?seed=LingoLeap'}
                          alt={noti.sender?.username}
                          className="w-14 h-14 rounded-2xl bg-brand-light border-2 border-border dark:border-border flex-shrink-0 cursor-pointer"
                          onClick={() => noti.sender?._id && handleOpenProfile(noti.sender._id)}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-text-main font-extrabold text-sm">{noti.message}</p>
                          <span className="text-[10px] font-bold text-brand-dark/45 block mt-1">
                            {new Date(noti.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Action details if friend_request */}
                        {noti.type === 'friend_request' && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <Button
                              variant="custom"
                              onClick={() => handleAcceptRequest(noti.sender?._id)}
                              className="bg-brand-green hover:bg-brand-green-hover text-white px-3.5 py-2 rounded-xl text-xs font-black shadow-3d-green"
                            >
                              Accept
                            </Button>
                            <Button
                              variant="custom"
                              onClick={() => handleRejectRequest(noti.sender?._id)}
                              className="bg-brand-light border-2 border-brand-gray text-text-main px-3.5 py-2 rounded-xl text-xs font-black shadow-3d-gray"
                            >
                              Ignore
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* FRIEND PROFILE MODAL (PREMIUM & STUNNING GLASSMORPHIC) */}
        {showProfileModal && selectedFriend && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-bg-card rounded-3xl border-4 border-brand-gray shadow-2xl w-full max-w-md overflow-hidden animate-scale-up relative">
              
              {/* Cover Banner */}
              <div className="h-28 bg-gradient-to-r from-brand-blue to-brand-purple relative">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-4 right-4 bg-white/30 backdrop-blur-md text-white hover:bg-white/50 p-2 rounded-full border border-white/20 transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Avatar and Name Header */}
              <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-end -mt-14 mb-4">
                  <img
                    src={selectedFriend.avatarUrl}
                    alt={selectedFriend.username}
                    className="w-24 h-24 rounded-3xl bg-brand-light border-4 border-white shadow-lg flex-shrink-0"
                  />
                  <div className="pb-1.5">
                    {selectedFriend.relationship === 'friends' && (
                      <span className="bg-brand-green/15 border border-brand-green/30 text-brand-green font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        Friend Check
                      </span>
                    )}
                    {selectedFriend.relationship === 'sent_pending' && (
                      <span className="bg-brand-yellow/15 border border-brand-yellow/30 text-brand-orange font-black text-xs px-3 py-1.5 rounded-xl shadow-sm">
                        Request Pending
                      </span>
                    )}
                    {selectedFriend.relationship === 'none' && (
                      <Button
                        variant="custom"
                        onClick={() => handleSendRequest(selectedFriend._id)}
                        className="bg-brand-blue hover:bg-brand-blue-hover text-white px-4 py-2 rounded-xl text-xs font-black shadow-3d-blue flex items-center gap-1 transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add Friend
                      </Button>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-text-main flex items-center gap-2">
                  {selectedFriend.username}
                  <span title={`Learning ${selectedFriend.targetLanguage}`} className="text-2xl">
                    {langFlags[selectedFriend.targetLanguage] || '🌐'}
                  </span>
                </h3>
                <p className="text-xs font-bold text-brand-dark/45 truncate mt-0.5">{selectedFriend.email}</p>

                {/* Friendship Status Badge */}
                <div className="mt-3 flex justify-center">
                  {selectedFriend.relationship === 'friends' && (
                    <span className="bg-brand-green/10 border border-brand-green/30 text-brand-green text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <UserCheck className="w-4 h-4 text-brand-green" />
                      Status: Friends
                    </span>
                  )}
                  {selectedFriend.relationship === 'sent_pending' && (
                    <span className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-orange text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Clock className="w-4 h-4 text-brand-orange" />
                      Status: Request Sent
                    </span>
                  )}
                  {selectedFriend.relationship === 'received_pending' && (
                    <span className="bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Bell className="w-4 h-4 text-brand-blue" />
                      Status: Request Received
                    </span>
                  )}
                  {selectedFriend.relationship === 'none' && (
                    <span className="bg-brand-gray/50 border border-brand-gray text-brand-dark/60 text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <AlertCircle className="w-4 h-4 text-brand-dark/50" />
                      Status: Not Friends
                    </span>
                  )}
                  {selectedFriend.relationship === 'blocked' && (
                    <span className="bg-brand-red/10 border border-brand-red/30 text-brand-red text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Ban className="w-4 h-4 text-brand-red" />
                      Status: Blocked
                    </span>
                  )}
                </div>

                {/* Level Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-extrabold text-brand-dark/60 mb-1">
                    <span>Level {selectedFriend.level}</span>
                    <span>{selectedFriend.xp} XP</span>
                  </div>
                  <div className="h-3 w-full bg-brand-gray border border-border dark:border-border rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-brand-blue rounded-full transition-all duration-500 shadow-md"
                      style={{
                        width: `${Math.min(
                          (selectedFriend.xp / xpToNextLevel(selectedFriend.level)) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Core Stats Row */}
                <div className="grid grid-cols-4 gap-2 mt-5">
                  <div className="bg-brand-light border-2 border-border dark:border-border rounded-2xl p-2 flex flex-col items-center shadow-3d-card">
                    <Flame className="w-5 h-5 text-brand-orange fill-current" />
                    <span className="text-base font-black text-text-main mt-1">{selectedFriend.streakCount || 0}</span>
                    <span className="text-[8px] font-bold text-brand-dark/50 uppercase">Streak</span>
                  </div>
                  <div className="bg-brand-light border-2 border-border dark:border-border rounded-2xl p-2 flex flex-col items-center shadow-3d-card">
                    <Users className="w-5 h-5 text-brand-purple" />
                    <span className="text-base font-black text-text-main mt-1">{selectedFriend.friendsCount || selectedFriend.friends?.length || 0}</span>
                    <span className="text-[8px] font-bold text-brand-dark/50 uppercase">Friends</span>
                  </div>
                  <div className="bg-brand-light border-2 border-border dark:border-border rounded-2xl p-2 flex flex-col items-center shadow-3d-card">
                    <Award className="w-5 h-5 text-brand-green" />
                    <span className="text-base font-black text-text-main mt-1">{selectedFriend.achievements?.length || 0}</span>
                    <span className="text-[8px] font-bold text-brand-dark/50 uppercase">Awards</span>
                  </div>
                  <div className="bg-brand-light border-2 border-border dark:border-border rounded-2xl p-2 flex flex-col items-center shadow-3d-card">
                    <Globe className="w-5 h-5 text-brand-blue" />
                    <span className="text-base font-black text-text-main mt-1 truncate max-w-full text-center text-[10px] pt-1">
                      {selectedFriend.targetLanguage}
                    </span>
                    <span className="text-[8px] font-bold text-brand-dark/50 uppercase">Language</span>
                  </div>
                </div>

                {/* Communication Tools Locker Panel */}
                <div className="mt-5 bg-brand-light border-2 border-border dark:border-border rounded-3xl p-4.5">
                  <h5 className="text-xs font-black text-brand-dark/75 mb-3 uppercase tracking-wider flex items-center gap-1.5 justify-center">
                    {selectedFriend.relationship === 'friends' ? (
                      <span className="text-brand-green flex items-center gap-1">🔓 Communication Channels Unlocked</span>
                    ) : (
                      <span className="text-brand-dark/45 flex items-center gap-1">🔒 Communication Channels Locked</span>
                    )}
                  </h5>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      disabled={selectedFriend.relationship !== 'friends'}
                      onClick={() => {
                        setShowProfileModal(false);
                        navigate(`/chat?userId=${selectedFriend._id}`);
                      }}
                      className={`py-3 rounded-2xl font-black text-xs flex flex-col items-center gap-1 border-2 shadow-3d-card transition-all ${
                        selectedFriend.relationship === 'friends'
                          ? 'border-brand-blue/30 text-brand-blue bg-white dark:bg-bg-card hover:bg-brand-blue/5 hover:-translate-y-0.5'
                          : 'border-brand-gray text-brand-dark/25 bg-brand-light cursor-not-allowed'
                      }`}
                      title={selectedFriend.relationship === 'friends' ? "Open Private Chat" : "Unlock by accepting friend request"}
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                      <span>Chat</span>
                    </button>

                    <button
                      disabled={selectedFriend.relationship !== 'friends'}
                      onClick={() => toast.success('🎙️ Simulated Voice Note recording initialized!')}
                      className={`py-3 rounded-2xl font-black text-xs flex flex-col items-center gap-1 border-2 shadow-3d-card transition-all ${
                        selectedFriend.relationship === 'friends'
                          ? 'border-brand-blue/30 text-brand-blue bg-white dark:bg-bg-card hover:bg-brand-blue/5 hover:-translate-y-0.5'
                          : 'border-brand-gray text-brand-dark/25 bg-brand-light cursor-not-allowed'
                      }`}
                      title={selectedFriend.relationship === 'friends' ? "Record Voice Note" : "Unlock by accepting friend request"}
                    >
                      <Mic className="w-4.5 h-4.5" />
                      <span>Voice</span>
                    </button>

                    <button
                      disabled={selectedFriend.relationship !== 'friends'}
                      onClick={() => triggerSimulatedCall('audio')}
                      className={`py-3 rounded-2xl font-black text-xs flex flex-col items-center gap-1 border-2 shadow-3d-card transition-all ${
                        selectedFriend.relationship === 'friends'
                          ? 'border-brand-blue/30 text-brand-blue bg-white dark:bg-bg-card hover:bg-brand-blue/5 hover:-translate-y-0.5'
                          : 'border-brand-gray text-brand-dark/25 bg-brand-light cursor-not-allowed'
                      }`}
                      title={selectedFriend.relationship === 'friends' ? "Audio Call" : "Unlock by accepting friend request"}
                    >
                      <Phone className="w-4.5 h-4.5" />
                      <span>Audio</span>
                    </button>

                    <button
                      disabled={selectedFriend.relationship !== 'friends'}
                      onClick={() => triggerSimulatedCall('video')}
                      className={`py-3 rounded-2xl font-black text-xs flex flex-col items-center gap-1 border-2 shadow-3d-card transition-all ${
                        selectedFriend.relationship === 'friends'
                          ? 'border-brand-blue/30 text-brand-blue bg-white dark:bg-bg-card hover:bg-brand-blue/5 hover:-translate-y-0.5'
                          : 'border-brand-gray text-brand-dark/25 bg-brand-light cursor-not-allowed'
                      }`}
                      title={selectedFriend.relationship === 'friends' ? "Video Call" : "Unlock by accepting friend request"}
                    >
                      <Video className="w-4.5 h-4.5" />
                      <span>Video</span>
                    </button>
                  </div>
                </div>

                {/* Contribution Grid */}
                <ContributionGrid studyCalendar={selectedFriend.studyCalendar} />

                {/* Recent Activities Section */}
                <div className="mt-5">
                  <h5 className="text-sm font-extrabold text-text-main mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-yellow fill-current" />
                    Recent Activities
                  </h5>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {selectedFriend.recentActivity && selectedFriend.recentActivity.length > 0 ? (
                      selectedFriend.recentActivity.map((activity, aIdx) => (
                        <div
                          key={aIdx}
                          className="bg-brand-light border border-border dark:border-border p-2.5 rounded-xl text-xs font-bold text-brand-dark/80 flex items-start gap-2 shadow-sm"
                        >
                          <BookOpen className="w-4 h-4 text-brand-blue mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p>{activity.message}</p>
                            <span className="text-[9px] text-brand-dark/45 block mt-0.5">
                              {new Date(activity.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-brand-dark/50 font-bold italic py-2 text-center">
                        No recent activity recorded.
                      </p>
                    )}
                  </div>
                </div>

                {/* Block option at bottom */}
                <div className="mt-6 pt-4 border-t border-brand-gray flex justify-between items-center flex-wrap gap-2">
                  <div className="flex gap-3">
                    <Button
                      variant="custom"
                      onClick={async () => {
                        await handleBlockUser(selectedFriend._id);
                        setShowProfileModal(false);
                      }}
                      className="text-xs font-black text-brand-red hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      Block User
                    </Button>
                    {selectedFriend.relationship === 'friends' && (
                      <Button
                        variant="custom"
                        onClick={async () => {
                          await handleRemoveFriend(selectedFriend._id);
                          setShowProfileModal(false);
                        }}
                        className="text-xs font-black text-brand-red hover:underline flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Remove Friend
                      </Button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="bg-brand-dark hover:bg-brand-dark/95 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-3d-gray"
                  >
                    Done
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}
        {activeCall && (
          <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md flex flex-col justify-between items-center p-8 z-50 animate-fade-in text-white">
            <div className="text-center mt-10">
              <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 animate-pulse">
                {activeCall.type === 'audio' ? <PhoneCall className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                <span>{activeCall.status === 'ringing' ? 'Ringing...' : 'Connected'}</span>
              </div>
              <img
                src={activeCall.user.avatarUrl}
                alt={activeCall.user.username}
                className="w-28 h-28 rounded-3xl mx-auto border-4 border-brand-blue shadow-2xl bg-brand-light/10 mt-2"
              />
              <h3 className="text-3xl font-black mt-4">{activeCall.user.username}</h3>
              <p className="text-sm font-bold text-white/60 mt-1">LingoLeap Call Simulator</p>
            </div>

            {activeCall.type === 'video' && activeCall.status === 'connected' ? (
              <div className="w-64 h-36 bg-brand-light/10 border-2 border-white/20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse overflow-hidden relative">
                <div className="absolute top-2 left-2 bg-black/45 text-[8px] font-black px-2 py-0.5 rounded">Camera Active</div>
                <img src={activeCall.user.avatarUrl} alt="Simulated video feed" className="w-full h-full object-cover opacity-60" />
              </div>
            ) : (
              <div className="h-28 flex items-center justify-center gap-2">
                <span className="w-2.5 h-2.5 bg-brand-blue rounded-full animate-ping"></span>
                <span className="w-2.5 h-2.5 bg-brand-blue rounded-full animate-ping [animation-delay:0.3s]"></span>
                <span className="w-2.5 h-2.5 bg-brand-blue rounded-full animate-ping [animation-delay:0.6s]"></span>
              </div>
            )}

            <div className="mb-10 w-full max-w-xs flex flex-col gap-4">
              {activeCall.status === 'connected' && (
                <div className="text-center text-xs font-bold text-white/50 animate-pulse">
                  This is a simulated call. Audio/Video connection verified!
                </div>
              )}
              <button
                onClick={() => setActiveCall(null)}
                className="w-full bg-brand-red hover:bg-brand-red/90 text-white py-4 rounded-2xl font-black text-sm shadow-3d-red active:translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Hang Up Call
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
