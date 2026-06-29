import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Exclude from query results by default
  },
  avatarUrl: {
    type: String,
    default: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LingoLeap' // Nice default avatar URL
  },
  targetLanguage: {
    type: String,
    enum: ['English', 'French', 'Spanish', 'German', 'Arabic', 'Italian', 'Korean', 'Japanese'],
    default: 'Spanish'
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  streakCount: {
    type: Number,
    default: 0
  },
  lostStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: {
    type: Date,
    default: null
  },
  dailyGoalXp: {
    type: Number,
    default: 20 // 10 (Casual), 20 (Regular), 30 (Serious), 50 (Insane)
  },
  unlockedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  gems: {
    type: Number,
    default: 50 // Start with 50 gems so new users can explore the shop
  },
  hearts: {
    current: { type: Number, default: 5 },
    max: { type: Number, default: 5 },
    lastRegeneratedAt: { type: Date, default: Date.now }
  },
  weeklyXp: {
    type: Number,
    default: 0
  },
  weeklyXpStartedAt: {
    type: Date,
    default: Date.now
  },
  league: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Sapphire', 'Ruby', 'Emerald', 'Diamond'],
    default: 'Bronze'
  },
  rankHistory: [{
    weekStart: Date,
    rank: Number,
    league: String,
    xp: Number
  }],
  tournamentRewards: [{
    type: { type: String }, // 'gems', 'boost', 'badge'
    amount: Number,
    date: { type: Date, default: Date.now },
    reason: String
  }],
  dailyQuestState: {
    date: { type: String, default: null },
    lessonsCompleted: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    minutesPracticed: { type: Number, default: 0 },
    claimedQuestIds: [{ type: String }]
  },
  dailyQuests: [{
    id: { type: String },
    title: { type: String },
    type: { type: String },
    target: { type: Number },
    xpReward: { type: Number },
    gemsReward: { type: Number }
  }],
  studyCalendar: [{
    date: String,
    xp: { type: Number, default: 0 },
    lessons: { type: Number, default: 0 },
    minutes: { type: Number, default: 0 }
  }],
  achievementsUnlocked: [{
    id: String,
    unlockedAt: { type: Date, default: Date.now }
  }],
  streakFreezes: {
    type: Number,
    default: 0
  },
  dailyLoginRewardClaimedDate: {
    type: String,
    default: null
  },
  ownedItems: [{
    type: String
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifications: [{
    type: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, default: 'LingoLeap Organization' },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    rewardType: { type: String }, // 'gems', 'hearts', 'xp', 'special'
    rewardAmount: { type: Number },
    rewardItem: { type: String },
    rewardClaimed: { type: Boolean, default: false },
    announcementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  recentActivity: [{
    type: { type: String }, // 'lesson_complete', 'level_up', 'streak', 'achievement'
    message: String,
    xp: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpire: {
    type: Date,
    default: null
  },
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpire: {
    type: Date,
    default: null
  },
  // Onboarding preferences
  nativeLanguage: {
    type: String,
    default: 'English'
  },
  learningGoal: {
    type: String,
    default: null
  },
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  isOnboarded: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  weakVocabulary: [{
    type: String
  }],
  weakGrammar: [{
    type: String
  }],
  pronunciationMistakes: [{
    type: String
  }],
  listeningMistakes: [{
    type: String
  }],
  forgottenWords: [{
    type: String
  }],
  savedWords: [{
    word: String,
    translation: String,
    pronunciation: String,
    meaning: String,
    grammar: String,
    example: String,
    synonyms: [String],
    language: String,
    createdAt: { type: Date, default: Date.now }
  }],
  savedPhrases: [{
    phrase: String,
    translation: String,
    language: String,
    createdAt: { type: Date, default: Date.now }
  }],
  conversationMemory: {
    type: String,
    default: ''
  },
  recentQuestions: [{
    type: String
  }],
  // --- Enhanced Settings Fields ---
  websiteLanguage: {
    type: String,
    default: 'English'
  },
  bio: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: 'United States'
  },
  reminderTime: {
    type: String,
    default: '20:00'
  },
  difficultyLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  privacy: {
    publicProfile: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    showLearningProgress: { type: Boolean, default: true },
    friendRequestSettings: { type: String, enum: ['everyone', 'friends-of-friends', 'none'], default: 'everyone' }
  },
  settingsNotifications: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    friendRequests: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    achievementAlerts: { type: Boolean, default: true }
  },
  twoFactorAuth: {
    enabled: { type: Boolean, default: false },
    secret: { type: String, default: null }
  },
  activeSessions: [{
    id: { type: String },
    device: { type: String, default: 'Desktop' },
    browser: { type: String, default: 'Chrome' },
    ip: { type: String, default: '127.0.0.1' },
    lastActive: { type: Date, default: Date.now }
  }]
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and store a hashed password-reset token; returns the raw token to email
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.passwordResetExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return rawToken;
};

// Generate and store a 6-digit verification code (expires in 10 minutes)
userSchema.methods.generateEmailVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationToken = code;
  this.emailVerificationExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return code;
};

// Deprecated method - redirecting to code generation
userSchema.methods.generateEmailVerificationToken = function () {
  return this.generateEmailVerificationCode();
};

const User = mongoose.model('User', userSchema);
export default User;
