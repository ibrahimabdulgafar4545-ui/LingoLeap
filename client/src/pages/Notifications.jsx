import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/common/AppLayout';
import { Bell, Trash2, Check, ExternalLink, Sparkles, Gift, Gem, Heart, Trophy, Megaphone, UserPlus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../services/api';

const Notifications = () => {
  const { user, refreshUser } = useAuth();
  const [filter, setFilter] = useState('all');
  const [activeAnn, setActiveAnn] = useState(null);

  const notifications = user?.notifications || [];

  // Filter notifications based on active filter tab
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    if (filter === 'rewards') return notif.type === 'reward';
    if (filter === 'announcements') return notif.type === 'announcement';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        refreshUser();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        refreshUser();
        toast.success('All notifications marked as read.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        refreshUser();
        toast.success('Notification deleted.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire notification history?')) {
      try {
        const res = await api.delete('/notifications');
        if (res.data.success) {
          refreshUser();
          toast.success('Notification history cleared.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClaimReward = async (id) => {
    try {
      const res = await api.post(`/notifications/${id}/claim-reward`);
      if (res.data.success) {
        refreshUser();
        toast.success(res.data.message || 'Reward claimed!');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim reward.');
    }
  };

  const handleViewAnnouncement = async (notif) => {
    if (!notif.announcementId) return;
    try {
      if (!notif.read) {
        await api.put(`/notifications/${notif._id}/read`);
      }
      await api.post(`/notifications/announcements/${notif.announcementId}/view`);
      
      const res = await api.get('/notifications/announcements');
      if (res.data.success) {
        const found = res.data.announcements.find(a => a._id === notif.announcementId);
        if (found) {
          setActiveAnn(found);
        } else {
          setActiveAnn({
            title: notif.message,
            content: 'Please find details about this announcement on the announcements list.',
            type: 'update'
          });
        }
      }
      refreshUser();
    } catch (err) {
      console.error(err);
      setActiveAnn({
        title: notif.message,
        content: 'Please find details about this announcement on the announcements list.',
        type: 'update'
      });
    }
  };

  const getNotifIcon = (type, rewardType) => {
    switch (type) {
      case 'reward':
        if (rewardType === 'gems') return <Gem className="text-amber-500 fill-amber-500/20" size={20} />;
        if (rewardType === 'hearts') return <Heart className="text-red-500 fill-red-500/20" size={20} />;
        if (rewardType === 'xp') return <Sparkles className="text-primary animate-pulse" size={20} />;
        return <Gift className="text-brand-purple" size={20} />;
      case 'announcement':
        return <Megaphone className="text-brand-blue" size={20} />;
      case 'friend_request':
        return <UserPlus className="text-teal-500" size={20} />;
      case 'friend_accepted':
        return <UserPlus className="text-green-500" size={20} />;
      case 'message':
        return <MessageSquare className="text-sky-500" size={20} />;
      case 'achievement':
        return <Trophy className="text-amber-400 fill-amber-400/15" size={20} />;
      default:
        return <Bell className="text-text-secondary" size={20} />;
    }
  };

  // Group notifications by date
  const groupNotifications = (list) => {
    const today = [];
    const yesterday = [];
    const older = [];
    
    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(todayDate.getDate() - 1);

    list.forEach(n => {
      const d = new Date(n.createdAt);
      if (d.toDateString() === todayDate.toDateString()) {
        today.push(n);
      } else if (d.toDateString() === yesterdayDate.toDateString()) {
        yesterday.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupNotifications(filteredNotifications);

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-black text-text-secondary uppercase tracking-wider mb-3 px-1">{title}</h3>
        <div className="bg-white dark:bg-bg-card border-2 border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border/60">
          {items.map((notif) => (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key={notif._id || notif.id}
              onClick={() => notif.announcementId && handleViewAnnouncement(notif)}
              className={`p-4 sm:p-5 flex gap-4 transition-colors hover:bg-bg-main/30 dark:hover:bg-bg-main/5 cursor-pointer relative ${!notif.read ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl border border-border flex items-center justify-center bg-white dark:bg-bg-card dark:bg-bg-main/30 shadow-sm">
                  {getNotifIcon(notif.type, notif.rewardType)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0 pr-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 justify-between">
                  <span className="font-extrabold text-sm text-text-main">
                    {notif.title || 'LingoLeap Organization'}
                  </span>
                  <span className="text-[10px] text-text-secondary/70 font-semibold mt-0.5 sm:mt-0">
                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-text-secondary mt-1.5 leading-relaxed break-words">
                  {notif.message}
                </p>

                {/* Reward Actions */}
                {notif.type === 'reward' && (
                  <div className="mt-3.5">
                    {notif.rewardClaimed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-green-500 bg-green-500/10 px-3.5 py-1 rounded-full border border-green-500/20">
                        <Check size={12} /> Claimed & Applied
                      </span>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); handleClaimReward(notif._id || notif.id); }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-black px-4 py-2 rounded-2xl border-0 cursor-pointer shadow-sm btn-3d shadow-3d-primary animate-pulse"
                      >
                        <Gift size={13} /> Claim Reward
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Announcement Indicators */}
                {notif.type === 'announcement' && (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-primary mt-2">
                    Open Announcement Detail <ExternalLink size={12} />
                  </span>
                )}
              </div>

              {/* Actions Side */}
              <div className="absolute right-4 top-5 flex items-center gap-2.5">
                {!notif.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif._id || notif.id); }}
                    className="p-1 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition border-0 cursor-pointer"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(notif._id || notif.id); }}
                  className="p-1 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/5 transition border-0 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-2 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-main flex items-center gap-2.5">
              <span>🔔</span> Notification Center
            </h1>
            <p className="text-xs sm:text-sm font-bold text-text-secondary mt-1">
              Stay connected with updates, announcements, and rewards from LingoLeap Organization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 bg-bg-card dark:bg-bg-card border-2 border-border text-text-main font-extrabold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-bg-main transition"
              >
                <Check size={14} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-extrabold text-xs rounded-2xl flex items-center gap-1.5 cursor-pointer border-0 transition"
              >
                <Trash2 size={14} /> Clear history
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap gap-2 border-b-2 border-border pb-4 mb-6">
          {[
            { id: 'all', label: 'All Notifications', icon: <Bell size={13} /> },
            { id: 'unread', label: `Unread (${unreadCount})`, icon: <Check size={13} /> },
            { id: 'rewards', label: 'Rewards Center', icon: <Gift size={13} /> },
            { id: 'announcements', label: 'Announcements', icon: <Megaphone size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition border-2 ${
                filter === tab.id
                  ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-bg-card border-border text-text-secondary hover:text-text-main hover:bg-bg-main/30'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="min-h-[300px]">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-bg-card border-2 border-border rounded-3xl shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-bg-main dark:bg-bg-main/10 border-2 border-border flex items-center justify-center mx-auto mb-4 text-text-secondary/35">
                <Bell size={28} />
              </div>
              <h2 className="text-base font-black text-text-main">No notifications found</h2>
              <p className="text-xs text-text-secondary/70 font-semibold mt-1">
                There are no notifications matching your current filter.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {renderSection('Today', today)}
              {renderSection('Yesterday', yesterday)}
              {renderSection('Older', older)}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Announcement Detail Dialog (duplicated logic for convenience when clicked from full notifications page) */}
      <AnimatePresence>
        {activeAnn && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-bg-card border-2 border-border rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📢</span>
                <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  {activeAnn.type}
                </span>
              </div>
              <h2 className="text-lg font-black text-text-main leading-tight mb-2">{activeAnn.title}</h2>
              <div className="text-xs text-text-secondary/70 font-semibold mb-4">
                From: <span className="text-text-main font-black">{activeAnn.sender || 'LingoLeap Organization'}</span>
              </div>
              <p className="text-xs font-semibold text-text-secondary leading-relaxed bg-bg-main/40 dark:bg-bg-main/5 border border-border p-4 rounded-2xl whitespace-pre-wrap max-h-60 overflow-y-auto">
                {activeAnn.content}
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setActiveAnn(null)}
                  className="bg-primary text-white font-extrabold text-xs px-5 py-2.5 rounded-xl border-0 cursor-pointer btn-3d shadow-3d-primary hover:bg-primary-hover transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
};

export default Notifications;
