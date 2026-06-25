import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, UserPlus, UserCheck, UserMinus, MessageSquare, Ban, 
  Trophy, Zap, Star, ShieldAlert, Loader2, Sparkles, Flame, Users 
} from 'lucide-react';
import api from '../../services/api';
import { allAchievements } from '../../pages/Achievements';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

const UserProfileModal = ({ userId, isOpen, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/social/profile/${userId}`);
        if (res.data) {
          setProfile(res.data);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.response?.data?.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isOpen]);

  if (!isOpen) return null;

  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      await api.post('/social/request', { recipientId: userId });
      // Update relationship status to sent_pending
      setProfile(prev => ({ ...prev, relationship: 'sent_pending' }));
    } catch (err) {
      console.error('Error sending friend request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setActionLoading(true);
    try {
      await api.post('/social/request/accept', { requesterId: userId });
      // Update relationship status to friends
      setProfile(prev => ({ ...prev, relationship: 'friends' }));
    } catch (err) {
      console.error('Error accepting friend request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm(`Are you sure you want to remove ${profile.username} from your friends?`)) return;
    setActionLoading(true);
    try {
      await api.delete(`/social/friends/${userId}`);
      setProfile(prev => ({ ...prev, relationship: 'none' }));
    } catch (err) {
      console.error('Error removing friend:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockUser = async () => {
    if (!window.confirm(`Are you sure you want to block ${profile.username}? This will unfriend them and hide conversations.`)) return;
    setActionLoading(true);
    try {
      await api.post('/social/block', { userIdToBlock: userId });
      alert('User blocked successfully.');
      onClose();
    } catch (err) {
      console.error('Error blocking user:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessageUser = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/chat/conversations', { recipientId: userId });
      if (res.data && res.data._id) {
        onClose();
        navigate(`/chat?conversationId=${res.data._id}`);
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-bg-card rounded-3xl border-2 border-border dark:border-border p-6 max-w-md w-full shadow-3d-card relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl border-2 border-border hover:bg-bg-main dark:hover:bg-bg-main/15 text-text-secondary hover:text-text-main transition cursor-pointer"
          >
            <X size={16} />
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-xs font-bold text-text-secondary">Loading profile details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <ShieldAlert size={48} className="text-red-500" />
              <p className="text-sm font-black text-text-main">{error}</p>
              <button 
                onClick={onClose}
                className="mt-2 bg-secondary text-white px-5 py-2 rounded-xl text-xs font-black cursor-pointer hover:bg-secondary-hover"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 mt-2">
              {/* Hero Banner Header */}
              <div className="flex flex-col items-center text-center gap-3">
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.username}
                  className="w-20 h-20 rounded-3xl border-4 border-primary/20 object-cover bg-bg-main shadow-md"
                  onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.username}`; }}
                />
                <div>
                  <h2 className="text-xl font-black text-text-main flex items-center justify-center gap-1.5 font-bold">
                    {profile.username}
                    {profile.targetLanguage && (
                      <span className="text-lg" title={`Studying ${profile.targetLanguage}`}>
                        {langFlags[profile.targetLanguage]}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs font-bold text-text-secondary mt-0.5">
                    Level {profile.level || 1} • {profile.targetLanguage || 'Spanish'} Student
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-main dark:bg-bg-main/20 rounded-2xl p-3 text-center border border-border">
                <div>
                  <p className="text-xs font-black text-primary flex items-center justify-center gap-1">
                    <Zap size={12} /> {profile.xp || 0}
                  </p>
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-wider mt-0.5">Total XP</p>
                </div>
                <div>
                  <p className="text-xs font-black text-secondary flex items-center justify-center gap-1">
                    <Flame size={12} /> {profile.streakCount || 0}
                  </p>
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-wider mt-0.5">Streak</p>
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-500 flex items-center justify-center gap-1">
                    <Trophy size={12} /> {profile.recentActivity ? (profile.recentActivity.filter(a => a.type === 'achievement').length || 0) : 0}
                  </p>
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-wider mt-0.5">Achievements</p>
                </div>
                <div>
                  <p className="text-xs font-black text-brand-purple flex items-center justify-center gap-1">
                    <Users size={12} /> {profile.friendsCount || 0}
                  </p>
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-wider mt-0.5">Friends</p>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Friend Button */}
                  {profile.relationship === 'friends' && (
                    <button
                      onClick={handleRemoveFriend}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 bg-red-500/10 border-2 border-red-500/20 text-red-500 hover:bg-red-500/20 font-black py-2.5 rounded-2xl text-xs transition cursor-pointer"
                    >
                      <UserMinus size={14} /> Remove Friend
                    </button>
                  )}
                  {profile.relationship === 'none' && (
                    <button
                      onClick={handleAddFriend}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 bg-primary text-white hover:bg-primary-hover font-black py-2.5 rounded-2xl text-xs transition cursor-pointer"
                    >
                      <UserPlus size={14} /> Add Friend
                    </button>
                  )}
                  {profile.relationship === 'sent_pending' && (
                    <button
                      disabled={true}
                      className="flex items-center justify-center gap-1.5 bg-border text-text-secondary font-black py-2.5 rounded-2xl text-xs"
                    >
                      <UserCheck size={14} /> Requested
                    </button>
                  )}
                  {profile.relationship === 'received_pending' && (
                    <button
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 bg-secondary text-white hover:bg-secondary-hover font-black py-2.5 rounded-2xl text-xs transition cursor-pointer"
                    >
                      <UserCheck size={14} /> Accept Request
                    </button>
                  )}

                  {/* Message Button */}
                  <button
                    onClick={handleMessageUser}
                    disabled={actionLoading || profile.relationship !== 'friends'}
                    className={`flex items-center justify-center gap-1.5 font-black py-2.5 rounded-2xl text-xs transition cursor-pointer ${
                      profile.relationship === 'friends'
                        ? 'bg-secondary text-white hover:bg-secondary-hover'
                        : 'bg-border text-text-secondary/50 cursor-not-allowed'
                    }`}
                    title={profile.relationship === 'friends' ? 'Send a message' : 'You must be friends to chat'}
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                </div>

                {/* Block Button */}
                <button
                  onClick={handleBlockUser}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 font-bold py-2 rounded-2xl text-xs transition cursor-pointer border border-red-200"
                >
                  <Ban size={13} /> Block User
                </button>
              </div>

              {/* Achievements Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-black text-text-main uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Trophy size={14} className="text-secondary" /> Unlocked Badges
                </h3>
                
                {(!profile.recentActivity || profile.recentActivity.filter(a => a.type === 'achievement').length === 0) ? (
                  <p className="text-[11px] text-text-secondary font-bold">No achievements unlocked yet.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {profile.recentActivity
                      .filter(a => a.type === 'achievement')
                      .slice(0, 4)
                      .map((act, index) => {
                        const matchedAch = allAchievements.find(a => act.message.includes(a.name));
                        return (
                          <div key={index} className="flex flex-col items-center p-2 border border-border bg-bg-main dark:bg-bg-main/20 rounded-xl text-center">
                            <span className="text-xl leading-none">{matchedAch?.icon || '⭐'}</span>
                            <span className="text-[9px] font-black truncate w-full text-text-main mt-1 leading-tight">
                              {matchedAch?.name || 'Badge'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserProfileModal;
