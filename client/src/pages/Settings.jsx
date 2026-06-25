import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import AppLayout from '../components/common/AppLayout';
import api from '../services/api';
import { 
  Settings as SettingsIcon, Globe, Target, Loader2, CheckCircle, 
  Camera, Upload, Shuffle, User, Sun, Moon, ChevronDown, ChevronUp, LogOut, Trash2, ShieldAlert
} from 'lucide-react';

const langFlags = {
  Spanish: '🇪🇸', French: '🇫🇷', English: '🇬🇧',
  German: '🇩🇪', Arabic: '🇸🇦', Italian: '🇮🇹'
};

const goalOptions = [
  { value: 10, label: 'Casual', desc: '10 XP/day · 5 min/day', emoji: '🌿' },
  { value: 20, label: 'Regular', desc: '20 XP/day · 10 min/day', emoji: '⚡' },
  { value: 30, label: 'Serious', desc: '30 XP/day · 15 min/day', emoji: '🔥' },
  { value: 50, label: 'Insane', desc: '50 XP/day · 30 min/day', emoji: '💎' },
];

const avatarStyles = [
  { seed: 'adventurer', label: 'Adventurer' },
  { seed: 'pixel-art', label: 'Pixel Art' },
  { seed: 'lorelei', label: 'Lorelei' },
  { seed: 'fun-emoji', label: 'Fun Emoji' },
  { seed: 'bottts', label: 'Robot' },
  { seed: 'avataaars', label: 'Illustrated' },
];

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { websiteLanguage, changeWebsiteLanguage } = useTranslation();
  const [targetLanguage, setTargetLanguage] = useState(user?.targetLanguage || 'Spanish');
  const [nativeLanguage, setNativeLanguage] = useState(user?.nativeLanguage || 'English');
  const [dailyGoalXp, setDailyGoalXp] = useState(user?.dailyGoalXp || 20);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarTab, setAvatarTab] = useState('dicebear');
  const fileInputRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  const fetchBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const res = await api.get('/social/blocked');
      if (res.data) {
        setBlockedUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      const res = await api.post('/social/unblock', { userIdToUnblock: userId });
      if (res.data) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userId));
        showSavedFeedback();
      }
    } catch (err) {
      console.error('Error unblocking user:', err);
    }
  };

  const handlePermanentlyRemove = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently remove this user? This will delete all chat messages and history.')) return;
    try {
      const res = await api.post('/social/blocked/remove', { userIdToRemove: userId });
      if (res.data) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userId));
        showSavedFeedback();
      }
    } catch (err) {
      console.error('Error permanently removing blocked user:', err);
    }
  };

  // Responsive state & section toggles
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expanded, setExpanded] = useState(() => {
    const isDesktop = window.innerWidth >= 768;
    return {
      profile: true,
      language: isDesktop,
      goal: isDesktop,
      privacy: isDesktop,
      appearance: isDesktop
    };
  });

  const toggleSection = (section) => {
    if (!isMobile) return; // Keep all open on desktop
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setExpanded({
          profile: true,
          language: true,
          goal: true,
          privacy: true,
          appearance: true
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (expanded.privacy || !isMobile) {
      fetchBlockedUsers();
    }
  }, [expanded.privacy, isMobile]);

  const [avatarSeed, setAvatarSeed] = useState(() => {
    if (user?.avatarUrl) {
      const match = user.avatarUrl.match(/seed=([^&]+)/);
      return match ? match[1] : user.username;
    }
    return user?.username || 'Leo';
  });

  const [avatarStyle, setAvatarStyle] = useState('adventurer');
  const [previewUrl, setPreviewUrl] = useState(
    user?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username}`
  );
  const [uploadPreview, setUploadPreview] = useState(null);

  if (!user) return null;

  const showSavedFeedback = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleToggleTheme = (isDark) => {
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    showSavedFeedback();
  };

  const handleLanguageChange = async (lang) => {
    setTargetLanguage(lang);
    setSaving(true);
    const res = await updateProfile({ targetLanguage: lang, dailyGoalXp });
    setSaving(false);
    if (res?.success) showSavedFeedback();
  };

  const handleNativeLanguageChange = async (lang) => {
    setNativeLanguage(lang);
    setSaving(true);
    const res = await updateProfile({ nativeLanguage: lang, dailyGoalXp });
    setSaving(false);
    if (res?.success) showSavedFeedback();
  };

  const handleSaveGoal = async (xpGoal) => {
    setDailyGoalXp(xpGoal);
    setSaving(true);
    const res = await updateProfile({ targetLanguage, dailyGoalXp: xpGoal });
    setSaving(false);
    if (res?.success) showSavedFeedback();
  };

  const handleAvatarChange = async (url) => {
    setPreviewUrl(url);
    setSaving(true);
    const res = await updateProfile({ avatarUrl: url });
    setSaving(false);
    if (res?.success) showSavedFeedback();
  };

  const handleRemoveAvatar = async () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`;
    await handleAvatarChange(defaultAvatar);
  };

  const handleDiceBearApply = async () => {
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`;
    await handleAvatarChange(url);
  };

  const handleRandomAvatar = async () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarSeed(randomSeed);
    const url = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${randomSeed}`;
    await handleAvatarChange(url);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setUploadPreview(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSave = async () => {
    if (!uploadPreview) return;
    await handleAvatarChange(uploadPreview);
  };

  const currentDiceBearPreview = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`;

  const CardHeader = ({ icon, title, sectionKey }) => (
    <div 
      onClick={() => toggleSection(sectionKey)}
      className={`flex items-center justify-between cursor-pointer select-none ${isMobile ? 'py-3' : 'pb-4'}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-secondary">{icon}</span>
        <h2 className="text-base font-black text-text-main">{title}</h2>
      </div>
      {isMobile && (
        <span className="text-text-secondary">
          {expanded[sectionKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      )}
    </div>
  );

  return (
    <AppLayout>
      {/* Settings Title Header */}
      <div className="mb-6 px-1">
        <h1 className="text-2xl font-black text-text-main flex items-center gap-2">
          <SettingsIcon size={24} /> Settings
        </h1>
        <p className="text-text-secondary font-bold text-xs mt-0.5">Customize preferences and global configurations</p>
      </div>

      <div className="max-w-xl flex flex-col gap-4 px-1 pb-16">
        
        {/* ── 1. ACCOUNT & AVATAR SETTING ── */}
        <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border p-4 md:p-6 shadow-sm">
          <CardHeader icon={<Camera size={18} />} title="Profile Picture" sectionKey="profile" />
          
          {(expanded.profile || !isMobile) && (
            <div className="flex flex-col gap-4 mt-2 border-t border-border/60 pt-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={previewUrl}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full border-2 border-primary/30 object-cover bg-bg-main"
                    onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`; }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-secondary text-white rounded-full p-1 border border-bg-card shadow hover:bg-secondary-hover transition cursor-pointer"
                  >
                    <Upload size={10} />
                  </button>
                </div>
                <div>
                  <p className="font-extrabold text-text-main text-sm leading-tight">{user.username}</p>
                  <p className="text-xs text-text-secondary font-medium">{user.email}</p>
                </div>
              </div>

              {/* Tabs selector */}
              <div className="flex gap-1.5 border-b border-border pb-1">
                <button
                  onClick={() => setAvatarTab('dicebear')}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    avatarTab === 'dicebear' ? 'bg-secondary/10 text-secondary' : 'text-text-secondary hover:bg-bg-main'
                  }`}
                >
                  Generator
                </button>
                <button
                  onClick={() => setAvatarTab('upload')}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    avatarTab === 'upload' ? 'bg-secondary/10 text-secondary' : 'text-text-secondary hover:bg-bg-main'
                  }`}
                >
                  Device Upload
                </button>
              </div>

              {/* DiceBear generator tabs */}
              {avatarTab === 'dicebear' && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="grid grid-cols-3 gap-1.5">
                    {avatarStyles.map(({ seed: style, label }) => (
                      <button
                        key={style}
                        onClick={() => setAvatarStyle(style)}
                        className={`flex flex-col items-center gap-1 p-1.5 border-2 rounded-xl transition cursor-pointer ${
                          avatarStyle === style ? 'border-secondary bg-secondary/5' : 'border-border hover:bg-bg-main'
                        }`}
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/${style}/svg?seed=${avatarSeed}`}
                          alt=""
                          className="w-8 h-8 rounded-full bg-bg-main"
                        />
                        <span className="text-[9px] font-black tracking-wide truncate w-full text-center">{label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Seed name..."
                      value={avatarSeed}
                      onChange={(e) => setAvatarSeed(e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-xl font-bold text-text-main bg-bg-card outline-none text-xs"
                    />
                    <button
                      onClick={handleRandomAvatar}
                      className="bg-bg-main border border-border text-text-secondary px-3 py-2 rounded-xl font-extrabold text-xs transition hover:bg-border cursor-pointer animate-[pulse_3s_infinite]"
                      title="Shuffle Seed"
                    >
                      <Shuffle size={12} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 bg-bg-main dark:bg-bg-main/30 border border-border rounded-xl p-2.5">
                    <img src={currentDiceBearPreview} alt="" className="w-10 h-10 rounded-full border border-border bg-bg-card" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-text-main">Generated Preview</p>
                      <p className="text-[9px] text-text-secondary leading-none mt-0.5 truncate">{avatarStyle} seed: {avatarSeed}</p>
                    </div>
                    <button
                      onClick={handleDiceBearApply}
                      className="bg-secondary text-white px-3.5 py-1.5 rounded-lg font-black text-[10px] cursor-pointer hover:bg-secondary-hover"
                    >
                      APPLY
                    </button>
                  </div>
                  <button
                    onClick={handleRemoveAvatar}
                    className="w-full flex justify-center items-center gap-1.5 bg-red-50 text-red-500 font-bold py-2 rounded-xl text-xs cursor-pointer hover:bg-red-100 transition mt-2"
                  >
                    <Trash2 size={14} /> Remove Profile Picture
                  </button>
                </div>
              )}

              {/* Upload settings tab */}
              {avatarTab === 'upload' && (
                <div className="flex flex-col gap-3 mt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-secondary/40 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-secondary/5 transition"
                  >
                    {uploadPreview ? (
                      <img src={uploadPreview} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-secondary/20" />
                    ) : (
                      <Upload size={18} className="text-secondary" />
                    )}
                    <div className="text-center">
                      <p className="text-xs font-black text-secondary">{uploadPreview ? 'Change Photo' : 'Upload Image File'}</p>
                      <p className="text-[9px] text-text-secondary mt-0.5">JPEG, PNG · Max 2MB</p>
                    </div>
                  </div>
                  {uploadPreview && (
                    <button
                      onClick={handleUploadSave}
                      className="w-full bg-secondary text-white font-black py-2 rounded-xl text-xs cursor-pointer hover:bg-secondary-hover"
                    >
                      SAVE PHOTO
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 2. TARGET LANGUAGE SETTING ── */}
        <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border p-4 md:p-6 shadow-sm">
          <CardHeader icon={<Globe size={18} />} title="Learning Language" sectionKey="language" />
          
          {(expanded.language || !isMobile) && (
            <div className="mt-2 border-t border-border/60 pt-4 animate-[fadeIn_0.2s_ease-out]">
              <p className="text-[11px] text-text-secondary font-bold mb-3.5">
                Target language is synced globally across learning paths, chat transcripts, and the AI Tutor roleplays:
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(langFlags).map(([lang, flag]) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`py-2 px-1 border-2 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer relative ${
                      targetLanguage === lang
                        ? 'border-secondary bg-secondary/5 text-secondary font-black'
                        : 'border-border text-text-secondary hover:bg-bg-main hover:border-secondary/20'
                    }`}
                  >
                    <span className="text-xl">{flag}</span>
                    <span>{lang}</span>
                    {targetLanguage === lang && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full flex items-center justify-center border border-white">
                        <CheckCircle size={8} className="text-white fill-white stroke-0" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-5 pt-5 border-t border-border/60">
                <p className="text-[11px] text-text-secondary font-bold mb-3.5">
                  Native Language:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(langFlags).map(([lang, flag]) => (
                    <button
                      key={lang}
                      onClick={() => handleNativeLanguageChange(lang)}
                      className={`py-2 px-1 border-2 rounded-xl text-center text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer relative ${
                        nativeLanguage === lang
                          ? 'border-secondary bg-secondary/5 text-secondary font-black'
                          : 'border-border text-text-secondary hover:bg-bg-main hover:border-secondary/20'
                      }`}
                    >
                      <span className="text-xl">{flag}</span>
                      <span>{lang}</span>
                      {nativeLanguage === lang && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full flex items-center justify-center border border-white">
                          <CheckCircle size={8} className="text-white fill-white stroke-0" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. DAILY GOAL SETTING ── */}
        <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border p-4 md:p-6 shadow-sm">
          <CardHeader icon={<Target size={18} />} title="Daily XP Goal" sectionKey="goal" />
          
          {(expanded.goal || !isMobile) && (
            <div className="mt-2 border-t border-border/60 pt-4 animate-[fadeIn_0.2s_ease-out] flex flex-col gap-2">
              {goalOptions.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => handleSaveGoal(goal.value)}
                  className={`w-full flex items-center gap-3.5 p-3 border-2 rounded-xl transition text-left cursor-pointer ${
                    dailyGoalXp === goal.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-bg-main'
                  }`}
                >
                  <span className="text-xl">{goal.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-extrabold text-xs ${dailyGoalXp === goal.value ? 'text-primary' : 'text-text-main'}`}>{goal.label}</p>
                    <p className="text-[10px] font-semibold text-text-secondary leading-none mt-0.5">{goal.desc}</p>
                  </div>
                  {dailyGoalXp === goal.value && <CheckCircle size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. PRIVACY & BLOCKED USERS ── */}
        <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border p-4 md:p-6 shadow-sm">
          <CardHeader icon={<ShieldAlert size={18} />} title="Privacy & Blocked Users" sectionKey="privacy" />
          
          {(expanded.privacy || !isMobile) && (
            <div className="mt-2 border-t border-border/60 pt-4 animate-[fadeIn_0.2s_ease-out] flex flex-col gap-4">
              <div>
                <p className="text-[10.5px] font-black text-text-secondary uppercase tracking-wider mb-2">Blocked Users List</p>
                
                {loadingBlocked ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary py-2">
                    <Loader2 size={14} className="animate-spin text-secondary" /> Loading blocked users...
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <p className="text-xs text-text-secondary font-bold py-2">No blocked users.</p>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {blockedUsers.map(bUser => (
                      <div key={bUser._id} className="flex items-center justify-between border border-border p-2.5 rounded-xl bg-bg-main dark:bg-bg-main/20">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={bUser.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full border border-border bg-bg-card object-cover"
                            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${bUser.username}`; }}
                          />
                          <div>
                            <p className="font-extrabold text-xs text-text-main leading-tight">{bUser.username}</p>
                            <p className="text-[9px] font-bold text-text-secondary">Level {bUser.level || 1} · {bUser.xp || 0} XP</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUnblock(bUser._id)}
                            className="px-2.5 py-1.5 bg-secondary text-white text-[10px] font-black rounded-lg hover:bg-secondary-hover transition cursor-pointer"
                          >
                            Unblock
                          </button>
                          <button
                            onClick={() => handlePermanentlyRemove(bUser._id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition cursor-pointer"
                            title="Permanently remove and clear chat history"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 5. SYSTEM INTERFACE PREFERENCES (THEME & WEBSITE LANGUAGE) ── */}
        <div className="bg-white dark:bg-bg-card rounded-2xl border-2 border-border p-4 md:p-6 shadow-sm">
          <CardHeader icon={<Sun size={18} />} title="System & Preferences" sectionKey="appearance" />
          
          {(expanded.appearance || !isMobile) && (
            <div className="mt-2 border-t border-border/60 pt-4 animate-[fadeIn_0.2s_ease-out] flex flex-col gap-5">
              
              {/* Appearance Toggle */}
              <div>
                <p className="text-[10.5px] font-black text-text-secondary uppercase tracking-wider mb-2">Dark Mode theme</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleToggleTheme(false)}
                    className={`py-2 px-1 border-2 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                      !darkMode ? 'border-primary bg-primary/5 text-primary' : 'border-border text-text-secondary hover:bg-bg-main'
                    }`}
                  >
                    <Sun size={14} className="text-primary" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    onClick={() => handleToggleTheme(true)}
                    className={`py-2 px-1 border-2 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
                      darkMode ? 'border-secondary bg-secondary/5 text-secondary' : 'border-border text-text-secondary hover:bg-bg-main'
                    }`}
                  >
                    <Moon size={14} className="text-secondary" />
                    <span>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Website Language */}
              <div>
                <p className="text-[10.5px] font-black text-text-secondary uppercase tracking-wider mb-2">Interface Language</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(langFlags).map(([lang, flag]) => (
                    <button
                      key={lang}
                      onClick={() => changeWebsiteLanguage(lang)}
                      className={`py-2 px-1 border border-border rounded-xl text-center text-[10px] font-bold transition flex flex-col items-center gap-0.5 cursor-pointer relative ${
                        websiteLanguage === lang
                          ? 'border-secondary bg-secondary/5 text-secondary font-black'
                          : 'text-text-secondary hover:bg-bg-main hover:border-secondary/20'
                      }`}
                    >
                      <span className="text-lg">{flag}</span>
                      <span className="truncate w-full">{lang}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── SAVE FEEDBACK TOASTS ── */}
        {saving && (
          <div className="flex items-center justify-center gap-2 bg-secondary/10 border border-secondary/20 rounded-xl py-2 px-4 text-[10px] font-black uppercase tracking-wider text-secondary">
            <Loader2 size={12} className="animate-spin" /> Saving Configuration...
          </div>
        )}
        {saved && (
          <div className="flex items-center justify-center gap-2 bg-primary/10 border border-primary/20 rounded-xl py-2 px-4 text-[10px] font-black uppercase tracking-wider text-primary animate-bounce">
            <CheckCircle size={12} /> Config applied globally!
          </div>
        )}

        <div className="md:hidden mt-4">
          <button
            onClick={async () => {
              if (logout) await logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-500/10 text-red-500 rounded-2xl font-black text-sm hover:bg-red-500/20 transition cursor-pointer"
          >
            <LogOut size={18} /> Log Out / Change Account
          </button>
        </div>

      </div>
    </AppLayout>
  );
};

export default Settings;
