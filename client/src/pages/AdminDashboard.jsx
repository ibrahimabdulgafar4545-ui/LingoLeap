import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users, BookOpen, Trophy, Brain, ShieldAlert, BarChart2,
  ClipboardList, Search, Plus, Edit2, Trash2, ShieldCheck,
  RefreshCw, CheckCircle, AlertTriangle, Settings, ArrowLeft,
  ChevronRight, Save, Play, X, Star, Heart, Flame, Shield,
  MessageSquare, User, Eye, Ban, Check, Trash, Gem, ShoppingCart, Gift, Megaphone
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';

const AdminDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('analytics');

  // Global State
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [lessonsList, setLessonsList] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);
  const [onboardingConfig, setOnboardingConfig] = useState(null);
  const [reportsList, setReportsList] = useState([]);
  const [chatLogs, setChatLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Store, Payments, Config, and Events states
  const [storeItemsList, setStoreItemsList] = useState([]);
  const [transactionsList, setTransactionsList] = useState([]);
  const [configSettings, setConfigSettings] = useState({ maxHearts: 5, heartRegenMinutes: 30, startingGems: 500 });
  const [launchingEvent, setLaunchingEvent] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [currentStoreItem, setCurrentStoreItem] = useState(null);
  const [storeForm, setStoreForm] = useState({
    itemId: '', name: '', description: '', icon: '🛍️', price: 50, category: 'boosts', maxOwnable: 5
  });

  // Search Filter States
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  // Rewards & Announcements State
  const [customAnalytics, setCustomAnalytics] = useState(null);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [rewardForm, setRewardForm] = useState({
    rewardType: 'gems',
    amount: 100,
    rewardItem: '',
    targetType: 'individual',
    targetUserIds: [],
    count: 10
  });
  const [giftingReward, setGiftingReward] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'update',
    targetGroup: 'all',
    targetUsers: [],
    status: 'sent',
    scheduledFor: ''
  });
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const res = await api.get('/admin/announcements');
      if (res.data.success) {
        setAnnouncementsList(res.data.announcements);
      }
    } catch (err) {
      toast.error('Failed to load announcements');
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      toast.error('Title and content are required.');
      return;
    }
    setSendingAnnouncement(true);
    try {
      let res;
      if (isEditingAnnouncement) {
        res = await api.put(`/admin/announcements/${editingAnnouncementId}`, announcementForm);
      } else {
        res = await api.post('/admin/announcements', announcementForm);
      }
      if (res.data.success) {
        toast.success(res.data.message || 'Announcement saved!');
        setAnnouncementModalOpen(false);
        setAnnouncementForm({
          title: '', content: '', type: 'update', targetGroup: 'all', targetUsers: [], status: 'sent', scheduledFor: ''
        });
        loadAnnouncements();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save announcement.');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        const res = await api.delete(`/admin/announcements/${id}`);
        if (res.data.success) {
          toast.success('Announcement deleted.');
          loadAnnouncements();
        }
      } catch (err) {
        toast.error('Failed to delete announcement.');
      }
    }
  };

  const handleGiftRewardsSubmit = async (e) => {
    e.preventDefault();
    const type = rewardForm.targetType;
    if ((type === 'individual' || type === 'multiple') && rewardForm.targetUserIds.length === 0) {
      toast.error('Please select recipient user(s).');
      return;
    }
    setGiftingReward(true);
    try {
      const res = await api.post('/admin/rewards/gift', rewardForm);
      if (res.data.success) {
        toast.success(res.data.message || 'Rewards gifted successfully!');
        setRewardForm(prev => ({ ...prev, targetUserIds: [] }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to gift rewards.');
    } finally {
      setGiftingReward(false);
    }
  };

  // Modals & Forms
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null); // null = creating, object = editing
  const [lessonForm, setLessonForm] = useState({
    title: '', language: 'Spanish', category: 'Vocabulary',
    difficulty: 1, order: 1, unit: 1, unitTitle: '', xpReward: 15,
    questions: []
  });

  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [achievementForm, setAchievementForm] = useState({
    id: '', name: '', description: '', requireType: 'lessons', requireValue: 1
  });

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState(null);

  // Load Initial Data
  const loadStats = async () => {
    try {
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setStats(res.data.analytics);
      }
      const customRes = await api.get('/admin/analytics/custom');
      if (customRes.data.success) {
        setCustomAnalytics(customRes.data.analytics);
      }
    } catch (err) {
      toast.error('Failed to load analytics dashboard stats');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${userSearch}`);
      if (res.data.success) {
        setUsersList(res.data.users);
      }
    } catch (err) {
      toast.error('Failed to load users list');
    }
  };

  const loadLessons = async () => {
    try {
      const res = await api.get('/admin/lessons');
      if (res.data.success) {
        setLessonsList(res.data.lessons);
      }
    } catch (err) {
      toast.error('Failed to load lessons list');
    }
  };

  const loadAchievements = async () => {
    try {
      const res = await api.get('/admin/achievements');
      if (res.data.success) {
        setAchievementsList(res.data.achievements);
      }
    } catch (err) {
      toast.error('Failed to load achievements list');
    }
  };

  const loadOnboarding = async () => {
    try {
      const res = await api.get('/admin/onboarding');
      if (res.data.success) {
        setOnboardingConfig(res.data.onboarding);
        setOnboardingForm(res.data.onboarding);
      }
    } catch (err) {
      toast.error('Failed to load onboarding configurations');
    }
  };

  const loadReports = async () => {
    try {
      const res = await api.get('/admin/reports');
      if (res.data.success) {
        setReportsList(res.data.reports);
      }
    } catch (err) {
      toast.error('Failed to load social reports');
    }
  };

  const loadChatLogs = async () => {
    try {
      const res = await api.get('/admin/chats');
      if (res.data.success) {
        setChatLogs(res.data.messages);
      }
    } catch (err) {
      toast.error('Failed to load chat logs');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.data.success) {
        setAuditLogs(res.data.logs);
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    }
  };

  const loadStoreItems = async () => {
    try {
      const res = await api.get('/admin/store-items');
      if (res.data.success) {
        setStoreItemsList(res.data.items);
      }
    } catch (err) {
      toast.error('Failed to load store items list');
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await api.get('/admin/transactions');
      if (res.data.success) {
        setTransactionsList(res.data.transactions);
      }
    } catch (err) {
      toast.error('Failed to load transactions history');
    }
  };

  const loadConfigSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setConfigSettings(res.data.settings);
      }
    } catch (err) {
      toast.error('Failed to load configuration settings');
    }
  };

  // Run fetch based on active tab
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      if (activeTab === 'analytics') await loadStats();
      if (activeTab === 'users') await loadUsers();
      if (activeTab === 'rewards') await loadUsers();
      if (activeTab === 'announcements') await loadAnnouncements();
      if (activeTab === 'lessons') await loadLessons();
      if (activeTab === 'achievements') await loadAchievements();
      if (activeTab === 'onboarding') await loadOnboarding();
      if (activeTab === 'moderation') {
        await loadReports();
        await loadChatLogs();
      }
      if (activeTab === 'audit') await loadAuditLogs();
      if (activeTab === 'store') await loadStoreItems();
      if (activeTab === 'payments') await loadTransactions();
      if (activeTab === 'config') await loadConfigSettings();
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  // Handle user search
  useEffect(() => {
    if (activeTab === 'users') {
      const delaySearch = setTimeout(() => {
        loadUsers();
      }, 400);
      return () => clearTimeout(delaySearch);
    }
  }, [userSearch]);

  // ==========================================
  // USER ACTIONS
  // ==========================================
  const handleViewUser = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      if (res.data.success) {
        setSelectedUserProfile(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch user details');
    }
  };

  const handleBanToggle = async (userId, isCurrentlyBanned) => {
    try {
      const res = await api.put(`/admin/users/${userId}/ban`, { isBanned: !isCurrentlyBanned });
      if (res.data.success) {
        toast.success(res.data.message || 'User ban status updated');
        loadUsers();
        if (selectedUserProfile && selectedUserProfile.user._id === userId) {
          handleViewUser(userId);
        }
      }
    } catch (err) {
      toast.error('Failed to update ban status');
    }
  };

  const handleResetXP = async (userId) => {
    if (!window.confirm('Are you sure you want to reset this user\'s XP to 0?')) return;
    try {
      const res = await api.put(`/admin/users/${userId}/reset-xp`);
      if (res.data.success) {
        toast.success('User XP and level reset successfully');
        loadUsers();
        if (selectedUserProfile && selectedUserProfile.user._id === userId) {
          handleViewUser(userId);
        }
      }
    } catch (err) {
      toast.error('Failed to reset XP');
    }
  };

  const handleResetStreak = async (userId) => {
    if (!window.confirm('Are you sure you want to reset this user\'s daily streak to 0?')) return;
    try {
      const res = await api.put(`/admin/users/${userId}/reset-streak`);
      if (res.data.success) {
        toast.success('User streak count reset successfully');
        loadUsers();
        if (selectedUserProfile && selectedUserProfile.user._id === userId) {
          handleViewUser(userId);
        }
      }
    } catch (err) {
      toast.error('Failed to reset streak count');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to delete this user permanently? This deletes all their progress and cannot be undone.')) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        toast.success('User and all related records deleted permanently');
        setSelectedUserProfile(null);
        loadUsers();
      }
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleAdjustBalance = async (userId, gemsAmount, heartsAmount) => {
    try {
      const res = await api.put(`/admin/users/${userId}/adjust-balance`, {
        gems: Number(gemsAmount || 0),
        hearts: Number(heartsAmount || 0)
      });
      if (res.data.success) {
        toast.success(res.data.message || 'User balance adjusted successfully');
        loadUsers();
        if (selectedUserProfile && selectedUserProfile.user._id === userId) {
          handleViewUser(userId);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust user balance');
    }
  };

  // ==========================================
  // LESSON ACTIONS
  // ==========================================
  const openCreateLesson = () => {
    setCurrentLesson(null);
    setLessonForm({
      title: '', language: 'Spanish', category: 'Vocabulary',
      difficulty: 1, order: lessonsList.length + 1, unit: 1, unitTitle: 'Basics', xpReward: 15,
      questions: [
        { type: 'multiple-choice', prompt: '', options: ['', '', '', ''], correctAnswer: '' }
      ]
    });
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson) => {
    setCurrentLesson(lesson);
    setLessonForm({
      title: lesson.title,
      language: lesson.language,
      category: lesson.category || 'Vocabulary',
      difficulty: lesson.difficulty || 1,
      order: lesson.order || 1,
      unit: lesson.unit || 1,
      unitTitle: lesson.unitTitle || '',
      xpReward: lesson.xpReward || 15,
      questions: lesson.questions && lesson.questions.length > 0 ? lesson.questions.map(q => ({
        _id: q._id,
        type: q.type || 'multiple-choice',
        prompt: q.prompt || '',
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctAnswer || ''
      })) : [{ type: 'multiple-choice', prompt: '', options: ['', '', '', ''], correctAnswer: '' }]
    });
    setShowLessonModal(true);
  };

  const handleAddQuestion = () => {
    setLessonForm({
      ...lessonForm,
      questions: [...lessonForm.questions, { type: 'multiple-choice', prompt: '', options: ['', '', '', ''], correctAnswer: '' }]
    });
  };

  const handleRemoveQuestion = (idx) => {
    const updated = [...lessonForm.questions];
    updated.splice(idx, 1);
    setLessonForm({ ...lessonForm, questions: updated });
  };

  const handleQuestionChange = (idx, field, val) => {
    const updated = [...lessonForm.questions];
    updated[idx][field] = val;
    setLessonForm({ ...lessonForm, questions: updated });
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...lessonForm.questions];
    updated[qIdx].options[optIdx] = val;
    setLessonForm({ ...lessonForm, questions: updated });
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    try {
      if (currentLesson) {
        // Edit
        const res = await api.put(`/admin/lessons/${currentLesson._id}`, lessonForm);
        if (res.data.success) {
          toast.success('Lesson updated successfully');
          setShowLessonModal(false);
          loadLessons();
        }
      } else {
        // Create
        const res = await api.post('/admin/lessons', lessonForm);
        if (res.data.success) {
          toast.success('New lesson created successfully');
          setShowLessonModal(false);
          loadLessons();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson? This deletes user progress records for this lesson.')) return;
    try {
      const res = await api.delete(`/admin/lessons/${lessonId}`);
      if (res.data.success) {
        toast.success('Lesson deleted successfully');
        loadLessons();
      }
    } catch (err) {
      toast.error('Failed to delete lesson');
    }
  };

  // ==========================================
  // ACHIEVEMENT ACTIONS
  // ==========================================
  const openCreateAchievement = () => {
    setCurrentAchievement(null);
    setAchievementForm({
      id: '', name: '', description: '', requireType: 'lessons', requireValue: 1
    });
    setShowAchievementModal(true);
  };

  const openEditAchievement = (ach) => {
    setCurrentAchievement(ach);
    setAchievementForm({
      id: ach.id,
      name: ach.name,
      description: ach.description,
      requireType: ach.requireType,
      requireValue: ach.requireValue
    });
    setShowAchievementModal(true);
  };

  const handleSaveAchievement = async (e) => {
    e.preventDefault();
    try {
      if (currentAchievement) {
        const res = await api.put(`/admin/achievements/${currentAchievement._id}`, achievementForm);
        if (res.data.success) {
          toast.success('Achievement updated successfully');
          setShowAchievementModal(false);
          loadAchievements();
        }
      } else {
        const res = await api.post('/admin/achievements', achievementForm);
        if (res.data.success) {
          toast.success('New achievement created successfully');
          setShowAchievementModal(false);
          loadAchievements();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save achievement');
    }
  };

  const handleDeleteAchievement = async (achId) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    try {
      const res = await api.delete(`/admin/achievements/${achId}`);
      if (res.data.success) {
        toast.success('Achievement deleted successfully');
        loadAchievements();
      }
    } catch (err) {
      toast.error('Failed to delete achievement');
    }
  };

  // ==========================================
  // STORE, CONFIG, AND EVENT ACTIONS
  // ==========================================
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await api.put('/admin/settings', configSettings);
      if (res.data.success) {
        toast.success('System configurations updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update configurations');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleLaunchEvent = async (eventType) => {
    if (launchingEvent) return;
    setLaunchingEvent(true);
    try {
      const res = await api.post('/admin/events/launch', { eventType });
      if (res.data.success) {
        toast.success(res.data.message || 'Campaign launched successfully!');
        loadStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to launch campaign event.');
    } finally {
      setLaunchingEvent(false);
    }
  };

  const openCreateStoreItem = () => {
    setCurrentStoreItem(null);
    setStoreForm({
      itemId: '', name: '', description: '', icon: '🛍️', price: 50, category: 'boosts', maxOwnable: 5
    });
    setShowStoreModal(true);
  };

  const openEditStoreItem = (item) => {
    setCurrentStoreItem(item);
    setStoreForm({
      itemId: item.itemId,
      name: item.name,
      description: item.description,
      icon: item.icon,
      price: item.price,
      category: item.category,
      maxOwnable: item.maxOwnable
    });
    setShowStoreModal(true);
  };

  const handleSaveStoreItem = async (e) => {
    e.preventDefault();
    try {
      if (currentStoreItem) {
        const res = await api.put(`/admin/store-items/${currentStoreItem._id || currentStoreItem.id}`, storeForm);
        if (res.data.success) {
          toast.success('Store item updated successfully');
          setShowStoreModal(false);
          loadStoreItems();
        }
      } else {
        const res = await api.post('/admin/store-items', storeForm);
        if (res.data.success) {
          toast.success('New store item created successfully');
          setShowStoreModal(false);
          loadStoreItems();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save store item');
    }
  };

  const handleDeleteStoreItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store item?')) return;
    try {
      const res = await api.delete(`/admin/store-items/${id}`);
      if (res.data.success) {
        toast.success('Store item deleted successfully');
        loadStoreItems();
      }
    } catch (err) {
      toast.error('Failed to delete store item');
    }
  };

  // ==========================================
  // ONBOARDING ACTIONS
  // ==========================================
  const handleSaveOnboarding = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/admin/onboarding', onboardingForm);
      if (res.data.success) {
        toast.success('Onboarding configurations updated successfully');
        setOnboardingConfig(res.data.onboarding);
        setShowOnboardingModal(false);
      }
    } catch (err) {
      toast.error('Failed to update onboarding options');
    }
  };

  // ==========================================
  // SOCIAL MODERATION & REPORTS ACTIONS
  // ==========================================
  const handleResolveReport = async (reportId, status) => {
    try {
      const res = await api.put(`/admin/reports/${reportId}`, { status });
      if (res.data.success) {
        toast.success(`Report status updated to ${status}`);
        loadReports();
      }
    } catch (err) {
      toast.error('Failed to update report status');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message content? This will moderate/delete it from all users chats.')) return;
    try {
      const res = await api.delete(`/admin/chats/${messageId}`);
      if (res.data.success) {
        toast.success('Message content moderated and deleted');
        loadChatLogs();
      }
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  // Quick navigation helpers
  const sidebarItems = [
    { id: 'analytics', label: 'Dashboard Stats', icon: BarChart2 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'rewards', label: 'Rewards Center', icon: Gift },
    { id: 'announcements', label: 'Announcement Center', icon: Megaphone },
    { id: 'lessons', label: 'Lesson Management', icon: BookOpen },
    { id: 'achievements', label: 'Achievements List', icon: Trophy },
    { id: 'store', label: 'Store Management', icon: ShoppingCart },
    { id: 'payments', label: 'Transactions History', icon: Gem },
    { id: 'events', label: 'Campaign Events', icon: Flame },
    { id: 'config', label: 'System Settings', icon: Settings },
    { id: 'onboarding', label: 'Onboarding Options', icon: Settings },
    { id: 'moderation', label: 'Social Moderation', icon: ShieldAlert },
    { id: 'audit', label: 'Audit Security Logs', icon: ClipboardList }
  ];

  return (
    <div className="min-h-screen bg-bg-main flex font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-dark text-white p-5 flex flex-col justify-between hidden md:flex border-r border-slate-800">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center font-black text-white text-lg">L</div>
            <span className="font-black text-xl tracking-tight text-brand-green">LingoLeap</span>
            <span className="bg-brand-purple/20 text-brand-purple text-[10px] px-2 py-0.5 rounded-full font-black border border-brand-purple/40">ADMIN</span>
          </div>

          {/* User badge */}
          <div className="bg-slate-900/60 rounded-2xl p-4 mb-6 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-purple/20 flex items-center justify-center font-bold text-brand-purple border border-brand-purple/30">
              A
            </div>
            <div>
              <div className="text-xs font-black text-slate-100 truncate">{user?.username || 'Administrator'}</div>
              <div className="text-[10px] text-text-secondary font-semibold truncate">{user?.email || 'admin@lingoleap.com'}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedUserProfile(null);
                  }}
                  className={`w-full text-left py-3.5 px-4 rounded-xl font-bold text-xs flex items-center gap-3.5 transition-all duration-150 ${
                    activeTab === item.id
                      ? 'bg-brand-green text-text-main font-black shadow-md shadow-brand-green/20'
                      : 'text-text-secondary hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Exit Button */}
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-left py-3 px-4 rounded-xl font-bold text-xs text-text-secondary hover:text-white hover:bg-slate-800 flex items-center gap-3.5 mb-2 transition"
          >
            <ArrowLeft size={16} />
            <span>Learner App</span>
          </button>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full text-left py-3 px-4 rounded-xl font-bold text-xs text-rose-400 hover:text-white hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 flex items-center gap-3.5 transition"
          >
            
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between pb-4 border-b border-border dark:border-border mb-6">
          <div className="flex items-center gap-2">
            <span className="font-black text-lg text-brand-purple">LingoLeap</span>
            <span className="text-[9px] bg-brand-green/20 text-brand-green border border-brand-green/30 rounded px-1.5 py-0.5 font-bold">ADMIN</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={activeTab}
              onChange={(e) => {
                setActiveTab(e.target.value);
                setSelectedUserProfile(null);
              }}
              className="text-xs font-bold bg-bg-card border border-border dark:border-border rounded-xl px-3 py-2 outline-none"
            >
              {sidebarItems.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 border border-border dark:border-border rounded-xl text-brand-dark/70 hover:bg-bg-card"
            >
              <ArrowLeft size={16} />
            </button>
          </div>
        </header>

        {/* Tab Header for Desktop */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-text-main">Admin Dashboard</h1>
            <p className="text-xs font-bold text-brand-dark/40 mt-1">
              Configure courses, manage users, monitor API logs, and moderate social features.
            </p>
          </div>
          <div className="bg-slate-200 border border-slate-300/40 rounded-full px-3 py-1.5 text-[10px] font-black text-text-main flex items-center gap-1.5 shadow-sm">
            <Shield size={12} className="text-brand-purple animate-pulse" /> Authorized Session: Secure
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && !stats && !usersList.length && !lessonsList.length && (
          <div className="h-96 flex flex-col justify-center items-center gap-4">
            <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-extrabold text-brand-dark/30">Loading content records...</span>
          </div>
        )}

        {/* TAB PANELS */}
        {!loading && (
          <div className="space-y-6">
            {/* 1. ANALYTICS PANEL */}
            {activeTab === 'analytics' && stats && (
              <div className="space-y-6 fade-in-up">
                {/* Scorecards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 border-2 border-green-500/20 rounded-2xl flex items-center justify-center text-green-600">
                      <Gem size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Total Revenue</div>
                      <div className="text-2xl font-black text-text-main">${stats.revenue || 0}</div>
                    </div>
                  </div>
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-green/10 border-2 border-brand-green/20 rounded-2xl flex items-center justify-center text-brand-green">
                      <Users size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Total Users</div>
                      <div className="text-2xl font-black text-text-main">{stats.totalUsers}</div>
                    </div>
                  </div>
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-purple/10 border-2 border-brand-purple/20 rounded-2xl flex items-center justify-center text-brand-purple">
                      <Flame size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Active Users (7d)</div>
                      <div className="text-2xl font-black text-text-main">{stats.activeUsers}</div>
                    </div>
                  </div>
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Lessons Taken</div>
                      <div className="text-2xl font-black text-text-main">{stats.lessonsCompleted}</div>
                    </div>
                  </div>
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 border-2 border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600">
                      <Heart size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Friend Connections</div>
                      <div className="text-2xl font-black text-text-main">{stats.friendConnections}</div>
                    </div>
                  </div>
                  {/* Notification opens */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-500/10 border-2 border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-600">
                      
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Notification Opens</div>
                      <div className="text-2xl font-black text-text-main">{customAnalytics?.notification_opens ?? 0}</div>
                    </div>
                  </div>
                  {/* Reward claims */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500/10 border-2 border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-600">
                      <Gift size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Reward Claims</div>
                      <div className="text-2xl font-black text-text-main">{customAnalytics?.reward_claims ?? 0}</div>
                    </div>
                  </div>
                  {/* Announcement views */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-5 shadow-3d-card flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600">
                      <Megaphone size={22} />
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-brand-dark/40 uppercase">Announcement Views</div>
                      <div className="text-2xl font-black text-text-main">{customAnalytics?.announcement_views ?? 0}</div>
                    </div>
                  </div>
                </div>

                {/* AI & Platform Usage statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* AI tutor metrics */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card lg:col-span-2">
                    <div className="flex items-center justify-between mb-6 pb-2 border-b border-border dark:border-border">
                      <div className="flex items-center gap-2">
                        <Brain size={18} className="text-brand-purple animate-pulse" />
                        <h3 className="font-black text-sm text-text-main">AI Service Usage & Request Monitoring</h3>
                      </div>
                      <span className="text-[9px] font-extrabold bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2.5 py-1 rounded-full uppercase">API Status: Active</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center">
                        <div className="text-[10px] font-black text-brand-dark/40 uppercase mb-1">API Requests</div>
                        <div className="text-xl font-black text-brand-purple">{stats.aiUsage?.apiRequests}</div>
                        <div className="text-[8px] font-bold text-brand-dark/40 mt-1">Estimate total load</div>
                      </div>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center">
                        <div className="text-[10px] font-black text-brand-dark/40 uppercase mb-1">AI Conversations</div>
                        <div className="text-xl font-black text-brand-purple">{stats.aiUsage?.totalConversations}</div>
                        <div className="text-[8px] font-bold text-brand-dark/40 mt-1">Practice scenarios</div>
                      </div>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center">
                        <div className="text-[10px] font-black text-brand-dark/40 uppercase mb-1">Avg Msg / Session</div>
                        <div className="text-xl font-black text-brand-purple">{stats.aiUsage?.averageMessagesPerSession}</div>
                        <div className="text-[8px] font-bold text-brand-dark/40 mt-1">Engagement level</div>
                      </div>
                    </div>

                    <div className="bg-brand-purple/5 border border-brand-purple/15 rounded-2xl p-4 mt-6">
                      <h4 className="text-xs font-black text-brand-purple mb-1.5 flex items-center gap-1.5">
                        <ShieldAlert size={14} /> Optimization Insights
                      </h4>
                      <p className="text-[10px] text-brand-dark/60 font-semibold leading-relaxed">
                        Currently, AI Conversation messages average around {stats.aiUsage?.averageMessagesPerSession} responses per session. 
                        API load levels are stable. No API rate limits exceeded. Local filesystem fallback cache is fully operational.
                      </p>
                    </div>
                  </div>

                  {/* General Stats */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                    <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                      <Star size={16} className="text-amber-500" /> Platform Vitality
                    </h3>

                    <div className="space-y-4 font-bold text-xs">
                      <div>
                        <div className="flex justify-between text-brand-dark/60 mb-1 text-[11px]">
                          <span>Active User Retention (7d)</span>
                          <span>{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-brand-gray/30 h-2.5 rounded-full overflow-hidden border border-border dark:border-border">
                          <div className="bg-brand-green h-full rounded-full" style={{ width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0}%` }} />
                        </div>
                      </div>

                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 space-y-2 mt-4 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-brand-dark/50">Total Messages Sent:</span>
                          <span className="text-text-main font-black">{stats.messagesSent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-dark/50">Total Lessons Database Size:</span>
                          <span className="text-text-main font-black">{lessonsList.length} Units</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-brand-dark/50">Custom Achievements:</span>
                          <span className="text-text-main font-black">{achievementsList.length} Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USER MANAGEMENT PANEL */}
            {activeTab === 'users' && (
              <div className="space-y-6 fade-in-up">
                {/* Profile Detail Subview */}
                {selectedUserProfile && (
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card relative">
                    <button
                      onClick={() => setSelectedUserProfile(null)}
                      className="absolute top-6 right-6 p-1.5 border border-border dark:border-border rounded-xl text-brand-dark/40 hover:text-text-main hover:bg-bg-main"
                    >
                      <X size={16} />
                    </button>

                    <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-border dark:border-border items-start md:items-center">
                      <div className="w-20 h-20 rounded-3xl border-2 border-brand-purple bg-bg-main overflow-hidden flex items-center justify-center p-2">
                        <img src={selectedUserProfile.user.avatarUrl} alt="Avatar" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-black text-text-main">{selectedUserProfile.user.username}</h2>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                            selectedUserProfile.user.role === 'admin' 
                              ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' 
                              : 'bg-brand-blue/20 text-brand-blue border border-brand-blue/30'
                          }`}>
                            {selectedUserProfile.user.role}
                          </span>
                          {selectedUserProfile.user.isBanned && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-500 font-black border border-rose-500/30 uppercase">
                              Banned
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-brand-dark/40 mt-1">{selectedUserProfile.user.email}</div>
                        <div className="text-[10px] text-brand-dark/40 font-semibold mt-1">Joined: {new Date(selectedUserProfile.user.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6">
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center font-bold text-xs">
                        <div className="text-brand-dark/40 uppercase mb-1 text-[9px]">Gems Balance</div>
                        <div className="text-base font-black text-text-main flex items-center justify-center gap-1">
                          💎 {selectedUserProfile.user.gems || 0}
                        </div>
                      </div>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center font-bold text-xs">
                        <div className="text-brand-dark/40 uppercase mb-1 text-[9px]">XP Level</div>
                        <div className="text-base font-black text-text-main">
                          Lvl {selectedUserProfile.user.level || 1} ({selectedUserProfile.user.xp || 0} XP)
                        </div>
                      </div>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center font-bold text-xs">
                        <div className="text-brand-dark/40 uppercase mb-1 text-[9px]">Streak Count</div>
                        <div className="text-base font-black text-text-main flex items-center justify-center gap-1 text-orange-500">
                          🔥 {selectedUserProfile.user.streakCount || 0} Days
                        </div>
                      </div>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-center font-bold text-xs">
                        <div className="text-brand-dark/40 uppercase mb-1 text-[9px]">Target Language</div>
                        <div className="text-base font-black text-text-main">
                          {selectedUserProfile.user.targetLanguage || 'Spanish'}
                        </div>
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="bg-rose-50/20 border border-border dark:border-border rounded-2xl p-5 mb-6">
                      <h4 className="text-xs font-black text-text-main mb-4 uppercase">Administrative Controls</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleBanToggle(selectedUserProfile.user._id, selectedUserProfile.user.isBanned)}
                          className={`px-4 py-2.5 rounded-xl font-black text-xs border flex items-center gap-2 transition ${
                            selectedUserProfile.user.isBanned
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-500'
                              : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-500'
                          }`}
                        >
                          <Ban size={14} />
                          {selectedUserProfile.user.isBanned ? 'Unban User' : 'Ban User'}
                        </button>
                        <button
                          onClick={() => handleResetXP(selectedUserProfile.user._id)}
                          className="px-4 py-2.5 rounded-xl bg-bg-card border border-border dark:border-border hover:bg-bg-main font-black text-xs text-text-main flex items-center gap-2 transition"
                        >
                          <RefreshCw size={14} />
                          Reset XP to 0
                        </button>
                        <button
                          onClick={() => handleResetStreak(selectedUserProfile.user._id)}
                          className="px-4 py-2.5 rounded-xl bg-bg-card border border-border dark:border-border hover:bg-bg-main font-black text-xs text-text-main flex items-center gap-2 transition"
                        >
                          <Flame size={14} />
                          Reset Streak
                        </button>
                        <button
                          onClick={() => handleDeleteUser(selectedUserProfile.user._id)}
                          className="px-4 py-2.5 rounded-xl bg-rose-950/10 hover:bg-rose-950/20 border border-rose-900/30 font-black text-xs text-rose-700 flex items-center gap-2 transition ml-auto"
                        >
                          <Trash2 size={14} />
                          Delete Account Permanent
                        </button>
                        
                        {/* Adjust Balance section */}
                        <div className="w-full border-t border-border dark:border-border pt-4 mt-4 flex flex-col sm:flex-row items-end gap-3 text-text-main">
                          <div className="flex-1 w-full">
                            <label className="block mb-1 text-[9px] uppercase font-black text-brand-dark/40">Adjust Gems (use negative to remove)</label>
                            <input
                              type="number"
                              id="adjust_gems_val"
                              placeholder="e.g. +100 or -50"
                              className="w-full p-2.5 border-2 border-border dark:border-border rounded-xl outline-none text-xs font-semibold"
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="block mb-1 text-[9px] uppercase font-black text-brand-dark/40">Adjust Hearts (use negative to remove)</label>
                            <input
                              type="number"
                              id="adjust_hearts_val"
                              placeholder="e.g. +2 or -1"
                              className="w-full p-2.5 border-2 border-border dark:border-border rounded-xl outline-none text-xs font-semibold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const gemsVal = document.getElementById('adjust_gems_val').value;
                              const heartsVal = document.getElementById('adjust_hearts_val').value;
                              handleAdjustBalance(selectedUserProfile.user._id, gemsVal, heartsVal);
                              document.getElementById('adjust_gems_val').value = '';
                              document.getElementById('adjust_hearts_val').value = '';
                            }}
                            className="bg-brand-purple text-white hover:bg-brand-purple/95 px-5 py-2.5 rounded-xl font-extrabold text-xs btn-3d shadow-3d-purple transition shrink-0 border-0 cursor-pointer w-full sm:w-auto"
                          >
                            Apply Adjustments
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tabs / Logs for profile */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-bold text-xs">
                      <div>
                        <h4 className="text-brand-dark/40 uppercase mb-3 text-[10px]">Lesson History</h4>
                        <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 max-h-56 overflow-y-auto space-y-2 pr-1">
                          {selectedUserProfile.progress?.length > 0 ? (
                            selectedUserProfile.progress.map(p => (
                              <div key={p._id} className="flex justify-between items-center py-2 border-b border-border dark:border-border">
                                <div>
                                  <span className="text-text-main font-extrabold">{p.lessonId?.title || 'Lesson Details'}</span>
                                  <span className="text-[10px] font-semibold text-brand-dark/40 ml-2">({p.lessonId?.language || 'Spanish'})</span>
                                </div>
                                <span className="bg-brand-green/20 text-brand-green border border-brand-green/30 px-2 py-0.5 rounded text-[10px] font-black">Score: {p.score}%</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-brand-dark/40 py-6">No lessons completed yet</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-brand-dark/40 uppercase mb-3 text-[10px]">AI Practice Sessions ({selectedUserProfile.aiSessions?.length || 0})</h4>
                        <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 max-h-56 overflow-y-auto space-y-2 pr-1">
                          {selectedUserProfile.aiSessions?.length > 0 ? (
                            selectedUserProfile.aiSessions.map(s => (
                              <div key={s._id} className="flex justify-between items-center py-2 border-b border-border dark:border-border">
                                <div>
                                  <span className="text-text-main font-extrabold">{s.scenario}</span>
                                  <span className="text-[10px] font-semibold text-brand-purple ml-2">({s.language})</span>
                                </div>
                                <span className="text-[10px] font-black text-text-secondary">{new Date(s.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-brand-dark/40 py-6">No AI practice sessions recorded</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users List & Search */}
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 pb-2 border-b border-border dark:border-border">
                    <h3 className="font-black text-sm text-text-main">Registered Users List</h3>
                    <div className="relative w-full sm:w-64 border border-border dark:border-border rounded-xl bg-bg-main pr-3 flex items-center overflow-hidden">
                      <input
                        type="text"
                        placeholder="Search username or email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-3.5 pr-2 py-2.5 text-xs font-bold bg-transparent outline-none w-full border-none"
                      />
                      <Search size={14} className="text-brand-dark/40" />
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-bold">
                      <thead>
                        <tr className="border-b border-border dark:border-border text-brand-dark/40 uppercase text-[10px]">
                          <th className="pb-3 pl-2">User</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">XP Level</th>
                          <th className="pb-3">Streak</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray/20">
                        {usersList.map((usr) => (
                          <tr key={usr._id} className="hover:bg-bg-main/50 transition">
                            <td className="py-4.5 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-brand-gray/40 overflow-hidden flex items-center justify-center p-1.5">
                                  <img src={usr.avatarUrl} alt="Avatar" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                  <span className="font-black text-text-main">{usr.username}</span>
                                  {usr.role === 'admin' && (
                                    <span className="ml-2 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[8px] font-black px-1 py-0.5 rounded">ADMIN</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4.5 text-brand-dark/70 font-semibold">{usr.email}</td>
                            <td className="py-4.5 text-text-main">Lvl {usr.level || 1} ({usr.xp || 0} XP)</td>
                            <td className="py-4.5 text-orange-500">🔥 {usr.streakCount || 0} Days</td>
                            <td className="py-4.5">
                              {usr.isBanned ? (
                                <span className="bg-rose-500/20 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Banned</span>
                              ) : (
                                <span className="bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">Active</span>
                              )}
                            </td>
                            <td className="py-4.5 pr-2 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleViewUser(usr._id)}
                                  className="p-2 border border-border dark:border-border hover:border-brand-dark rounded-xl text-brand-dark/70 hover:bg-bg-card transition flex items-center gap-1 font-black text-[10px]"
                                >
                                  <Eye size={13} /> View
                                </button>
                                {usr.role !== 'admin' && (
                                  <button
                                    onClick={() => handleBanToggle(usr._id, usr.isBanned)}
                                    className={`p-2 border rounded-xl transition ${
                                      usr.isBanned
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                                        : 'bg-rose-950/10 border-rose-900/30 text-rose-700 hover:bg-rose-950/20'
                                    }`}
                                    title={usr.isBanned ? 'Unban User' : 'Ban User'}
                                  >
                                    <Ban size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {usersList.length === 0 && (
                          <tr>
                            <td colSpan="6" className="text-center text-brand-dark/40 py-10">No users found matching query</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden flex flex-col gap-4 mt-2">
                    {usersList.map((usr) => (
                      <div key={usr._id} className="bg-bg-card border-2 border-border dark:border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3 border-b border-border dark:border-border pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-gray/20 overflow-hidden p-1">
                              <img src={usr.avatarUrl} alt="Avatar" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-text-main text-sm">{usr.username}</span>
                                {usr.role === 'admin' && (
                                  <span className="bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[8px] font-black px-1 py-0.5 rounded">ADMIN</span>
                                )}
                              </div>
                              <div className="text-[10px] text-brand-dark/60 font-bold">{usr.email}</div>
                            </div>
                          </div>
                          <div>
                            {usr.isBanned ? (
                              <span className="bg-rose-500/20 text-rose-500 border border-rose-500/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase">Banned</span>
                            ) : (
                              <span className="bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-2 py-1 rounded-lg text-[9px] font-black uppercase">Active</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold mb-4">
                          <span className="text-text-main">Lvl {usr.level || 1} <span className="text-brand-dark/40">({usr.xp || 0} XP)</span></span>
                          <span className="text-orange-500">🔥 {usr.streakCount || 0} Days</span>
                        </div>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleViewUser(usr._id)}
                            className="flex-1 py-2 border-2 border-border dark:border-border rounded-xl text-text-main hover:bg-bg-main font-black text-xs flex justify-center items-center gap-1.5"
                          >
                            <Eye size={14} /> View User
                          </button>
                          {usr.role !== 'admin' && (
                            <button
                              onClick={() => handleBanToggle(usr._id, usr.isBanned)}
                              className={`p-2 border-2 rounded-xl flex items-center justify-center ${
                                usr.isBanned
                                  ? 'bg-emerald-600 text-white border-emerald-500'
                                  : 'bg-rose-50 text-rose-600 border-rose-200'
                              }`}
                            >
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {usersList.length === 0 && (
                      <div className="text-center text-brand-dark/40 py-8 font-bold text-xs">No users found matching query</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. LESSON MANAGEMENT PANEL */}
            {activeTab === 'lessons' && (
              <div className="space-y-6 fade-in-up">
                {/* Lesson Create / Edit Modal */}
                {showLessonModal && (
                  <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 md:p-8 shadow-3d-card scroll-stripe">
                      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-6">
                        <h3 className="font-black text-base text-text-main">
                          {currentLesson ? `Edit Lesson: ${currentLesson.title}` : 'Create New Lesson'}
                        </h3>
                        <button
                          onClick={() => setShowLessonModal(false)}
                          className="p-1 border border-border dark:border-border rounded-xl text-brand-dark/40 hover:text-text-main hover:bg-bg-main"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form className="space-y-5 text-xs font-bold text-text-main">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Lesson Title</label>
                            <input
                              type="text"
                              required
                              value={lessonForm.title}
                              onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none focus:border-brand-purple"
                              placeholder="e.g. Greetings & Introductions"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Language Course</label>
                            <select
                              value={lessonForm.language}
                              onChange={(e) => setLessonForm({ ...lessonForm, language: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            >
                              <option value="English">English</option>
                              <option value="Spanish">Spanish</option>
                              <option value="French">French</option>
                              <option value="German">German</option>
                              <option value="Arabic">Arabic</option>
                              <option value="Italian">Italian</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Category</label>
                            <select
                              value={lessonForm.category}
                              onChange={(e) => setLessonForm({ ...lessonForm, category: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            >
                              <option value="Vocabulary">Vocabulary</option>
                              <option value="Speaking">Speaking</option>
                              <option value="Grammar">Grammar</option>
                              <option value="Reading">Reading</option>
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Lesson Order (Difficulty)</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={lessonForm.order}
                              onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Unit Number</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={lessonForm.unit}
                              onChange={(e) => setLessonForm({ ...lessonForm, unit: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">XP Reward</label>
                            <input
                              type="number"
                              min="5"
                              max="100"
                              required
                              value={lessonForm.xpReward}
                              onChange={(e) => setLessonForm({ ...lessonForm, xpReward: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Unit Title Description</label>
                          <input
                            type="text"
                            required
                            value={lessonForm.unitTitle}
                            onChange={(e) => setLessonForm({ ...lessonForm, unitTitle: e.target.value })}
                            className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            placeholder="e.g. First Contact & Basics"
                          />
                        </div>

                        {/* Questions list */}
                        <div className="border-t border-border dark:border-border pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-xs uppercase text-text-main">Questions ({lessonForm.questions.length})</h4>
                            <button
                              type="button"
                              onClick={handleAddQuestion}
                              className="px-3 py-1.5 bg-brand-purple text-white hover:bg-purple-600 rounded-lg flex items-center gap-1 font-black text-[10px] transition"
                            >
                              <Plus size={12} /> Add Question
                            </button>
                          </div>

                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {lessonForm.questions.map((q, idx) => (
                              <div key={idx} className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 space-y-3 relative">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestion(idx)}
                                  className="absolute top-4 right-4 p-1 bg-bg-card hover:bg-rose-50 text-rose-500 border border-border dark:border-border rounded-lg"
                                >
                                  <Trash2 size={12} />
                                </button>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                  <div>
                                    <label className="block mb-1 text-brand-dark/40 text-[8px] uppercase">Question Type</label>
                                    <select
                                      value={q.type}
                                      onChange={(e) => handleQuestionChange(idx, 'type', e.target.value)}
                                      className="w-full p-2 bg-bg-card border border-border dark:border-border rounded-lg outline-none"
                                    >
                                      <option value="multiple-choice">Multiple Choice</option>
                                      <option value="translate">Translate phrase</option>
                                      <option value="fill-blank">Fill in the blank</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block mb-1 text-brand-dark/40 text-[8px] uppercase">Prompt / Question Text</label>
                                    <input
                                      type="text"
                                      required
                                      value={q.prompt}
                                      onChange={(e) => handleQuestionChange(idx, 'prompt', e.target.value)}
                                      className="w-full p-2 bg-bg-card border border-border dark:border-border rounded-lg outline-none"
                                      placeholder="e.g. How do you say 'Water'?"
                                    />
                                  </div>
                                </div>

                                {q.type !== 'translate' && (
                                  <div>
                                    <label className="block mb-1 text-brand-dark/40 text-[8px] uppercase">Options / Choices (Provide 4)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {q.options.map((opt, oIdx) => (
                                        <input
                                          key={oIdx}
                                          type="text"
                                          required
                                          value={opt}
                                          onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                                          className="w-full p-2 bg-bg-card border border-border dark:border-border rounded-lg outline-none"
                                          placeholder={`Option ${oIdx + 1}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="block mb-1 text-brand-dark/40 text-[8px] uppercase">Correct Answer (Matches exact choice or translation)</label>
                                  <input
                                    type="text"
                                    required
                                    value={q.correctAnswer}
                                    onChange={(e) => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                                    className="w-full p-2 bg-bg-card border border-border dark:border-border rounded-lg outline-none"
                                    placeholder="Correct answer text"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-border">
                          <button
                            type="button"
                            onClick={() => setShowLessonModal(false)}
                            className="px-5 py-3 border-2 border-border dark:border-border hover:bg-bg-main font-black rounded-xl"
                          >
                            Cancel
                          </button>
                          <Button
                            variant="custom"
                            type="button"
                            onClick={handleSaveLesson}
                            className="px-5 py-3 bg-brand-green text-text-main font-black rounded-xl shadow-md shadow-brand-green/20"
                          >
                            Save Lesson config
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Lesson Table */}
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-border dark:border-border">
                    <h3 className="font-black text-sm text-text-main">Curriculum Lessons</h3>
                    <button
                      onClick={openCreateLesson}
                      className="px-4 py-2 bg-brand-green text-text-main font-black text-xs rounded-xl shadow-md shadow-brand-green/20 flex items-center gap-1.5 transition"
                    >
                      <Plus size={15} /> Create Lesson
                    </button>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-bold">
                      <thead>
                        <tr className="border-b border-border dark:border-border text-brand-dark/40 uppercase text-[10px]">
                          <th className="pb-3 pl-2">Language</th>
                          <th className="pb-3">Lesson Title</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Unit</th>
                          <th className="pb-3">Order</th>
                          <th className="pb-3">XP Reward</th>
                          <th className="pb-3 pr-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-gray/20">
                        {lessonsList.map((lsn) => (
                          <tr key={lsn._id} className="hover:bg-bg-main/50 transition">
                            <td className="py-4 pl-2">
                              <span className="bg-slate-200 border border-slate-300 text-text-main text-[10px] font-black px-2 py-0.5 rounded">
                                {lsn.language}
                              </span>
                            </td>
                            <td className="py-4 text-text-main font-black">{lsn.title}</td>
                            <td className="py-4 text-brand-dark/70 font-semibold">{lsn.category || 'Vocabulary'}</td>
                            <td className="py-4 text-brand-dark/50">U{lsn.unit || 1}: {lsn.unitTitle || 'Basics'}</td>
                            <td className="py-4 text-text-main">{lsn.order || 1}</td>
                            <td className="py-4 text-brand-green font-black">{lsn.xpReward || 15} XP</td>
                            <td className="py-4 pr-2 text-right">
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => openEditLesson(lsn)}
                                  className="p-2 border border-border dark:border-border hover:border-brand-dark rounded-xl text-brand-dark/70 hover:bg-bg-card transition"
                                  title="Edit Lesson"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lsn._id)}
                                  className="p-2 border border-rose-200 hover:border-rose-400 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                                  title="Delete Lesson"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden flex flex-col gap-4 mt-2">
                    {lessonsList.map((lsn) => (
                      <div key={lsn._id} className="bg-bg-card border-2 border-border dark:border-border rounded-2xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="bg-slate-200 border border-slate-300 text-text-main text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wide">
                            {lsn.language}
                          </span>
                          <span className="text-brand-green font-black text-xs">+{lsn.xpReward || 15} XP</span>
                        </div>
                        <h4 className="font-black text-text-main text-sm mb-1">{lsn.title}</h4>
                        <div className="text-[10px] text-brand-dark/60 font-bold mb-4">
                          Unit {lsn.unit || 1}: {lsn.unitTitle || 'Basics'} • {lsn.category || 'Vocabulary'}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditLesson(lsn)}
                            className="flex-1 py-2 border-2 border-border dark:border-border rounded-xl text-text-main hover:bg-bg-main font-black text-xs flex justify-center items-center gap-1.5"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lsn._id)}
                            className="p-2 border-2 border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {lessonsList.length === 0 && (
                      <div className="text-center text-brand-dark/40 py-8 font-bold text-xs">No lessons defined yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ACHIEVEMENTS LIST PANEL */}
            {activeTab === 'achievements' && (
              <div className="space-y-6 fade-in-up">
                {/* Achievement Create / Edit Modal */}
                {showAchievementModal && (
                  <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-3d-card">
                      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-6">
                        <h3 className="font-black text-base text-text-main">
                          {currentAchievement ? 'Edit Achievement' : 'Create New Achievement'}
                        </h3>
                        <button
                          onClick={() => setShowAchievementModal(false)}
                          className="p-1 border border-border dark:border-border rounded-xl text-brand-dark/40 hover:text-text-main hover:bg-bg-main"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form className="space-y-5 text-xs font-bold text-text-main">
                        <div>
                          <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Unique ID identifier</label>
                          <input
                            type="text"
                            required
                            disabled={!!currentAchievement}
                            value={achievementForm.id}
                            onChange={(e) => setAchievementForm({ ...achievementForm, id: e.target.value })}
                            className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none focus:border-brand-purple disabled:bg-brand-gray/20"
                            placeholder="e.g. xp_level_10"
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Display Name</label>
                          <input
                            type="text"
                            required
                            value={achievementForm.name}
                            onChange={(e) => setAchievementForm({ ...achievementForm, name: e.target.value })}
                            className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            placeholder="e.g. Master Learner"
                          />
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Description Text</label>
                          <input
                            type="text"
                            required
                            value={achievementForm.description}
                            onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })}
                            className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            placeholder="e.g. Reach level 10 inside any course"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Metric Trigger</label>
                            <select
                              value={achievementForm.requireType}
                              onChange={(e) => setAchievementForm({ ...achievementForm, requireType: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            >
                              <option value="xp">Total XP Earned</option>
                              <option value="streak">Active Streak Count</option>
                              <option value="lessons">Total Lessons Completed</option>
                              <option value="unit">Specific Unit Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Target value trigger</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={achievementForm.requireValue}
                              onChange={(e) => setAchievementForm({ ...achievementForm, requireValue: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-border">
                          <button
                            type="button"
                            onClick={() => setShowAchievementModal(false)}
                            className="px-5 py-3 border-2 border-border dark:border-border hover:bg-bg-main font-black rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-3 bg-brand-green text-text-main font-black rounded-xl"
                          >
                            Save Achievement
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Achievements Table */}
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-border dark:border-border">
                    <h3 className="font-black text-sm text-text-main">Dynamic Achievements</h3>
                    <button
                      onClick={openCreateAchievement}
                      className="px-4 py-2 bg-brand-green text-text-main font-black text-xs rounded-xl shadow-md shadow-brand-green/20 flex items-center gap-1.5 transition"
                    >
                      <Plus size={15} /> Create Achievement
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievementsList.map((ach) => (
                      <div key={ach._id || ach.id} className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-5 shadow-sm hover:scale-[1.01] transition-all flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-amber-500/10 border-2 border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600">
                            <Trophy size={20} />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-text-main">{ach.name}</h4>
                            <p className="text-[10px] text-brand-dark/40 font-bold mt-0.5">{ach.description}</p>
                            <span className="inline-block bg-slate-200 text-text-main text-[8px] font-black px-1.5 py-0.5 rounded mt-2.5 uppercase tracking-wide">
                              Trigger: {ach.requireType} ({ach.requireValue})
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 pl-4">
                          <button
                            onClick={() => openEditAchievement(ach)}
                            className="p-1.5 border border-border dark:border-border hover:border-brand-dark rounded-lg text-brand-dark/70 bg-bg-card"
                          >
                            <Edit2 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteAchievement(ach._id || ach.id)}
                            className="p-1.5 border border-rose-200 rounded-lg text-rose-500 bg-bg-card hover:bg-rose-50"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {achievementsList.length === 0 && (
                      <div className="col-span-2 text-center text-brand-dark/40 py-10 font-bold text-xs">
                        No dynamic achievements created. System is currently falling back to default static achievements.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STORE MANAGEMENT PANEL */}
            {activeTab === 'store' && (
              <div className="space-y-6 fade-in-up font-sans">
                {/* Modal for Create/Edit Store Item */}
                {showStoreModal && (
                  <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-3d-card">
                      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-6">
                        <h3 className="font-black text-base text-text-main">
                          {currentStoreItem ? 'Edit Store Item' : 'Create Store Item'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowStoreModal(false)}
                          className="p-1 border border-border dark:border-border rounded-xl text-brand-dark/40 hover:text-text-main hover:bg-bg-main cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs font-bold text-text-main">
                        <div>
                          <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Item ID (Identifier)</label>
                          <input
                            type="text"
                            required
                            disabled={!!currentStoreItem}
                            value={storeForm.itemId}
                            onChange={(e) => setStoreForm({ ...storeForm, itemId: e.target.value })}
                            className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none disabled:bg-brand-gray/20 font-mono"
                            placeholder="e.g. double_xp_token"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Display Name</label>
                            <input
                              type="text"
                              required
                              value={storeForm.name}
                              onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                              placeholder="e.g. Double XP"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Emoji Icon</label>
                            <input
                              type="text"
                              required
                              value={storeForm.icon}
                              onChange={(e) => setStoreForm({ ...storeForm, icon: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none text-center text-lg"
                              placeholder="e.g. ⚡"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Description</label>
                          <textarea
                            required
                            value={storeForm.description}
                            onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                            className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none resize-none"
                            rows={3}
                            placeholder="Describe what this item does..."
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Price (Gems)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={storeForm.price}
                              onChange={(e) => setStoreForm({ ...storeForm, price: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Category</label>
                            <select
                              value={storeForm.category}
                              onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            >
                              <option value="boosts">Boosts</option>
                              <option value="protection">Protection</option>
                              <option value="tools">Tools</option>
                              <option value="avatars">Avatars</option>
                              <option value="special">Special</option>
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Max Ownable</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={storeForm.maxOwnable}
                              onChange={(e) => setStoreForm({ ...storeForm, maxOwnable: e.target.value })}
                              className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-border">
                          <button>
                          
                            variant="custom"
                            type="button"
                            onClick={() => setShowStoreModal(false)}
                            className="px-5 py-3 border-2 border-border dark:border-border hover:bg-bg-main font-black rounded-xl cursor-pointer text-xs"
                          
                            Cancel
                          </button>
                          <Button
                            variant="custom"
                            type="button"
                            onClick={handleSaveStoreItem}
                            className="px-5 py-3 bg-brand-green text-text-main font-black rounded-xl shadow-md shadow-brand-green/20 cursor-pointer text-xs border-0"
                          >
                            Save Item
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Grid */}
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-border dark:border-border">
                    <div>
                      <h3 className="font-black text-sm text-text-main">Shop Items Inventory</h3>
                      <p className="text-[10px] text-brand-dark/40 font-bold mt-0.5">Manage power-ups and items listed in LingoLeap store</p>
                    </div>
                    <button
                      onClick={openCreateStoreItem}
                      className="px-4 py-2 bg-brand-green text-text-main font-black text-xs rounded-xl shadow-md shadow-brand-green/20 flex items-center gap-1.5 transition cursor-pointer border-0"
                    >
                      <Plus size={15} /> Create Store Item
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeItemsList.map((item) => (
                      <div key={item._id || item.itemId} className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-5 shadow-sm hover:scale-[1.01] transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="text-3xl">{item.icon}</span>
                            <span className="bg-slate-200 border border-slate-300 text-text-main text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-text-main leading-tight">{item.name}</h4>
                          <p className="text-[10px] text-brand-dark/50 font-bold mt-1 leading-normal">{item.description}</p>
                        </div>
                        
                        <div className="border-t border-border dark:border-border pt-3 mt-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1 text-brand-purple font-black text-xs">
                              <Gem size={12} /> {item.price === 0 ? 'Free' : `${item.price} Gems`}
                            </div>
                            <div className="text-[8px] text-brand-dark/30 font-semibold mt-0.5">Max Ownable: {item.maxOwnable}</div>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditStoreItem(item)}
                              className="p-1.5 border border-border dark:border-border hover:border-brand-dark rounded-lg text-brand-dark/70 bg-bg-card cursor-pointer"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteStoreItem(item._id || item.itemId)}
                              className="p-1.5 border border-rose-200 rounded-lg text-rose-500 bg-bg-card hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {storeItemsList.length === 0 && (
                      <div className="col-span-3 text-center text-brand-dark/40 py-10 font-bold text-xs">
                        No store items defined yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TRANSACTIONS HISTORY PANEL */}
            {activeTab === 'payments' && (
              <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card fade-in-up font-sans">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-border dark:border-border gap-4">
                  <h3 className="font-black text-sm text-text-main flex items-center gap-2">
                    <Gem size={16} className="text-brand-purple" /> User Purchase Transaction Logs
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="bg-bg-main border border-border dark:border-border rounded-xl px-3 py-1.5 flex gap-3 text-[10px] font-black">
                      <span className="text-brand-green">Successful: {stats?.successfulPayments || 0}</span>
                      <span className="text-rose-500">Failed: {stats?.failedPayments || 0}</span>
                    </div>
                    <button
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8," 
                          + "Date,User,Email,Package,Gems,Price,Method,Status\n" 
                          + transactionsList.map(tx => {
                              return `${new Date(tx.createdAt).toLocaleString()},${tx.userId?.username || 'Learner'},${tx.userId?.email || 'unknown'},${tx.packageId},${tx.gemsAmount},${tx.price},${tx.paymentMethod},${tx.status || 'Completed'}`;
                            }).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "lingoleap_transactions.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-3 py-1.5 bg-brand-dark text-white rounded-xl font-bold text-[10px] hover:bg-brand-dark/90 transition shadow-md border-0 cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-bold">
                    <thead>
                      <tr className="border-b border-border dark:border-border text-brand-dark/40 uppercase text-[10px]">
                        <th className="pb-3 pl-2">Date / Time</th>
                        <th className="pb-3">User</th>
                        <th className="pb-3">Package ID</th>
                        <th className="pb-3 text-center">Gems Quantity</th>
                        <th className="pb-3 text-center">USD Price Paid</th>
                        <th className="pb-3 text-center">Status</th>
                        <th className="pb-3 text-right pr-2">Payment Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-gray/20">
                      {transactionsList.map((tx) => (
                        <tr key={tx._id} className="hover:bg-bg-main/50 transition">
                          <td className="py-4 pl-2 font-semibold text-brand-dark/50">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <div className="text-text-main font-black">{tx.userId?.username || 'Learner'}</div>
                            <div className="text-[9px] text-brand-dark/40 font-semibold">{tx.userId?.email || 'unknown'}</div>
                          </td>
                          <td className="py-4 text-brand-dark/70 font-mono font-bold">{tx.packageId}</td>
                          <td className="py-4 text-center text-brand-purple font-black">+{tx.gemsAmount} 💎</td>
                          <td className="py-4 text-center text-brand-green font-black">${tx.price}</td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              (!tx.status || tx.status === 'Completed') 
                                ? 'bg-brand-green/10 text-brand-green' 
                                : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {tx.status || 'Completed'}
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2 font-semibold text-brand-dark/60">
                            <span>{tx.paymentMethod}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4 mt-2">
                  {transactionsList.map((tx) => (
                    <div key={tx._id} className="bg-bg-card border-2 border-border dark:border-border rounded-2xl p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3 border-b border-border dark:border-border pb-2">
                        <div className="text-[10px] font-semibold text-brand-dark/50">{new Date(tx.createdAt).toLocaleString()}</div>
                        <div className="bg-brand-green/10 text-brand-green px-2 py-0.5 rounded text-[10px] font-black">${tx.price}</div>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gray/20 flex items-center justify-center font-black text-text-main">
                          {tx.userId?.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-black text-text-main text-sm">{tx.userId?.username || 'Learner'}</div>
                          <div className="text-[10px] text-brand-dark/40 font-bold">{tx.userId?.email || 'unknown'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold border-t border-border dark:border-border pt-3">
                        <div>
                          <div className="text-[9px] text-brand-dark/40 uppercase mb-0.5">Package</div>
                          <div className="text-brand-dark/70 font-mono">{tx.packageId}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-brand-dark/40 uppercase mb-0.5">Gems</div>
                          <div className="text-brand-purple font-black">+{tx.gemsAmount} 💎</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactionsList.length === 0 && (
                    <div className="text-center text-brand-dark/40 py-8 font-bold text-xs">
                      No purchases recorded yet. Launch a promotion event or purchase test packs!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SYSTEM CONFIG PANEL */}
            {activeTab === 'config' && (
              <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card fade-in-up font-sans max-w-xl">
                <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                  <Settings size={16} className="text-brand-purple" /> Global Gamification Config Settings
                </h3>

                <div className="space-y-4 text-xs font-bold text-text-main">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Max Hearts limit</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="20"
                        value={configSettings.maxHearts}
                        onChange={(e) => setConfigSettings({ ...configSettings, maxHearts: Number(e.target.value) })}
                        className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Starting Gems allocation</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={configSettings.startingGems}
                        onChange={(e) => setConfigSettings({ ...configSettings, startingGems: Number(e.target.value) })}
                        className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 uppercase font-black text-brand-dark/40 text-[9px]">Heart Regeneration interval (minutes)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="1440"
                      value={configSettings.heartRegenMinutes}
                      onChange={(e) => setConfigSettings({ ...configSettings, heartRegenMinutes: Number(e.target.value) })}
                      className="w-full p-3 border-2 border-border dark:border-border rounded-xl outline-none"
                    />
                    <span className="text-[10px] text-brand-dark/40 font-semibold block mt-1">E.g., 30 minutes adds 1 heart automatically up to the max hearts limit.</span>
                  </div>

                  <Button
                    variant="custom"
                    type="button"
                    onClick={handleSaveConfig}
                    className="mt-6 px-6 py-3 bg-brand-purple text-white font-black rounded-xl shadow-md shadow-brand-purple/20 flex items-center gap-2 transition hover:bg-purple-600 disabled:opacity-50"
                  >
                    <Save size={16} /> Save Config Settings
                  </Button>
                </div>
              </div>
            )}

            {/* EVENT CAMPAIGNS PANEL */}
            {activeTab === 'events' && (
              <div className="space-y-6 fade-in-up font-sans max-w-4xl">
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                    <Gift size={16} className="text-brand-purple" /> Global Event Campaigns
                  </h3>
                  <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mb-6">
                    Launch live events to instantly award free resources to all students or enable XP/progress multipliers.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Double XP */}
                    <div className="border-2 border-border dark:border-border hover:border-brand-purple/40 rounded-2xl p-5 flex flex-col justify-between items-start transition-all bg-bg-main">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange flex items-center justify-center text-lg mb-3">⚡</div>
                        <h4 className="font-black text-xs text-text-main">Launch Double XP Event</h4>
                        <p className="text-[10px] text-brand-dark/50 font-bold mt-1 leading-normal">
                          Enable platform-wide 2× XP boost for all lessons completed. Simulates double XP settings.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLaunchEvent('double_xp')}
                        disabled={launchingEvent}
                        className="mt-4 px-4 py-2 bg-brand-purple text-white font-extrabold text-[10px] rounded-lg btn-3d shadow-3d-purple border-0 cursor-pointer animate-pulse"
                      >
                        Launch Double XP
                      </button>
                    </div>



                    {/* Free Hearts */}
                    <div className="border-2 border-border dark:border-border hover:border-brand-purple/40 rounded-2xl p-5 flex flex-col justify-between items-start transition-all bg-bg-main">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center text-lg mb-3">❤️</div>
                        <h4 className="font-black text-xs text-text-main font-black">Launch Free Hearts Event (Refill All)</h4>
                        <p className="text-[10px] text-brand-dark/50 font-bold mt-1 leading-normal">
                          Refill hearts to their maximum limit for all currently registered users.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLaunchEvent('free_hearts')}
                        disabled={launchingEvent}
                        className="mt-4 px-4 py-2 bg-brand-purple text-white font-extrabold text-[10px] rounded-lg btn-3d shadow-3d-purple border-0 cursor-pointer animate-pulse"
                      >
                        Refill All Hearts
                      </button>
                    </div>

                    {/* Weekend Rewards */}
                    <div className="border-2 border-border dark:border-border hover:border-brand-purple/40 rounded-2xl p-5 flex flex-col justify-between items-start transition-all bg-bg-main">
                      <div>
                        <div className="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 text-brand-green flex items-center justify-center text-lg mb-3">🎉</div>
                        <h4 className="font-black text-xs text-text-main font-black">Launch Weekend Rewards Event</h4>
                        <p className="text-[10px] text-brand-dark/50 font-bold mt-1 leading-normal">
                          Award a special +50 Gems bonus and refill all user hearts to celebrate the weekend.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLaunchEvent('weekend_rewards')}
                        disabled={launchingEvent}
                        className="mt-4 px-4 py-2 bg-brand-purple text-white font-extrabold text-[10px] rounded-lg btn-3d shadow-3d-purple border-0 cursor-pointer animate-pulse"
                      >
                        Launch Weekend Reward
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ONBOARDING PREFERENCES PANEL */}
            {activeTab === 'onboarding' && onboardingConfig && (
              <div className="space-y-6 fade-in-up">
                {/* Onboarding Config Display */}
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-border dark:border-border">
                    <div>
                      <h3 className="font-black text-sm text-text-main">Onboarding Config (Dynamic JSON)</h3>
                      <p className="text-[10px] text-brand-dark/40 font-bold mt-0.5">Manage languages, learning motivations, and goals available to new users.</p>
                    </div>
                    <button
                      onClick={() => {
                        setOnboardingForm(JSON.parse(JSON.stringify(onboardingConfig)));
                        setShowOnboardingModal(true);
                      }}
                      className="px-4 py-2 bg-brand-green text-text-main font-black text-xs rounded-xl shadow-md shadow-brand-green/20 flex items-center gap-1.5 transition"
                    >
                      <Edit2 size={14} /> Edit Configuration JSON
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-bold">
                    <div>
                      <h4 className="text-[10px] uppercase text-brand-dark/40 mb-2">Native Language Options</h4>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 flex flex-wrap gap-2 pr-1 max-h-40 overflow-y-auto">
                        {onboardingConfig.nativeLanguages?.map((lang, index) => (
                          <span key={index} className="bg-bg-card border border-border dark:border-border rounded-xl px-3 py-1.5 flex items-center gap-1">
                            <span>{lang.flag}</span> <span>{lang.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] uppercase text-brand-dark/40 mb-2">Target Course Languages</h4>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 flex flex-wrap gap-2 pr-1 max-h-40 overflow-y-auto">
                        {onboardingConfig.targetLanguages?.map((lang, index) => (
                          <span key={index} className="bg-bg-card border border-border dark:border-border rounded-xl px-3 py-1.5 flex items-center gap-1">
                            <span>{lang.flag}</span> <span>{lang.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h4 className="text-[10px] uppercase text-brand-dark/40 mb-2">Learning Goals Motivations</h4>
                      <div className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 space-y-2 pr-1 max-h-44 overflow-y-auto">
                        {onboardingConfig.learningGoals?.map((goal, index) => (
                          <div key={index} className="bg-bg-card border border-border dark:border-border rounded-xl p-3 flex justify-between items-center">
                            <div>
                              <div className="text-text-main text-xs font-black">{goal.label}</div>
                              <div className="text-[9px] text-brand-dark/50 font-semibold">{goal.desc}</div>
                            </div>
                            <span className="text-[9px] bg-brand-gray/40 px-2 py-0.5 rounded font-black text-brand-dark/60">{goal.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit JSON Editor Modal */}
                {showOnboardingModal && onboardingForm && (
                  <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-3d-card flex flex-col max-h-[85vh]">
                      <div className="flex items-center justify-between pb-4 border-b border-border dark:border-border mb-4">
                        <h3 className="font-black text-base text-text-main">Edit Onboarding Options (JSON Format)</h3>
                        <button
                          onClick={() => setShowOnboardingModal(false)}
                          className="p-1 border border-border dark:border-border rounded-xl text-brand-dark/40 hover:text-text-main hover:bg-bg-main"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form className="flex-1 flex flex-col justify-between overflow-hidden">
                        <div className="flex-1 overflow-y-auto mb-4 font-mono text-[11px] leading-relaxed">
                          <p className="text-[10px] font-bold text-amber-600 mb-2 font-sans">
                            📝 Warning: Please ensure the JSON markup is correct. Ensure keys like `nativeLanguages`, `targetLanguages`, and `learningGoals` remain present.
                          </p>
                          <textarea
                            value={JSON.stringify(onboardingForm, null, 2)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setOnboardingForm(parsed);
                              } catch (err) {
                                // temporarily allow typing invalid json
                              }
                            }}
                            className="w-full h-80 p-4 border border-border dark:border-border bg-slate-900 text-slate-100 rounded-xl outline-none focus:border-brand-purple scroll-stripe"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-border">
                          <button
                            type="button"
                            onClick={() => setShowOnboardingModal(false)}
                            className="px-5 py-3 border-2 border-border dark:border-border hover:bg-bg-main font-black rounded-xl text-xs"
                          >
                            Cancel
                          </button>
                          <Button
                            variant="custom"
                            type="button"
                            onClick={handleSaveOnboarding}
                            className="px-5 py-3 bg-brand-green text-text-main font-black rounded-xl text-xs"
                          >
                            Save Options
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. SOCIAL MODERATION PANEL */}
            {activeTab === 'moderation' && (
              <div className="space-y-6 fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Abusive User Reports */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                    <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                      <ShieldAlert size={16} className="text-rose-500" /> User Reports Pending
                    </h3>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {reportsList.map((rep) => (
                        <div key={rep._id} className="bg-bg-main border-2 border-border dark:border-border rounded-2xl p-4 text-xs font-bold">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-brand-dark/40">Reported:</span>
                              <span className="text-rose-600 ml-1">{rep.reportedUsername}</span>
                            </div>
                            <span className={`text-[8px] uppercase px-2 py-0.5 rounded-full font-black ${
                              rep.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                                : 'bg-slate-300 text-text-main'
                            }`}>
                              {rep.status}
                            </span>
                          </div>

                          <div className="text-text-main mb-2">
                            <span className="text-[10px] text-brand-dark/40 block mb-0.5 uppercase">Reason:</span>
                            <span>{rep.reason}</span>
                          </div>

                          <div className="bg-bg-card rounded-lg p-2.5 border border-border dark:border-border text-[10px] text-brand-dark/60 font-semibold mb-3">
                            {rep.details || 'No additional details provided'}
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-semibold text-brand-dark/30">Reporter: {rep.reporterUsername}</span>
                            {rep.status === 'pending' && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleResolveReport(rep._id, 'resolved')}
                                  className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] hover:bg-emerald-700 transition"
                                >
                                  Resolve
                                </button>
                                <button
                                  onClick={() => handleResolveReport(rep._id, 'ignored')}
                                  className="px-2.5 py-1.5 bg-brand-gray/60 hover:bg-brand-gray/80 text-brand-dark/70 rounded-lg font-black text-[9px] transition"
                                >
                                  Ignore
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {reportsList.length === 0 && (
                        <div className="text-center text-brand-dark/40 py-10">No pending reports reported. Good job!</div>
                      )}
                    </div>
                  </div>

                  {/* Chat Moderation panel */}
                  <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                    <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                      <MessageSquare size={16} className="text-brand-purple" /> Global Messages Stream
                    </h3>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {chatLogs.map((msg) => (
                        <div key={msg._id} className="bg-bg-main border border-border dark:border-border rounded-xl p-3 flex justify-between items-start text-[10px] font-bold">
                          <div className="space-y-1 w-[80%]">
                            <div className="flex items-center gap-1.5 text-brand-dark/40">
                              <span className="text-brand-purple">User ID: {msg.sender}</span>
                              <span>→</span>
                              <span>User ID: {msg.recipient}</span>
                            </div>
                            <div className="text-text-main text-xs font-semibold break-all">"{msg.text || '[Sticker or Audio message]'}"</div>
                            <div className="text-[8px] text-brand-dark/30 font-semibold">{new Date(msg.createdAt).toLocaleString()}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="p-1.5 border border-rose-200 hover:border-rose-400 rounded-lg text-rose-500 bg-bg-card hover:bg-rose-50 transition"
                            title="Delete / Moderate Message Content"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ))}
                      {chatLogs.length === 0 && (
                        <div className="text-center text-brand-dark/40 py-10">No global message logs recorded in fallback window</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
                          {/* 7. SECURITY AUDIT LOG PANEL */}
            {activeTab === 'audit' && (
              <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card fade-in-up">
                <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                  <ClipboardList size={16} className="text-brand-purple" /> Action Security Audit Trail
                </h3>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 text-xs font-bold">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="bg-bg-main border border-border dark:border-border rounded-2xl p-4 flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-brand-green border border-slate-800">
                        <ShieldCheck size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="bg-brand-purple/10 text-brand-purple border border-brand-purple/20 px-2.5 py-0.5 rounded text-[9px] font-black uppercase">
                              {log.action}
                            </span>
                            <span className="text-text-main font-extrabold ml-2">by Admin {log.adminUsername}</span>
                          </div>
                          <span className="text-[9px] font-semibold text-brand-dark/30">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-brand-dark/65 font-semibold mt-1.5">{log.details}</p>
                        {log.targetId && (
                          <div className="text-[9px] text-text-secondary font-semibold mt-1">Target ID: {log.targetId} ({log.targetType})</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && (
                    <div className="text-center text-brand-dark/40 py-10">No action logs found. Security audit trail is currently empty.</div>
                  )}
                </div>
              </div>
            )}

            {/* 8. REWARDS CENTER */}
            {activeTab === 'rewards' && (
              <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card fade-in-up font-sans max-w-4xl">
                <h3 className="font-black text-sm text-text-main mb-4 pb-2 border-b border-border dark:border-border flex items-center gap-2">
                  <Gift size={16} className="text-brand-purple" /> Admin Rewards Center
                </h3>
                <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mb-6">
                  Distribute virtual items, gems, hearts, or XP multipliers directly to specific learners, groups of learners, or all active users.
                </p>

                <form className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Reward Type */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-dark/60 uppercase">Reward Type</label>
                      <select
                        value={rewardForm.rewardType}
                        onChange={(e) => setRewardForm(prev => ({ ...prev, rewardType: e.target.value, rewardItem: '' }))}
                        className="w-full bg-white dark:bg-bg-card border-2 border-border p-3 rounded-xl font-bold text-xs"
                      >
                        <option value="gems">💎 Gems Gift</option>
                        <option value="hearts">❤️ Hearts Refill</option>
                        <option value="xp">⚡ XP Award</option>
                        <option value="badges">📛 Badges</option>
                        <option value="special">🎁 Special Rewards Item</option>
                      </select>
                    </div>

                    {/* Amount or Special Item Selection */}
                    {['special', 'badges'].includes(rewardForm.rewardType) ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-brand-dark/60 uppercase">{rewardForm.rewardType === 'badges' ? 'Badge Name / Details' : 'Special Item Details / Description'}</label>
                        <input
                          type="text"
                          required
                          value={rewardForm.rewardItem}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, rewardItem: e.target.value }))}
                          placeholder={rewardForm.rewardType === 'badges' ? "e.g. Early Adopter Badge" : "e.g. Golden Frame, Hint Pack (x5)"}
                          className="w-full bg-white dark:bg-bg-card border-2 border-border p-3 rounded-xl font-bold text-xs"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-brand-dark/60 uppercase">Amount to Gift</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={rewardForm.amount}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full bg-white dark:bg-bg-card border-2 border-border p-3 rounded-xl font-bold text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Target Option */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-brand-dark/60 uppercase">Recipient Criteria</label>
                      <select
                        value={rewardForm.targetType}
                        onChange={(e) => setRewardForm(prev => ({ ...prev, targetType: e.target.value, targetUserIds: [] }))}
                        className="w-full bg-white dark:bg-bg-card border-2 border-border p-3 rounded-xl font-bold text-xs"
                      >
                        <option value="individual">1. Select Individual User</option>
                        <option value="multiple">2. Select Multiple Users</option>
                        <option value="all">3. Select All Registered Users</option>
                        <option value="top_xp">4a. Select Top Users: XP Overall</option>
                        <option value="top_leaderboard">4b. Select Top Users: Leaderboard XP (Weekly)</option>
                        <option value="top_streak">4c. Select Top Users: Active Streak</option>
                      </select>
                    </div>

                    {/* Count for top selection */}
                    {rewardForm.targetType.startsWith('top_') && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-brand-dark/60 uppercase">Number of Top Users to Reward</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={100}
                          value={rewardForm.count}
                          onChange={(e) => setRewardForm(prev => ({ ...prev, count: Number(e.target.value) }))}
                          className="w-full bg-white dark:bg-bg-card border-2 border-border p-3 rounded-xl font-bold text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* User Selection Checkbox checklist */}
                  {(rewardForm.targetType === 'individual' || rewardForm.targetType === 'multiple') && (
                    <div className="space-y-2 border border-border p-4 rounded-2xl bg-bg-main/30 dark:bg-bg-main/5">
                      <label className="text-xs font-black text-brand-dark/60 uppercase">Select Recipient(s)</label>
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search users by username..."
                        className="w-full bg-white dark:bg-bg-card border border-border p-2 rounded-xl font-bold text-xs mb-2"
                      />
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                        {usersList
                          .filter(u => u.username.toLowerCase().includes(userSearchQuery.toLowerCase()))
                          .map(u => {
                            const isChecked = rewardForm.targetUserIds.includes(u._id);
                            return (
                              <label key={u._id} className="flex items-center gap-2 p-2 hover:bg-bg-main/80 rounded-lg cursor-pointer text-xs font-bold">
                                <input
                                  type={rewardForm.targetType === 'individual' ? "radio" : "checkbox"}
                                  name="recipient_users"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (rewardForm.targetType === 'individual') {
                                      setRewardForm(prev => ({ ...prev, targetUserIds: [u._id] }));
                                    } else {
                                      const nextIds = isChecked
                                        ? rewardForm.targetUserIds.filter(id => id !== u._id)
                                        : [...rewardForm.targetUserIds, u._id];
                                      setRewardForm(prev => ({ ...prev, targetUserIds: nextIds }));
                                    }
                                  }}
                                  className="accent-primary"
                                />
                                <span className="text-text-main">{u.username}</span>
                                <span className="text-[10px] text-brand-dark/45 font-semibold truncate">({u.email})</span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="custom"
                    type="button"
                    onClick={handleGiftRewardsSubmit}
                    disabled={giftingReward}
                    className="w-full md:w-auto px-6 py-3 bg-brand-green text-text-main font-black text-xs rounded-xl cursor-pointer border-0 btn-3d shadow-3d-green hover:bg-brand-green-hover transition shadow-sm uppercase tracking-wider"
                  >
                    Distribute Reward Gift
                  </Button>
                </form>
              </div>
            )}

            {/* 9. ANNOUNCEMENT CENTER */}
            {activeTab === 'announcements' && (
              <div className="space-y-6 fade-in-up font-sans max-w-4xl">
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-sm text-text-main flex items-center gap-2">
                      <Megaphone size={16} className="text-brand-purple" /> Admin Announcement Center
                    </h3>
                    <p className="text-xs font-semibold text-brand-dark/50 leading-relaxed mt-1">
                      Publish system updates, feature releases, events, or maintenance notices targeted to all learners or specific users.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingAnnouncement(false);
                      setAnnouncementForm({
                        title: '', content: '', type: 'update', targetGroup: 'all', targetUsers: [], status: 'sent', scheduledFor: ''
                      });
                      setAnnouncementModalOpen(true);
                    }}
                    className="px-5 py-3 bg-brand-green text-text-main font-black text-xs rounded-xl cursor-pointer border-0 btn-3d shadow-3d-green hover:bg-brand-green-hover transition whitespace-nowrap"
                  >
                    Create Announcement
                  </button>
                </div>

                {/* List of Announcements */}
                <div className="bg-bg-card border-2 border-border dark:border-border rounded-3xl p-6 shadow-3d-card">
                  <h4 className="text-text-main font-black text-xs uppercase mb-4 tracking-wider">Announcement History</h4>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {announcementsList.map(ann => (
                      <div key={ann._id} className="bg-bg-main border border-border dark:border-border rounded-2xl p-4 flex flex-col justify-between md:flex-row gap-4 items-start">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                              {ann.type}
                            </span>
                            <span className="bg-brand-gray/50 text-brand-dark/70 border border-border dark:border-border text-[9px] font-black px-2 py-0.5 rounded uppercase">
                              Status: {ann.status}
                            </span>
                            <span className="text-[10px] text-brand-dark/45 font-semibold">
                              {new Date(ann.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-text-main leading-tight">{ann.title}</h4>
                          <p className="text-xs text-brand-dark/70 font-semibold whitespace-pre-wrap leading-relaxed line-clamp-3 bg-white/40 dark:bg-bg-card p-3 rounded-xl border border-border/40">
                            {ann.content}
                          </p>
                          <div className="flex items-center gap-3.5 text-[9px] font-bold text-brand-dark/55">
                            <span>Target: {ann.targetGroup === 'all' ? 'All Users' : `${ann.targetUsers?.length || 0} selected users`}</span>
                            <span>·</span>
                            <span>Views: {ann.viewsCount || 0}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => {
                              setIsEditingAnnouncement(true);
                              setEditingAnnouncementId(ann._id);
                              setAnnouncementForm({
                                title: ann.title,
                                content: ann.content,
                                type: ann.type,
                                targetGroup: ann.targetGroup,
                                targetUsers: ann.targetUsers || [],
                                status: ann.status,
                                scheduledFor: ann.scheduledFor ? ann.scheduledFor.slice(0, 16) : ''
                              });
                              setAnnouncementModalOpen(true);
                            }}
                            className="p-2 border border-border dark:border-border rounded-xl hover:bg-bg-main text-text-main transition animate-none"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann._id)}
                            className="p-2 border border-rose-200 rounded-xl hover:bg-rose-50 text-rose-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {announcementsList.length === 0 && (
                      <div className="text-center text-brand-dark/40 py-10">No announcements created yet. Click "Create Announcement" to publish updates.</div>
                    )}
                  </div>
                </div>

                {/* Announcement Creation/Editing Modal */}
                {announcementModalOpen && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-bg-card border-2 border-border rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                      <h3 className="font-black text-base text-text-main mb-4">
                        {isEditingAnnouncement ? 'Edit Announcement' : 'Publish New Announcement'}
                      </h3>

                      <form className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-brand-dark/60 uppercase">Announcement Title</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Double XP Event is Live!"
                            value={announcementForm.title}
                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full bg-white dark:bg-bg-card border border-border p-3 rounded-xl font-bold text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-brand-dark/60 uppercase">Category Type</label>
                          <select
                            value={announcementForm.type}
                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full bg-white dark:bg-bg-card border border-border p-3 rounded-xl font-bold text-xs"
                          >
                            <option value="update">📢 System Update</option>
                            <option value="maintenance">🔧 Maintenance Warning</option>
                            <option value="feature">✨ Feature Spotlight</option>
                            <option value="event">🎉 Special Event</option>
                            <option value="reward">🎁 Rewards Notice</option>
                            <option value="competition">🏆 Competitive Event</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-black text-brand-dark/60 uppercase">Content Message</label>
                          <textarea
                            required
                            rows={4}
                            placeholder="Type the message content here..."
                            value={announcementForm.content}
                            onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                            className="w-full bg-white dark:bg-bg-card border border-border p-3 rounded-xl font-bold text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-black text-brand-dark/60 uppercase">Audience Scope</label>
                            <select
                              value={announcementForm.targetGroup}
                              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, targetGroup: e.target.value, targetUsers: [] }))}
                              className="w-full bg-white dark:bg-bg-card border border-border p-3 rounded-xl font-bold text-xs"
                            >
                              <option value="all">Everyone (All Registered Users)</option>
                              <option value="selected">Target Selected Users</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-black text-brand-dark/60 uppercase">Posting Status</label>
                            <select
                              value={announcementForm.status}
                              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full bg-white dark:bg-bg-card border border-border p-3 rounded-xl font-bold text-xs"
                            >
                              <option value="sent">Send Instantly</option>
                              <option value="scheduled">Schedule for Future</option>
                            </select>
                          </div>
                        </div>

                        {announcementForm.status === 'scheduled' && (
                          <div className="space-y-1">
                            <label className="text-xs font-black text-brand-dark/60 uppercase">Scheduled Release Date & Time</label>
                            <input
                              type="datetime-local"
                              required
                              value={announcementForm.scheduledFor}
                              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, scheduledFor: e.target.value }))}
                              className="w-full bg-white dark:bg-bg-card border border-border p-3 rounded-xl font-bold text-xs"
                            />
                          </div>
                        )}

                        {/* Checklist for Selected Users */}
                        {announcementForm.targetGroup === 'selected' && (
                          <div className="space-y-2 border border-border p-4 rounded-2xl bg-bg-main/30 dark:bg-bg-main/5">
                            <label className="text-xs font-black text-brand-dark/60 uppercase">Select Target Users</label>
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              placeholder="Search users..."
                              className="w-full bg-white dark:bg-bg-card border border-border p-2 rounded-xl font-bold text-xs mb-2"
                            />
                            <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                              {usersList
                                .filter(u => u.username.toLowerCase().includes(userSearchQuery.toLowerCase()))
                                .map(u => {
                                  const isChecked = announcementForm.targetUsers.includes(u._id);
                                  return (
                                    <label key={u._id} className="flex items-center gap-2 p-1.5 hover:bg-bg-main rounded-lg cursor-pointer text-xs font-bold">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const nextUsers = isChecked
                                            ? announcementForm.targetUsers.filter(id => id !== u._id)
                                            : [...announcementForm.targetUsers, u._id];
                                          setAnnouncementForm(prev => ({ ...prev, targetUsers: nextUsers }));
                                        }}
                                        className="accent-primary"
                                      />
                                      <span className="text-text-main">{u.username}</span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4">
                          <button
                            type="button"
                            onClick={() => setAnnouncementModalOpen(false)}
                            className="px-4 py-2 border border-border text-brand-dark/70 font-black text-xs rounded-xl cursor-pointer bg-white dark:bg-bg-card hover:bg-bg-main"
                          >
                            Cancel
                          </button>
                          <Button
                            variant="custom"
                            type="button"
                            onClick={handleAnnouncementSubmit}
                            disabled={sendingAnnouncement}
                            className="px-5 py-2.5 bg-brand-green text-text-main font-black text-xs rounded-xl cursor-pointer border-0 btn-3d shadow-3d-green hover:bg-brand-green-hover transition"
                          >
                            Save Announcement
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
