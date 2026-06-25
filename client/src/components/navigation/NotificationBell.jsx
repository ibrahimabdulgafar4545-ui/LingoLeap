import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { Bell, Trash2, Check, ExternalLink, Sparkles, Gift, Gem, Heart, Trophy, Megaphone, UserPlus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../../services/api';

const NotificationBell = () => {
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeAnn, setActiveAnn] = useState(null);
  const dropdownRef = useRef(null);

  const notifications = user?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Refresh notifications on-demand when dropdown opens + light background poll
  useEffect(() => {
    if (!user || !isOpen) return;
    refreshUser();
  }, [isOpen]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (!document.hidden) refreshUser();
    }, 120000); // 2 minutes instead of 15 seconds
    return () => clearInterval(interval);
  }, [user?._id]);

  // Handle clicking outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
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
    try {
      const res = await api.delete('/notifications');
      if (res.data.success) {
        refreshUser();
        toast.success('Notification history cleared.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimReward = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/notifications/${id}/claim-reward`);
      if (res.data.success) {
        refreshUser();
        toast.success(res.data.message || 'Reward claimed!');
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim reward.');
    }
  };

  const handleViewAnnouncement = async (notif) => {
    if (!notif.announcementId) return;
    try {
      // Mark notification as read
      if (!notif.read) {
        await api.put(`/notifications/${notif._id}/read`);
      }
      
      // Fetch and record view
      await api.post(`/notifications/announcements/${notif.announcementId}/view`);
      
      // Load announcement details
      const res = await api.get('/notifications/announcements');
      if (res.data.success) {
        const found = res.data.announcements.find(a => a._id === notif.announcementId);
        if (found) {
          setActiveAnn(found);
        } else {
          setActiveAnn({
            title: notif.message,
            content: 'Please find details about this announcement on the announcements page.',
            type: 'update'
          });
        }
      }
      refreshUser();
    } catch (err) {
      console.error(err);
      setActiveAnn({
        title: notif.message,
        content: 'Please find details about this announcement on the announcements page.',
        type: 'update'
      });
    }
  };

  const getNotifIcon = (type, rewardType) => {
    switch (type) {
      case 'reward':
        if (rewardType === 'gems') return <Gem className="text-amber-500 fill-amber-500/20" size={16} />;
        if (rewardType === 'hearts') return <Heart className="text-red-500 fill-red-500/20" size={16} />;
        if (rewardType === 'xp') return <Sparkles className="text-primary" size={16} />;
        return <Gift className="text-brand-purple" size={16} />;
      case 'announcement':
        return <Megaphone className="text-brand-blue" size={16} />;
      case 'friend_request':
        return <UserPlus className="text-teal-500" size={16} />;
      case 'friend_accepted':
        return <UserPlus className="text-green-500" size={16} />;
      case 'message':
        return <MessageSquare className="text-sky-500" size={16} />;
      case 'achievement':
        return <Trophy className="text-amber-400 fill-amber-400/15" size={16} />;
      default:
        return <Bell className="text-text-secondary" size={16} />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-2xl bg-white dark:bg-bg-card border-2 border-border flex items-center justify-center cursor-pointer text-text-main shadow-sm"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-wiggle text-primary" : "text-text-secondary"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-bg-card animate-pulse shadow-md">
            {unreadCount}
          </span>
        )}
      </motion.button>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-3.5 w-80 sm:w-96 max-h-[480px] bg-white dark:bg-bg-card border-2 border-border rounded-3xl shadow-2xl overflow-hidden z-50 flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-bg-main/30 dark:bg-bg-main/5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm text-text-main">Notifications</h3>
                <p className="text-[10px] font-bold text-text-secondary mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition border-0 cursor-pointer"
                    title="Mark all as read"
                  >
                    <Check size={14} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-500/5 transition border-0 cursor-pointer"
                    title="Clear history"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-[150px] max-h-[350px]">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-bg-main dark:bg-bg-main/10 flex items-center justify-center mx-auto mb-3 text-text-secondary/40">
                    <Bell size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-secondary">No notifications yet</p>
                  <p className="text-[10px] text-text-secondary/60 mt-1">We'll alert you when there is news or rewards!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id || notif.id}
                      onClick={() => notif.announcementId && handleViewAnnouncement(notif)}
                      className={`p-4 flex gap-3 transition-colors hover:bg-bg-main/30 dark:hover:bg-bg-main/5 cursor-pointer relative ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-8 h-8 rounded-xl border border-border/80 flex items-center justify-center bg-white dark:bg-bg-card dark:bg-bg-main/30`}>
                          {getNotifIcon(notif.type, notif.rewardType)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="font-extrabold text-[11px] text-text-main truncate">
                            {notif.title || 'LingoLeap Organization'}
                          </span>
                          <span className="text-[9px] text-text-secondary font-bold">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-text-secondary mt-1 leading-relaxed break-words">
                          {notif.message}
                        </p>

                        {/* Reward Claim Button */}
                        {notif.type === 'reward' && (
                          <div className="mt-2.5">
                            {notif.rewardClaimed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                <Check size={10} /> Claimed
                              </span>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={(e) => handleClaimReward(notif._id || notif.id, e)}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-primary-hover text-white text-[10px] font-black px-3.5 py-1.5 rounded-xl border-0 cursor-pointer shadow-sm btn-3d shadow-3d-primary animate-pulse"
                              >
                                <Gift size={11} /> Claim Reward
                              </motion.button>
                            )}
                          </div>
                        )}

                        {/* Announcement Link Indicator */}
                        {notif.type === 'announcement' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary mt-1.5">
                            View details <ExternalLink size={8} />
                          </span>
                        )}
                      </div>

                      {/* Read / Action dots & Delete button */}
                      <div className="absolute right-3.5 top-4 flex flex-col items-center gap-2">
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif._id || notif.id, e)}
                            className="w-2.5 h-2.5 rounded-full bg-primary border-0 p-0 cursor-pointer"
                            title="Mark as read"
                          />
                        )}
                        <button
                          onClick={(e) => handleDelete(notif._id || notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition border-0 cursor-pointer absolute right-0 top-0"
                          style={{ contentVisibility: 'auto' }} /* modern optimization */
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-border bg-bg-main/30 dark:bg-bg-main/5 text-center">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs font-black text-primary hover:text-primary-hover transition inline-flex items-center gap-1 no-underline"
              >
                View all notifications <ExternalLink size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Announcement Detail Dialog */}
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
    </div>
  );
};

export default NotificationBell;
