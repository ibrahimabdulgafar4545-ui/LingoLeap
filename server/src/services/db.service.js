import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import AIPracticeSession from '../models/AIPracticeSession.js';
import ShopItem from '../models/ShopItem.js';
import Transaction from '../models/Transaction.js';
import SystemSetting from '../models/SystemSetting.js';
import Announcement from '../models/Announcement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_DB_DIR = path.join(__dirname, '../../data');
const JSON_DB_PATH = path.join(JSON_DB_DIR, 'db.json');

// Global flag to track if we are using JSON file database fallback
let useFallbackDb = false;

export let globalSettings = {
  maxHearts: 5,
  heartRegenMinutes: 30,
  startingGems: 500
};

export const loadSystemSettings = async () => {
  try {
    if (!useFallbackDb) {
      const dbSettings = await SystemSetting.find({});
      dbSettings.forEach(s => {
        if (s.key in globalSettings) {
          globalSettings[s.key] = s.value;
        }
      });
    } else {
      const db = readJsonDb();
      db.settings = db.settings || {};
      Object.keys(globalSettings).forEach(k => {
        if (db.settings[k] !== undefined) {
          globalSettings[k] = db.settings[k];
        } else {
          db.settings[k] = globalSettings[k];
        }
      });
      writeJsonDb(db);
    }
    console.log('⚙️ System settings loaded:', globalSettings);
  } catch (err) {
    console.error('Failed to load system settings:', err);
  }
};

// Initial JSON DB template structure
const initialDb = {
  users: [],
  lessons: [],
  progress: [],
  achievements: [],
  conversations: [],
  messages: [],
  aiPracticeSessions: [],
  pronunciationAttempts: [],
  announcements: []
};

const HEART_REGEN_MS = 30 * 60 * 1000;
const MAX_HEARTS = 5;

const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getLeagueForXp = (weeklyXp = 0) => {
  if (weeklyXp >= 2000) return 'Diamond';
  if (weeklyXp >= 1200) return 'Platinum';
  if (weeklyXp >= 650) return 'Gold';
  if (weeklyXp >= 250) return 'Silver';
  return 'Bronze';
};

const ensureUserGameState = (user) => {
  if (!user) return user;

  const currentMaxHearts = globalSettings.maxHearts || 5;
  const regenMs = (globalSettings.heartRegenMinutes || 30) * 60 * 1000;

  if (!user.hearts) {
    user.hearts = { current: currentMaxHearts, max: currentMaxHearts, lastRegeneratedAt: new Date() };
  }
  user.hearts.max = user.hearts.max || currentMaxHearts;
  user.hearts.current = Math.min(user.hearts.current ?? currentMaxHearts, user.hearts.max);
  user.hearts.lastRegeneratedAt = user.hearts.lastRegeneratedAt || new Date();

  const lastRegen = new Date(user.hearts.lastRegeneratedAt).getTime();
  const now = Date.now();
  if (user.hearts.current < user.hearts.max && Number.isFinite(lastRegen)) {
    const gained = Math.floor((now - lastRegen) / regenMs);
    if (gained > 0) {
      user.hearts.current = Math.min(user.hearts.max, user.hearts.current + gained);
      user.hearts.lastRegeneratedAt = user.hearts.current >= user.hearts.max
        ? new Date()
        : new Date(lastRegen + gained * regenMs);
    }
  }

  const weekStart = getWeekStart();
  const startedAt = user.weeklyXpStartedAt ? new Date(user.weeklyXpStartedAt) : null;
  if (!startedAt || startedAt < weekStart) {
    user.weeklyXp = 0;
    user.weeklyXpStartedAt = weekStart;
  }

  const today = toDateKey();
  if (!user.dailyQuestState || user.dailyQuestState.date !== today) {
    user.dailyQuestState = {
      date: today,
      lessonsCompleted: 0,
      xpEarned: 0,
      minutesPracticed: 0,
      claimedQuestIds: []
    };
  }
  
  // Daily login reward checking & gems award
  if (user.dailyLoginRewardClaimedDate !== today) {
    const currentStreak = user.streakCount || 1;
    const rewardGems = 10 + (currentStreak - 1) * 5; // Day 1 = 10, Day 2 = 15, Day 3 = 20, etc.
    user.gems = (user.gems || 0) + rewardGems;
    user.dailyLoginRewardClaimedDate = today;
    
    if (!Array.isArray(user.recentActivity)) user.recentActivity = [];
    user.recentActivity.push({
      type: 'daily_login',
      message: `Claimed daily login reward: +${rewardGems} Gems!`,
      xp: 0,
      timestamp: new Date()
    });
  }

  if (!Array.isArray(user.studyCalendar)) user.studyCalendar = [];
  if (!Array.isArray(user.achievementsUnlocked)) user.achievementsUnlocked = [];
  if (!Array.isArray(user.friends)) user.friends = [];
  if (!Array.isArray(user.friendRequests)) user.friendRequests = [];
  if (!Array.isArray(user.blockedUsers)) user.blockedUsers = [];
  if (!Array.isArray(user.notifications)) user.notifications = [];
  if (!Array.isArray(user.weakVocabulary)) user.weakVocabulary = [];
  if (!Array.isArray(user.weakGrammar)) user.weakGrammar = [];
  if (!Array.isArray(user.recentQuestions)) user.recentQuestions = [];
  if (user.isOnline === undefined) user.isOnline = false;
  if (user.lastSeen === undefined) user.lastSeen = new Date().toISOString();

  // Initialize dynamic settings
  if (user.websiteLanguage === undefined) user.websiteLanguage = 'English';
  if (user.bio === undefined) user.bio = '';
  if (user.country === undefined) user.country = 'United States';
  if (user.reminderTime === undefined) user.reminderTime = '20:00';
  if (user.difficultyLevel === undefined) user.difficultyLevel = 'Beginner';
  if (!user.privacy) {
    user.privacy = { publicProfile: true, showOnlineStatus: true, showLearningProgress: true, friendRequestSettings: 'everyone' };
  }
  if (!user.settingsNotifications) {
    user.settingsNotifications = { emailNotifications: true, pushNotifications: true, friendRequests: true, messages: true, achievementAlerts: true };
  }
  if (!user.twoFactorAuth) {
    user.twoFactorAuth = { enabled: false, secret: null };
  }
  if (!Array.isArray(user.activeSessions) || user.activeSessions.length === 0) {
    user.activeSessions = [
      { id: new mongoose.Types.ObjectId().toString(), device: 'Desktop', browser: 'Chrome', ip: '127.0.0.1', lastActive: new Date().toISOString() }
    ];
  }
  return user;
};

const serializeUser = (user) => {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  obj.league = getLeagueForXp(obj.weeklyXp || 0);
  return obj;
};

// Check and initialize JSON db file
const initJsonDb = () => {
  if (!fs.existsSync(JSON_DB_DIR)) {
    fs.mkdirSync(JSON_DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(JSON_DB_PATH)) {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
};

// Read database from JSON file
export const readJsonDb = () => {
  initJsonDb();
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local JSON database:', error);
    return initialDb;
  }
};

// Write database to JSON file
export const writeJsonDb = (data) => {
  initJsonDb();
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local JSON database:', error);
  }
};

export const checkDbConnection = async () => {
  try {
    // Attempt connecting to MONGODB with a 3-second timeout limit
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lingoleap', {
      serverSelectionTimeoutMS: 3000
    });
    console.log('MongoDB Connected successfully. Using MongoDB.');
    useFallbackDb = false;
    await loadSystemSettings();

    // Reset all users to offline on startup
    await User.updateMany({}, { $set: { isOnline: false } });
    console.log('📶 Online presences reset for all MongoDB users on startup.');
  } catch (err) {
    console.warn(`\n[WARNING] MongoDB Connection failed: ${err.message}`);
    console.warn('===> FALLING BACK TO LOCAL FILESYSTEM DATABASE (db.json) <===\n');
    useFallbackDb = true;
    initJsonDb();
    await loadSystemSettings();

    // Reset all local users to offline on startup
    try {
      const db = readJsonDb();
      db.users.forEach(u => {
        u.isOnline = false;
      });
      writeJsonDb(db);
      console.log('📶 Online presences reset for all local JSON users on startup.');
    } catch (dbErr) {
      console.error('Failed to reset local user presences:', dbErr.message);
    }
  }

  // Seed default admin account
  await seedDefaultAdmin();
};

export const isFallbackMode = () => useFallbackDb;

// ==========================================
// USER DATABASE METHODS
// ==========================================

export const findUserByEmail = async (email) => {
  if (!useFallbackDb) {
    return await User.findOne({ email: email.toLowerCase() }).select('+password');
  }
  const db = readJsonDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  return user ? { ...user, matchPassword: async (p) => await bcrypt.compare(p, user.password) } : null;
};

export const findUserByUsername = async (username) => {
  if (!useFallbackDb) {
    return await User.findOne({ username });
  }
  const db = readJsonDb();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
};

export const findUserById = async (id) => {
  if (!useFallbackDb) {
    const user = await User.findById(id).select('-password');
    if (!user) return null;
    const beforeStr = JSON.stringify(user.toObject());
    ensureUserGameState(user);
    const afterStr = JSON.stringify(user.toObject());
    if (beforeStr !== afterStr) {
      await user.save();
    }
    return user;
  }
  const db = readJsonDb();
  const user = db.users.find(u => u._id === id);
  if (!user) return null;
  const beforeStr = JSON.stringify(user);
  ensureUserGameState(user);
  const afterStr = JSON.stringify(user);
  if (beforeStr !== afterStr) {
    writeJsonDb(db);
  }
  return serializeUser(user);
};

export const findUserByVerificationToken = async (hashedToken) => {
  if (!useFallbackDb) {
    return await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });
  }
  const db = readJsonDb();
  const now = new Date().toISOString();
  const user = db.users.find(
    u => u.emailVerificationToken === hashedToken &&
         u.emailVerificationExpire &&
         u.emailVerificationExpire > now
  );
  return user || null;
};

export const findUserByResetToken = async (hashedToken) => {
  if (!useFallbackDb) {
    return await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() }
    }).select('+password');
  }
  const db = readJsonDb();
  const now = new Date().toISOString();
  const user = db.users.find(
    u => u.passwordResetToken === hashedToken &&
         u.passwordResetExpire &&
         u.passwordResetExpire > now
  );
  return user ? { ...user, matchPassword: async (p) => await bcrypt.compare(p, user.password) } : null;
};

export const updateUserPassword = async (id, plainPassword) => {
  if (!useFallbackDb) {
    const user = await User.findById(id).select('+password');
    if (!user) return null;
    user.password = plainPassword;
    user.passwordResetToken = null;
    user.passwordResetExpire = null;
    await user.save();
    return user;
  }
  const db = readJsonDb();
  const index = db.users.findIndex(u => u._id === id);
  if (index === -1) return null;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  db.users[index].password = hashedPassword;
  db.users[index].passwordResetToken = null;
  db.users[index].passwordResetExpire = null;
  writeJsonDb(db);
  return db.users[index];
};

export const verifyUserEmail = async (id) => {
  return await updateUser(id, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpire: null
  });
};

export const setUserVerificationToken = async (id, hashedToken, expireDate) => {
  return await updateUser(id, {
    emailVerificationToken: hashedToken,
    emailVerificationExpire: expireDate
  });
};

export const setUserResetToken = async (id, hashedToken, expireDate) => {
  return await updateUser(id, {
    passwordResetToken: hashedToken,
    passwordResetExpire: expireDate
  });
};

export const createUser = async (userData) => {
  if (!useFallbackDb) {
    return await User.create({
      ...userData,
      gems: globalSettings.startingGems,
      hearts: {
        current: globalSettings.maxHearts,
        max: globalSettings.maxHearts,
        lastRegeneratedAt: new Date()
      },
      email: userData.email.toLowerCase()
    });
  }
  const db = readJsonDb();
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const newUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    avatarUrl: userData.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.username}`,
    targetLanguage: userData.targetLanguage || 'Spanish',
    xp: 0,
    level: 1,
    streakCount: 0,
    lastActiveDate: null,
    dailyGoalXp: 20,
    gems: globalSettings.startingGems,
    hearts: { current: globalSettings.maxHearts, max: globalSettings.maxHearts, lastRegeneratedAt: new Date().toISOString() },
    weeklyXp: 0,
    weeklyXpStartedAt: getWeekStart().toISOString(),
    dailyQuestState: {
      date: toDateKey(),
      lessonsCompleted: 0,
      xpEarned: 0,
      minutesPracticed: 0,
      claimedQuestIds: []
    },
    studyCalendar: [],
    achievementsUnlocked: [],
    streakFreezes: 0,
    ownedItems: [],
    friends: [],
    friendRequests: [],
    blockedUsers: [],
    notifications: [],
    isOnline: false,
    lastSeen: new Date().toISOString(),
    recentActivity: [],
    unlockedLessons: [],
    emailVerified: userData.emailVerified || false,
    emailVerificationToken: userData.emailVerificationToken || null,
    emailVerificationExpire: userData.emailVerificationExpire || null,
    passwordResetToken: userData.passwordResetToken || null,
    passwordResetExpire: userData.passwordResetExpire || null,
    nativeLanguage: userData.nativeLanguage || 'English',
    learningGoal: userData.learningGoal || null,
    skillLevel: userData.skillLevel || 'Beginner',
    isOnboarded: userData.isOnboarded || false,
    role: userData.role || 'user',
    isBanned: userData.isBanned || false,
    websiteLanguage: userData.websiteLanguage || 'English',
    bio: userData.bio || '',
    country: userData.country || 'United States',
    reminderTime: userData.reminderTime || '20:00',
    difficultyLevel: userData.difficultyLevel || 'Beginner',
    privacy: userData.privacy || {
      publicProfile: true,
      showOnlineStatus: true,
      showLearningProgress: true,
      friendRequestSettings: 'everyone'
    },
    settingsNotifications: userData.settingsNotifications || {
      emailNotifications: true,
      pushNotifications: true,
      friendRequests: true,
      messages: true,
      achievementAlerts: true
    },
    twoFactorAuth: userData.twoFactorAuth || {
      enabled: false,
      secret: null
    },
    activeSessions: userData.activeSessions || [
      { id: new mongoose.Types.ObjectId().toString(), device: 'Desktop', browser: 'Chrome', ip: '127.0.0.1', lastActive: new Date().toISOString() }
    ],
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeJsonDb(db);

  return serializeUser(newUser);
};

export const updateUser = async (id, updateFields) => {
  if (!useFallbackDb) {
    return await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const db = readJsonDb();
  const index = db.users.findIndex(u => u._id === id);
  if (index === -1) return null;

  db.users[index] = {
    ...db.users[index],
    ...updateFields
  };
  writeJsonDb(db);
  
  ensureUserGameState(db.users[index]);
  writeJsonDb(db);
  return serializeUser(db.users[index]);
};

// ==========================================
// LESSON DATABASE METHODS
// ==========================================

export const seedMockLessons = (lessonsData) => {
  if (!useFallbackDb) return;
  const db = readJsonDb();
  // Clear and insert
  db.lessons = lessonsData.map((l, index) => ({
    _id: `lesson_${l.language.toLowerCase()}_${l.order}`,
    ...l,
    questions: l.questions.map((q, qIndex) => ({
      _id: `q_${index}_${qIndex}`,
      ...q
    }))
  }));
  writeJsonDb(db);
  console.log(`[LOCAL DB] Seeded ${db.lessons.length} lessons into db.json.`);
};

export const findLessonsByLanguage = async (language) => {
  if (!useFallbackDb) {
    return await Lesson.find({ language: { $regex: new RegExp(`^${language}$`, 'i') } }).sort({ order: 1 });
  }
  const db = readJsonDb();
  return db.lessons.filter(l => l.language.toLowerCase() === language.toLowerCase())
                   .sort((a, b) => a.order - b.order);
};

export const findLessonById = async (id) => {
  if (!useFallbackDb) {
    return await Lesson.findById(id);
  }
  const db = readJsonDb();
  return db.lessons.find(l => l._id === id) || null;
};

// ==========================================
// PROGRESS DATABASE METHODS
// ==========================================

export const submitLessonProgress = async (userId, lessonId, score, xpEarned, options = {}) => {
  const incorrectCount = Math.max(0, options.incorrectCount || 0);
  const minutesPracticed = Math.max(1, options.minutesPracticed || 3);

  if (!useFallbackDb) {
    // 1. Create or update progress record
    await Progress.findOneAndUpdate(
      { userId, lessonId },
      { completed: true, score, completedAt: new Date() },
      { upsert: true, new: true }
    );

    // 2. Fetch User and update progress stats
    const user = await User.findById(userId);
    if (user) {
      ensureUserGameState(user);
      user.xp += xpEarned;
      user.weeklyXp = (user.weeklyXp || 0) + xpEarned;
      user.hearts.current = Math.max(0, (user.hearts.current ?? MAX_HEARTS) - incorrectCount);
      if (incorrectCount > 0 && user.hearts.current < user.hearts.max) {
        user.hearts.lastRegeneratedAt = new Date();
      }
      
      // Calculate level scaling
      const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
      if (newLevel > user.level) {
        user.level = newLevel;
      }

      // Calculate streak logic
      const today = new Date().toDateString();
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;

      if (!lastActive) {
        user.streakCount = 1;
      } else if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive === yesterday.toDateString()) {
          user.streakCount += 1;
        } else {
          if (user.streakFreezes > 0) {
            user.streakFreezes -= 1;
            user.streakCount += 1; // Maintained by freeze item
          } else {
            user.lostStreak = user.streakCount || 0;
            user.streakCount = 1;
          }
        }
      }
      user.lastActiveDate = new Date();

      user.dailyQuestState.lessonsCompleted = (user.dailyQuestState.lessonsCompleted || 0) + 1;
      user.dailyQuestState.xpEarned = (user.dailyQuestState.xpEarned || 0) + xpEarned;
      user.dailyQuestState.minutesPracticed = (user.dailyQuestState.minutesPracticed || 0) + minutesPracticed;

      const todayKey = toDateKey();
      const calendar = user.studyCalendar || [];
      const todayEntry = calendar.find(d => d.date === todayKey);
      if (todayEntry) {
        todayEntry.xp = (todayEntry.xp || 0) + xpEarned;
        todayEntry.lessons = (todayEntry.lessons || 0) + 1;
        todayEntry.minutes = (todayEntry.minutes || 0) + minutesPracticed;
      } else {
        calendar.push({ date: todayKey, xp: xpEarned, lessons: 1, minutes: minutesPracticed });
      }
      user.studyCalendar = calendar.slice(-90);
      
      // Push unlocked lesson if not already present
      if (!user.unlockedLessons.includes(lessonId)) {
        user.unlockedLessons.push(lessonId);
      }
      
      // Award gems: 5 per lesson, bonus 10 if score >= 80%
      const gemsEarned = score >= 80 ? 15 : 5;
      user.gems = (user.gems || 0) + gemsEarned;

      // Add recent activity
      user.recentActivity.push({
        type: 'lesson_complete',
        message: `Completed a lesson with ${score}% score`,
        xp: xpEarned,
        timestamp: new Date()
      });
      // Keep only last 20 activities
      if (user.recentActivity.length > 20) {
        user.recentActivity = user.recentActivity.slice(-20);
      }

      await user.save();
      return serializeUser(user);
    }
    return null;
  }

  // Fallback JSON DB Implementation
  const db = readJsonDb();
  
  // 1. Find or create progress
  let progressItem = db.progress.find(p => p.userId === userId && p.lessonId === lessonId);
  if (!progressItem) {
    progressItem = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      lessonId,
      completed: true,
      score,
      completedAt: new Date().toISOString()
    };
    db.progress.push(progressItem);
  } else {
    progressItem.completed = true;
    progressItem.score = score;
    progressItem.completedAt = new Date().toISOString();
  }

  // 2. Update user properties
  const userIndex = db.users.findIndex(u => u._id === userId);
  if (userIndex !== -1) {
    const user = db.users[userIndex];
    ensureUserGameState(user);
    user.xp += xpEarned;
    user.weeklyXp = (user.weeklyXp || 0) + xpEarned;
    user.hearts.current = Math.max(0, (user.hearts.current ?? MAX_HEARTS) - incorrectCount);
    if (incorrectCount > 0 && user.hearts.current < user.hearts.max) {
      user.hearts.lastRegeneratedAt = new Date().toISOString();
    }

    // Calculate level scaling
    const newLevel = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
    }

    // Streak logic
    const today = new Date().toDateString();
    const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toDateString() : null;

    if (!lastActive) {
      user.streakCount = 1;
    } else if (lastActive !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastActive === yesterday.toDateString()) {
        user.streakCount += 1;
      } else {
        if (user.streakFreezes > 0) {
          user.streakFreezes -= 1;
          user.streakCount += 1; // Maintained by freeze item
        } else {
          user.lostStreak = user.streakCount || 0;
          user.streakCount = 1;
        }
      }
    }
    user.lastActiveDate = new Date().toISOString();

    user.dailyQuestState.lessonsCompleted = (user.dailyQuestState.lessonsCompleted || 0) + 1;
    user.dailyQuestState.xpEarned = (user.dailyQuestState.xpEarned || 0) + xpEarned;
    user.dailyQuestState.minutesPracticed = (user.dailyQuestState.minutesPracticed || 0) + minutesPracticed;

    const todayKey = toDateKey();
    const todayEntry = user.studyCalendar.find(d => d.date === todayKey);
    if (todayEntry) {
      todayEntry.xp = (todayEntry.xp || 0) + xpEarned;
      todayEntry.lessons = (todayEntry.lessons || 0) + 1;
      todayEntry.minutes = (todayEntry.minutes || 0) + minutesPracticed;
    } else {
      user.studyCalendar.push({ date: todayKey, xp: xpEarned, lessons: 1, minutes: minutesPracticed });
    }
    user.studyCalendar = user.studyCalendar.slice(-90);

    // Award gems
    const gemsEarned = score >= 80 ? 15 : 5;
    user.gems = (user.gems || 0) + gemsEarned;

    if (!user.unlockedLessons.includes(lessonId)) {
      user.unlockedLessons.push(lessonId);
    }

    if (!user.recentActivity) user.recentActivity = [];
    user.recentActivity.push({
      type: 'lesson_complete',
      message: `Completed a lesson with ${score}% score`,
      xp: xpEarned,
      timestamp: new Date().toISOString()
    });
    // Keep only last 20 activities
    if (user.recentActivity.length > 20) {
      user.recentActivity = user.recentActivity.slice(-20);
    }

    writeJsonDb(db);
    
    return serializeUser(user);
  }

  writeJsonDb(db);
  return null;
};

// ==========================================
// LEADERBOARD METHODS
// ==========================================

export const getGlobalLeaderboard = async () => {
  if (!useFallbackDb) {
    const users = await User.find({}).sort({ weeklyXp: -1, xp: -1 }).limit(10).select('username avatarUrl xp weeklyXp level targetLanguage');
    return users.map((u, index) => {
      const obj = serializeUser(u);
      return { ...obj, rank: index + 1 };
    });
  }
  const db = readJsonDb();
  return db.users
    .map(u => {
      ensureUserGameState(u);
      return {
        _id: u._id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        xp: u.xp,
        weeklyXp: u.weeklyXp || 0,
        league: getLeagueForXp(u.weeklyXp || 0),
        level: u.level,
        targetLanguage: u.targetLanguage
      };
    })
    .sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0) || (b.xp || 0) - (a.xp || 0))
    .slice(0, 10)
    .map((u, index) => ({ ...u, rank: index + 1 }));
};

export const getLeagueName = getLeagueForXp;

export const getCompletedLessons = async (userId) => {
  if (!useFallbackDb) {
    const list = await Progress.find({ userId, completed: true });
    return list.map(p => p.lessonId.toString());
  }
  const db = readJsonDb();
  return db.progress
    .filter(p => p.userId === userId && p.completed)
    .map(p => p.lessonId.toString());
};

// ==========================================
// AI PRACTICE SESSION DATABASE METHODS
// ==========================================

export const createAIPracticeSession = async (sessionData) => {
  if (!useFallbackDb) {
    return await AIPracticeSession.create(sessionData);
  }
  const db = readJsonDb();
  if (!db.aiPracticeSessions) db.aiPracticeSessions = [];
  
  const newSession = {
    _id: new mongoose.Types.ObjectId().toString(),
    userId: sessionData.userId.toString(),
    scenario: sessionData.scenario,
    language: sessionData.language,
    level: sessionData.level || 'Intermediate',
    messages: sessionData.messages || [],
    score: sessionData.score || { fluency: 0, grammar: 0, vocabulary: 0 },
    feedback: sessionData.feedback || { suggestions: '', grammarMistakes: [], recommendedVocab: [] },
    createdAt: new Date().toISOString()
  };

  db.aiPracticeSessions.push(newSession);
  writeJsonDb(db);
  return newSession;
};

export const findAIPracticeSessionById = async (id) => {
  if (!useFallbackDb) {
    return await AIPracticeSession.findById(id);
  }
  const db = readJsonDb();
  if (!db.aiPracticeSessions) db.aiPracticeSessions = [];
  return db.aiPracticeSessions.find(s => s._id === id) || null;
};

export const updateAIPracticeSession = async (id, updateFields) => {
  if (!useFallbackDb) {
    return await AIPracticeSession.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const db = readJsonDb();
  if (!db.aiPracticeSessions) db.aiPracticeSessions = [];
  
  const index = db.aiPracticeSessions.findIndex(s => s._id === id);
  if (index === -1) return null;

  db.aiPracticeSessions[index] = {
    ...db.aiPracticeSessions[index],
    ...updateFields
  };
  writeJsonDb(db);
  return db.aiPracticeSessions[index];
};

export const findAIPracticeSessionsByUserId = async (userId) => {
  if (!useFallbackDb) {
    return await AIPracticeSession.find({ userId }).sort({ createdAt: -1 });
  }
  const db = readJsonDb();
  if (!db.aiPracticeSessions) db.aiPracticeSessions = [];
  return db.aiPracticeSessions
    .filter(s => s.userId === userId.toString())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export async function seedDefaultAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lingoleap.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    const existingAdmin = await findUserByEmail(adminEmail);
    if (!existingAdmin) {
      console.log(`👑 Seeding default admin user (${adminEmail})...`);
      await createUser({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        emailVerified: true,
        isOnboarded: true
      });
      console.log('✅ Default admin user created successfully.');
    } else {
      console.log('👑 Default admin already exists.');
    }
  } catch (err) {
    console.error('❌ Failed to seed default admin:', err.message);
  }
}

// ==========================================
// SHOP ITEM & STORE MANAGEMENT METHODS
// ==========================================
const defaultShopItemsSeed = [
  { itemId: 'streak_freeze', name: 'Streak Freeze', description: 'Protects your streak for one missed day. Activates automatically.', icon: '🧊', price: 50, category: 'protection', maxOwnable: 2 },
  { itemId: 'xp_boost_2x', name: '2× XP Boost', description: 'Double XP earned from your next completed lesson.', icon: '⚡', price: 60, category: 'boosts', maxOwnable: 3 },
  { itemId: 'heart_refill', name: 'Heart Refill', description: 'Instantly restore all your hearts if you run low during a lesson.', icon: '❤️', price: 30, category: 'boosts', maxOwnable: 5 },
  { itemId: 'hint_pack', name: 'Hint Pack (×5)', description: 'Get 5 in-lesson hints to reveal a letter in fill-blank questions.', icon: '💡', price: 40, category: 'tools', maxOwnable: 10 },
  { itemId: 'weekend_warrior', name: 'Weekend Warrior', description: 'Skips one weekend from your streak count — keeps your streak alive.', icon: '🏆', price: 100, category: 'protection', maxOwnable: 1 },
  { itemId: 'avatar_gold', name: 'Golden Profile Frame', description: 'Sleek premium gold frame for your user profile.', icon: '👑', price: 200, category: 'avatars', maxOwnable: 1 },
  { itemId: 'avatar_cosmic', name: 'Cosmic Avatar Border', description: 'Glow with interstellar custom gradients.', icon: '🛸', price: 350, category: 'avatars', maxOwnable: 1 }
];

export const getShopItems = async () => {
  if (!useFallbackDb) {
    let items = await ShopItem.find({});
    if (items.length === 0) {
      items = await ShopItem.insertMany(defaultShopItemsSeed);
    }
    return items;
  }
  const db = readJsonDb();
  db.shopItems = db.shopItems || [];
  if (db.shopItems.length === 0) {
    db.shopItems = [...defaultShopItemsSeed];
    writeJsonDb(db);
  }
  return db.shopItems;
};

export const createShopItem = async (itemData) => {
  if (!useFallbackDb) {
    return await ShopItem.create(itemData);
  }
  const db = readJsonDb();
  db.shopItems = db.shopItems || [];
  const newItem = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...itemData
  };
  db.shopItems.push(newItem);
  writeJsonDb(db);
  return newItem;
};

export const updateShopItem = async (id, updateFields) => {
  if (!useFallbackDb) {
    return await ShopItem.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const db = readJsonDb();
  db.shopItems = db.shopItems || [];
  const index = db.shopItems.findIndex(i => i._id === id || i.itemId === id);
  if (index === -1) return null;
  db.shopItems[index] = { ...db.shopItems[index], ...updateFields };
  writeJsonDb(db);
  return db.shopItems[index];
};

export const deleteShopItem = async (id) => {
  if (!useFallbackDb) {
    const item = await ShopItem.findById(id);
    if (!item) return false;
    await ShopItem.findByIdAndDelete(id);
    return true;
  }
  const db = readJsonDb();
  db.shopItems = db.shopItems || [];
  const index = db.shopItems.findIndex(i => i._id === id || i.itemId === id);
  if (index === -1) return false;
  db.shopItems.splice(index, 1);
  writeJsonDb(db);
  return true;
};

// ==========================================
// TRANSACTIONS & PAYMENTS METHODS
// ==========================================
export const createTransaction = async (txData) => {
  if (!useFallbackDb) {
    const tx = await Transaction.create(txData);
    return await Transaction.findById(tx._id).populate('userId', 'username email');
  }
  const db = readJsonDb();
  db.transactions = db.transactions || [];
  const newTx = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...txData,
    createdAt: new Date().toISOString()
  };
  db.transactions.push(newTx);
  writeJsonDb(db);

  // Hydrate user
  const user = db.users.find(u => u._id === txData.userId.toString());
  return {
    ...newTx,
    userId: user ? { _id: user._id, username: user.username, email: user.email } : txData.userId
  };
};

export const getTransactions = async () => {
  if (!useFallbackDb) {
    return await Transaction.find({}).populate('userId', 'username email').sort({ createdAt: -1 });
  }
  const db = readJsonDb();
  db.transactions = db.transactions || [];
  const populated = db.transactions.map(tx => {
    const user = db.users.find(u => u._id === tx.userId.toString());
    return {
      ...tx,
      userId: user ? { _id: user._id, username: user.username, email: user.email } : tx.userId
    };
  });
  return populated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// ==========================================
// GLOBAL CONFIG / SYSTEM SETTINGS METHODS
// ==========================================
export const updateSystemSettingInDb = async (key, value) => {
  if (!useFallbackDb) {
    await SystemSetting.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
  } else {
    const db = readJsonDb();
    db.settings = db.settings || {};
    db.settings[key] = value;
    writeJsonDb(db);
  }
  globalSettings[key] = value;
  console.log(`🔧 Updated setting in-memory & DB: ${key} =`, value);
};

// ==========================================
// ANNOUNCEMENTS & ANALYTICS METHODS
// ==========================================
export const createAnnouncementInDb = async (announcementData) => {
  if (!useFallbackDb) {
    return await Announcement.create(announcementData);
  }
  const db = readJsonDb();
  db.announcements = db.announcements || [];
  const newAnn = {
    _id: new mongoose.Types.ObjectId().toString(),
    ...announcementData,
    viewsCount: 0,
    clicksCount: 0,
    createdAt: new Date().toISOString()
  };
  db.announcements.push(newAnn);
  writeJsonDb(db);
  return newAnn;
};

export const getAnnouncementsFromDb = async (userId = null, isAdmin = false) => {
  if (!useFallbackDb) {
    if (isAdmin) {
      return await Announcement.find({}).sort({ createdAt: -1 });
    }
    const query = {
      $or: [
        { targetGroup: 'all' },
        { targetGroup: 'selected', targetUsers: userId }
      ],
      status: 'sent'
    };
    return await Announcement.find(query).sort({ createdAt: -1 });
  }
  
  const db = readJsonDb();
  db.announcements = db.announcements || [];
  
  if (isAdmin) {
    return [...db.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  const now = new Date();
  return db.announcements
    .filter(ann => {
      if (ann.status === 'scheduled') {
        const schedTime = new Date(ann.scheduledFor);
        if (schedTime > now) return false;
        ann.status = 'sent';
      }
      
      if (ann.status !== 'sent') return false;
      if (ann.targetGroup === 'all') return true;
      if (ann.targetGroup === 'selected') {
        const uIdStr = userId ? userId.toString() : '';
        return (ann.targetUsers || []).some(id => id.toString() === uIdStr);
      }
      return false;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getAnnouncementByIdFromDb = async (id) => {
  if (!useFallbackDb) {
    return await Announcement.findById(id);
  }
  const db = readJsonDb();
  db.announcements = db.announcements || [];
  return db.announcements.find(ann => ann._id === id.toString()) || null;
};

export const updateAnnouncementInDb = async (id, updateFields) => {
  if (!useFallbackDb) {
    return await Announcement.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
  }
  const db = readJsonDb();
  db.announcements = db.announcements || [];
  const index = db.announcements.findIndex(ann => ann._id === id.toString());
  if (index === -1) return null;
  db.announcements[index] = { ...db.announcements[index], ...updateFields };
  writeJsonDb(db);
  return db.announcements[index];
};

export const deleteAnnouncementInDb = async (id) => {
  if (!useFallbackDb) {
    const result = await Announcement.findByIdAndDelete(id);
    return !!result;
  }
  const db = readJsonDb();
  db.announcements = db.announcements || [];
  const index = db.announcements.findIndex(ann => ann._id === id.toString());
  if (index === -1) return false;
  db.announcements.splice(index, 1);
  writeJsonDb(db);
  return true;
};

export const incrementAnalyticsMetric = async (key) => {
  if (!useFallbackDb) {
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { $inc: { value: 1 } },
      { upsert: true, new: true }
    );
    return setting.value;
  } else {
    const db = readJsonDb();
    db.settings = db.settings || {};
    db.settings[key] = (Number(db.settings[key]) || 0) + 1;
    writeJsonDb(db);
    return db.settings[key];
  }
};

export const getAnalyticsStatsInDb = async () => {
  const metrics = ['notification_opens', 'reward_claims', 'announcement_views'];
  const stats = {};
  for (const key of metrics) {
    if (!useFallbackDb) {
      const s = await SystemSetting.findOne({ key });
      stats[key] = s ? Number(s.value) : 0;
    } else {
      const db = readJsonDb();
      db.settings = db.settings || {};
      stats[key] = Number(db.settings[key]) || 0;
    }
  }
  return stats;
};


