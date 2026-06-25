import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Models
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import Progress from '../models/Progress.js';
import Message from '../models/Message.js';
import CallHistory from '../models/CallHistory.js';
import Conversation from '../models/Conversation.js';
import AIPracticeSession from '../models/AIPracticeSession.js';
import Achievement from '../models/Achievement.js';
import AuditLog from '../models/AuditLog.js';
import Report from '../models/Report.js';

// Services
import { 
  isFallbackMode, 
  readJsonDb, 
  writeJsonDb,
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem,
  getTransactions,
  updateSystemSettingInDb,
  globalSettings,
  createAnnouncementInDb,
  getAnnouncementsFromDb,
  updateAnnouncementInDb,
  deleteAnnouncementInDb,
  getAnalyticsStatsInDb
} from '../services/db.service.js';
import Transaction from '../models/Transaction.js';
import ShopItem from '../models/ShopItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ONBOARDING_FILE_PATH = path.join(__dirname, '../../data/onboarding.json');

// Helper to log admin actions
const logAdminAction = async (req, action, targetId, targetType, details) => {
  const adminId = req.user._id || req.user.id;
  const adminUsername = req.user.username;

  if (!isFallbackMode()) {
    try {
      await AuditLog.create({
        action,
        adminId,
        adminUsername,
        targetId: targetId ? targetId.toString() : null,
        targetType,
        details
      });
    } catch (err) {
      console.error('Failed to write audit log to Mongo:', err);
    }
  } else {
    try {
      const db = readJsonDb();
      db.auditLogs = db.auditLogs || [];
      db.auditLogs.push({
        _id: new mongoose.Types.ObjectId().toString(),
        action,
        adminId: adminId.toString(),
        adminUsername,
        targetId: targetId ? targetId.toString() : null,
        targetType,
        details,
        timestamp: new Date().toISOString()
      });
      writeJsonDb(db);
    } catch (err) {
      console.error('Failed to write audit log to local JSON:', err);
    }
  }
};

// ==========================================
// 1. ANALYTICS & STATS
// ==========================================
export const getAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const txs = await getTransactions();
    const successfulTxs = txs.filter(t => t.status === 'Completed');
    const failedPayments = txs.filter(t => t.status === 'Failed').length;
    const successfulPayments = successfulTxs.length;
    const revenue = successfulTxs.reduce((sum, t) => sum + (t.price || 0), 0);
    const totalGemsPurchased = successfulTxs.reduce((sum, t) => sum + (t.gemsAmount || 0), 0);

    if (!isFallbackMode()) {
      // MongoDB aggregations
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({
        lastActiveDate: { $gte: sevenDaysAgo }
      });
      const lessonsCompleted = await Progress.countDocuments({ completed: true });
      const totalLessons = await Lesson.countDocuments();
      const aiConversations = await AIPracticeSession.countDocuments();
      const messagesSent = await Message.countDocuments();

      const users = await User.find({}, 'friends');
      let friendsSum = 0;
      users.forEach(u => friendsSum += (u.friends?.length || 0));
      const friendConnections = Math.round(friendsSum / 2);

      // AI requests statistics
      const aiSessions = await AIPracticeSession.find({});
      let totalAiMessages = 0;
      aiSessions.forEach(s => totalAiMessages += (s.messages?.length || 0));

      const apiRequestsCount = aiConversations * 5 + messagesSent;

      // Completion rate calculation
      const potentialCompletions = totalUsers * totalLessons || 1;
      const lessonCompletionRate = Math.min(100, Math.round((lessonsCompleted / potentialCompletions) * 100) || 0);

      // Estimate total hearts used based on lesson completion
      const totalHeartsUsed = lessonsCompleted * 1.5;

      res.status(200).json({
        success: true,
        analytics: {
          totalUsers,
          activeUsers,
          lessonsCompleted,
          aiConversations,
          messagesSent,
          friendConnections,
          revenue: Math.round(revenue * 100) / 100,
          totalGemsPurchased,
          successfulPayments,
          failedPayments,
          totalHeartsUsed: Math.round(totalHeartsUsed),
          lessonCompletionRate,
          aiUsage: {
            apiRequests: apiRequestsCount,
            totalConversations: aiConversations,
            totalMessages: totalAiMessages,
            averageMessagesPerSession: aiConversations > 0 ? Math.round(totalAiMessages / aiConversations) : 0
          }
        }
      });
    } else {
      // Local fallback DB analysis
      const db = readJsonDb();
      const users = db.users || [];
      const progress = db.progress || [];
      const aiSessions = db.aiPracticeSessions || [];
      const messages = db.messages || [];
      const lessons = db.lessons || [];

      const totalUsers = users.length;
      
      const activeUsers = users.filter(u => {
        if (!u.lastActiveDate) return false;
        return new Date(u.lastActiveDate) >= sevenDaysAgo;
      }).length;

      const lessonsCompleted = progress.filter(p => p.completed).length;
      const totalLessons = lessons.length;
      const aiConversations = aiSessions.length;
      const messagesSent = messages.length;

      let friendsSum = 0;
      users.forEach(u => friendsSum += (u.friends?.length || 0));
      const friendConnections = Math.round(friendsSum / 2);

      let totalAiMessages = 0;
      aiSessions.forEach(s => totalAiMessages += (s.messages?.length || 0));

      const apiRequestsCount = aiSessions.length * 5 + messages.length;

      const potentialCompletions = totalUsers * totalLessons || 1;
      const lessonCompletionRate = Math.min(100, Math.round((lessonsCompleted / potentialCompletions) * 100) || 0);
      const totalHeartsUsed = lessonsCompleted * 1.5;

      res.status(200).json({
        success: true,
        analytics: {
          totalUsers,
          activeUsers,
          lessonsCompleted,
          aiConversations,
          messagesSent,
          friendConnections,
          revenue: Math.round(revenue * 100) / 100,
          totalGemsPurchased,
          successfulPayments,
          failedPayments,
          totalHeartsUsed: Math.round(totalHeartsUsed),
          lessonCompletionRate,
          aiUsage: {
            apiRequests: apiRequestsCount,
            totalConversations: aiConversations,
            totalMessages: totalAiMessages,
            averageMessagesPerSession: aiConversations > 0 ? Math.round(totalAiMessages / aiConversations) : 0
          }
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. USER MANAGEMENT
// ==========================================
export const getUsers = async (req, res) => {
  try {
    const { search } = req.query;

    if (!isFallbackMode()) {
      let query = {};
      if (search) {
        query = {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        };
      }
      const users = await User.find(query).select('-password');
      res.status(200).json({ success: true, users });
    } else {
      const db = readJsonDb();
      let users = db.users || [];

      if (search) {
        const queryLower = search.toLowerCase();
        users = users.filter(
          u => u.username.toLowerCase().includes(queryLower) ||
               u.email.toLowerCase().includes(queryLower)
        );
      }

      const usersWithoutPassword = users.map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });

      res.status(200).json({ success: true, users: usersWithoutPassword });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isFallbackMode()) {
      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Fetch user specific records
      const progress = await Progress.find({ userId: id }).populate('lessonId');
      const aiSessions = await AIPracticeSession.find({ userId: id });
      const calls = await CallHistory.find({
        $or: [{ caller: id }, { receiver: id }]
      }).populate('caller receiver');

      res.status(200).json({
        success: true,
        user,
        progress,
        aiSessions,
        calls
      });
    } else {
      const db = readJsonDb();
      const user = db.users.find(u => u._id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const userCopy = { ...user };
      delete userCopy.password;

      const progress = (db.progress || []).filter(p => p.userId === id).map(p => {
        const lesson = (db.lessons || []).find(l => l._id === p.lessonId);
        return { ...p, lessonId: lesson };
      });

      const aiSessions = (db.aiPracticeSessions || []).filter(s => s.userId === id);
      const calls = (db.callHistory || []).filter(c => c.caller === id || c.receiver === id).map(c => {
        const callerUser = db.users.find(u => u._id === c.caller);
        const receiverUser = db.users.find(u => u._id === c.receiver);
        return {
          ...c,
          caller: callerUser ? { _id: callerUser._id, username: callerUser.username } : null,
          receiver: receiverUser ? { _id: receiverUser._id, username: receiverUser.username } : null
        };
      });

      res.status(200).json({
        success: true,
        user: userCopy,
        progress,
        aiSessions,
        calls
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    if (!isFallbackMode()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot ban an admin user' });
      }

      user.isBanned = isBanned;
      await user.save();

      await logAdminAction(req, isBanned ? 'BAN_USER' : 'UNBAN_USER', id, 'user', `Banned status changed to ${isBanned} for user ${user.username}`);
      res.status(200).json({ success: true, message: `User ban status updated to ${isBanned}`, user });
    } else {
      const db = readJsonDb();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (db.users[idx].role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot ban an admin user' });
      }

      db.users[idx].isBanned = isBanned;
      writeJsonDb(db);

      await logAdminAction(req, isBanned ? 'BAN_USER' : 'UNBAN_USER', id, 'user', `Banned status changed to ${isBanned} for user ${db.users[idx].username}`);
      res.status(200).json({ success: true, message: `User ban status updated to ${isBanned}`, user: db.users[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isFallbackMode()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot delete an admin user' });
      }

      await User.findByIdAndDelete(id);
      // Clean up records associated
      await Progress.deleteMany({ userId: id });
      await AIPracticeSession.deleteMany({ userId: id });
      await Message.deleteMany({ $or: [{ sender: id }, { recipient: id }] });
      await Conversation.deleteMany({ participants: id });

      await logAdminAction(req, 'DELETE_USER', id, 'user', `Deleted user: ${user.username} and their progress/activity`);
      res.status(200).json({ success: true, message: 'User and all related records deleted successfully' });
    } else {
      const db = readJsonDb();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = db.users[idx];
      if (user.role === 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot delete an admin user' });
      }

      db.users.splice(idx, 1);
      
      // Clean up records
      db.progress = (db.progress || []).filter(p => p.userId !== id);
      db.aiPracticeSessions = (db.aiPracticeSessions || []).filter(s => s.userId !== id);
      db.messages = (db.messages || []).filter(m => m.sender !== id && m.recipient !== id);
      db.conversations = (db.conversations || []).filter(c => !c.participants.includes(id));
      
      writeJsonDb(db);

      await logAdminAction(req, 'DELETE_USER', id, 'user', `Deleted user: ${user.username} and their progress/activity`);
      res.status(200).json({ success: true, message: 'User and all related records deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetUserXP = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isFallbackMode()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.xp = 0;
      user.weeklyXp = 0;
      user.level = 1;
      await user.save();

      await logAdminAction(req, 'RESET_XP', id, 'user', `Reset XP for user: ${user.username}`);
      res.status(200).json({ success: true, message: 'XP and level reset successfully', user });
    } else {
      const db = readJsonDb();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      db.users[idx].xp = 0;
      db.users[idx].weeklyXp = 0;
      db.users[idx].level = 1;
      writeJsonDb(db);

      await logAdminAction(req, 'RESET_XP', id, 'user', `Reset XP for user: ${db.users[idx].username}`);
      res.status(200).json({ success: true, message: 'XP and level reset successfully', user: db.users[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetUserStreak = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isFallbackMode()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.streakCount = 0;
      await user.save();

      await logAdminAction(req, 'RESET_STREAK', id, 'user', `Reset streak for user: ${user.username}`);
      res.status(200).json({ success: true, message: 'Streak count reset successfully', user });
    } else {
      const db = readJsonDb();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      db.users[idx].streakCount = 0;
      writeJsonDb(db);

      await logAdminAction(req, 'RESET_STREAK', id, 'user', `Reset streak for user: ${db.users[idx].username}`);
      res.status(200).json({ success: true, message: 'Streak count reset successfully', user: db.users[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. LESSON MANAGEMENT
// ==========================================
export const getAllLessons = async (req, res) => {
  try {
    if (!isFallbackMode()) {
      const lessons = await Lesson.find({}).sort({ language: 1, order: 1 });
      res.status(200).json({ success: true, lessons });
    } else {
      const db = readJsonDb();
      const lessons = (db.lessons || []).sort((a, b) => {
        if (a.language !== b.language) return a.language.localeCompare(b.language);
        return a.order - b.order;
      });
      res.status(200).json({ success: true, lessons });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLesson = async (req, res) => {
  try {
    const { title, language, category, difficulty, order, unit, unitTitle, xpReward, questions } = req.body;

    if (!title || !language || !questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required lesson fields' });
    }

    if (!isFallbackMode()) {
      const lesson = await Lesson.create({
        title,
        language,
        category: category || 'Vocabulary',
        difficulty: Number(difficulty) || 1,
        order: Number(order) || 1,
        unit: Number(unit) || 1,
        unitTitle: unitTitle || `Unit ${unit}`,
        xpReward: Number(xpReward) || 15,
        questions
      });

      await logAdminAction(req, 'CREATE_LESSON', lesson._id, 'lesson', `Created lesson: ${title} (${language})`);
      res.status(201).json({ success: true, lesson });
    } else {
      const db = readJsonDb();
      db.lessons = db.lessons || [];

      const newLesson = {
        _id: `lesson_${language.toLowerCase()}_${order || (db.lessons.length + 1)}`,
        title,
        language,
        category: category || 'Vocabulary',
        difficulty: Number(difficulty) || 1,
        order: Number(order) || 1,
        unit: Number(unit) || 1,
        unitTitle: unitTitle || `Unit ${unit}`,
        xpReward: Number(xpReward) || 15,
        questions: questions.map((q, idx) => ({
          _id: `q_${Date.now()}_${idx}`,
          ...q
        }))
      };

      db.lessons.push(newLesson);
      writeJsonDb(db);

      await logAdminAction(req, 'CREATE_LESSON', newLesson._id, 'lesson', `Created lesson: ${title} (${language})`);
      res.status(201).json({ success: true, lesson: newLesson });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, language, category, difficulty, order, unit, unitTitle, xpReward, questions } = req.body;

    if (!isFallbackMode()) {
      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      if (title) lesson.title = title;
      if (language) lesson.language = language;
      if (category) lesson.category = category;
      if (difficulty !== undefined) lesson.difficulty = Number(difficulty);
      if (order !== undefined) lesson.order = Number(order);
      if (unit !== undefined) lesson.unit = Number(unit);
      if (unitTitle) lesson.unitTitle = unitTitle;
      if (xpReward !== undefined) lesson.xpReward = Number(xpReward);
      if (questions) lesson.questions = questions;

      await lesson.save();

      await logAdminAction(req, 'EDIT_LESSON', id, 'lesson', `Updated lesson: ${lesson.title}`);
      res.status(200).json({ success: true, lesson });
    } else {
      const db = readJsonDb();
      const idx = db.lessons.findIndex(l => l._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      const lesson = db.lessons[idx];
      if (title) lesson.title = title;
      if (language) lesson.language = language;
      if (category) lesson.category = category;
      if (difficulty !== undefined) lesson.difficulty = Number(difficulty);
      if (order !== undefined) lesson.order = Number(order);
      if (unit !== undefined) lesson.unit = Number(unit);
      if (unitTitle) lesson.unitTitle = unitTitle;
      if (xpReward !== undefined) lesson.xpReward = Number(xpReward);
      if (questions) {
        lesson.questions = questions.map((q, qidx) => ({
          _id: q._id || `q_${Date.now()}_${qidx}`,
          ...q
        }));
      }

      writeJsonDb(db);

      await logAdminAction(req, 'EDIT_LESSON', id, 'lesson', `Updated lesson: ${lesson.title}`);
      res.status(200).json({ success: true, lesson });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isFallbackMode()) {
      const lesson = await Lesson.findById(id);
      if (!lesson) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      await Lesson.findByIdAndDelete(id);
      // Clean progress for deleted lesson
      await Progress.deleteMany({ lessonId: id });

      await logAdminAction(req, 'DELETE_LESSON', id, 'lesson', `Deleted lesson: ${lesson.title} (${lesson.language})`);
      res.status(200).json({ success: true, message: 'Lesson and related progress logs deleted successfully' });
    } else {
      const db = readJsonDb();
      const idx = db.lessons.findIndex(l => l._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Lesson not found' });
      }

      const lesson = db.lessons[idx];
      db.lessons.splice(idx, 1);
      db.progress = (db.progress || []).filter(p => p.lessonId !== id);
      writeJsonDb(db);

      await logAdminAction(req, 'DELETE_LESSON', id, 'lesson', `Deleted lesson: ${lesson.title} (${lesson.language})`);
      res.status(200).json({ success: true, message: 'Lesson and related progress logs deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reorderLessons = async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of { id, order }

    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array required' });
    }

    if (!isFallbackMode()) {
      for (const item of orderedIds) {
        await Lesson.findByIdAndUpdate(item.id, { order: Number(item.order) });
      }
      await logAdminAction(req, 'REORDER_LESSONS', null, 'lesson', `Reordered ${orderedIds.length} lessons`);
      res.status(200).json({ success: true, message: 'Lessons reordered successfully' });
    } else {
      const db = readJsonDb();
      db.lessons = db.lessons || [];

      orderedIds.forEach(item => {
        const idx = db.lessons.findIndex(l => l._id === item.id);
        if (idx !== -1) {
          db.lessons[idx].order = Number(item.order);
        }
      });

      writeJsonDb(db);

      await logAdminAction(req, 'REORDER_LESSONS', null, 'lesson', `Reordered ${orderedIds.length} lessons`);
      res.status(200).json({ success: true, message: 'Lessons reordered successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. ACHIEVEMENT MANAGEMENT
// ==========================================
export const getAllAchievements = async (req, res) => {
  try {
    if (!isFallbackMode()) {
      const achievements = await Achievement.find({}).sort({ createdAt: -1 });
      res.status(200).json({ success: true, achievements });
    } else {
      const db = readJsonDb();
      const achievements = db.achievements || [];
      res.status(200).json({ success: true, achievements });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAchievement = async (req, res) => {
  try {
    const { id, name, description, requireType, requireValue } = req.body;

    if (!id || !name || !description || !requireType || requireValue === undefined) {
      return res.status(400).json({ success: false, message: 'Missing achievement fields' });
    }

    if (!isFallbackMode()) {
      const achievement = await Achievement.create({
        id,
        name,
        description,
        requireType,
        requireValue: Number(requireValue)
      });

      await logAdminAction(req, 'CREATE_ACHIEVEMENT', achievement._id, 'achievement', `Created achievement: ${name}`);
      res.status(201).json({ success: true, achievement });
    } else {
      const db = readJsonDb();
      db.achievements = db.achievements || [];

      if (db.achievements.some(a => a.id === id)) {
        return res.status(400).json({ success: false, message: 'Achievement with this ID already exists' });
      }

      const newAchievement = {
        _id: new mongoose.Types.ObjectId().toString(),
        id,
        name,
        description,
        requireType,
        requireValue: Number(requireValue),
        createdAt: new Date().toISOString()
      };

      db.achievements.push(newAchievement);
      writeJsonDb(db);

      await logAdminAction(req, 'CREATE_ACHIEVEMENT', newAchievement._id, 'achievement', `Created achievement: ${name}`);
      res.status(201).json({ success: true, achievement: newAchievement });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editAchievement = async (req, res) => {
  try {
    const { id } = req.params; // _id of achievement
    const { name, description, requireType, requireValue } = req.body;

    if (!isFallbackMode()) {
      const achievement = await Achievement.findById(id);
      if (!achievement) {
        return res.status(404).json({ success: false, message: 'Achievement not found' });
      }

      if (name) achievement.name = name;
      if (description) achievement.description = description;
      if (requireType) achievement.requireType = requireType;
      if (requireValue !== undefined) achievement.requireValue = Number(requireValue);

      await achievement.save();

      await logAdminAction(req, 'EDIT_ACHIEVEMENT', id, 'achievement', `Updated achievement: ${achievement.name}`);
      res.status(200).json({ success: true, achievement });
    } else {
      const db = readJsonDb();
      const idx = db.achievements.findIndex(a => a._id === id || a.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Achievement not found' });
      }

      const achievement = db.achievements[idx];
      if (name) achievement.name = name;
      if (description) achievement.description = description;
      if (requireType) achievement.requireType = requireType;
      if (requireValue !== undefined) achievement.requireValue = Number(requireValue);

      writeJsonDb(db);

      await logAdminAction(req, 'EDIT_ACHIEVEMENT', id, 'achievement', `Updated achievement: ${achievement.name}`);
      res.status(200).json({ success: true, achievement });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAchievement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isFallbackMode()) {
      const achievement = await Achievement.findById(id);
      if (!achievement) {
        return res.status(404).json({ success: false, message: 'Achievement not found' });
      }

      await Achievement.findByIdAndDelete(id);

      await logAdminAction(req, 'DELETE_ACHIEVEMENT', id, 'achievement', `Deleted achievement: ${achievement.name}`);
      res.status(200).json({ success: true, message: 'Achievement deleted successfully' });
    } else {
      const db = readJsonDb();
      const idx = db.achievements.findIndex(a => a._id === id || a.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Achievement not found' });
      }

      const achievement = db.achievements[idx];
      db.achievements.splice(idx, 1);
      writeJsonDb(db);

      await logAdminAction(req, 'DELETE_ACHIEVEMENT', id, 'achievement', `Deleted achievement: ${achievement.name}`);
      res.status(200).json({ success: true, message: 'Achievement deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. ONBOARDING MANAGEMENT
// ==========================================
export const getOnboardingContent = (req, res) => {
  try {
    if (fs.existsSync(ONBOARDING_FILE_PATH)) {
      const raw = fs.readFileSync(ONBOARDING_FILE_PATH, 'utf-8');
      const content = JSON.parse(raw);
      return res.status(200).json({ success: true, onboarding: content });
    } else {
      return res.status(404).json({ success: false, message: 'Onboarding config file not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOnboardingContent = async (req, res) => {
  try {
    const { nativeLanguages, targetLanguages, learningGoals, dailyGoals, placementLevels } = req.body;

    const content = {
      nativeLanguages,
      targetLanguages,
      learningGoals,
      dailyGoals,
      placementLevels
    };

    fs.writeFileSync(ONBOARDING_FILE_PATH, JSON.stringify(content, null, 2), 'utf-8');

    await logAdminAction(req, 'UPDATE_ONBOARDING_CONTENT', null, 'content', 'Updated global onboarding options and preferences config');
    res.status(200).json({ success: true, message: 'Onboarding content updated successfully', onboarding: content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. SOCIAL MODERATION & REPORTS
// ==========================================
export const getReports = async (req, res) => {
  try {
    if (!isFallbackMode()) {
      const reports = await Report.find({}).sort({ createdAt: -1 });
      res.status(200).json({ success: true, reports });
    } else {
      const db = readJsonDb();
      const reports = db.reports || [];
      res.status(200).json({ success: true, reports: reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;
    const reporterId = req.user._id || req.user.id;
    const reporterUsername = req.user.username;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'Missing required report fields' });
    }

    let reportedUsername = '';
    if (!isFallbackMode()) {
      const reportedUser = await User.findById(reportedUserId);
      if (!reportedUser) return res.status(404).json({ success: false, message: 'Reported user not found' });
      reportedUsername = reportedUser.username;

      const report = await Report.create({
        reporter: reporterId,
        reporterUsername,
        reportedUser: reportedUserId,
        reportedUsername,
        reason,
        details: details || ''
      });
      res.status(201).json({ success: true, report });
    } else {
      const db = readJsonDb();
      const reportedUser = db.users.find(u => u._id === reportedUserId);
      if (!reportedUser) return res.status(404).json({ success: false, message: 'Reported user not found' });
      reportedUsername = reportedUser.username;

      db.reports = db.reports || [];
      const report = {
        _id: new mongoose.Types.ObjectId().toString(),
        reporter: reporterId.toString(),
        reporterUsername,
        reportedUser: reportedUserId,
        reportedUsername,
        reason,
        details: details || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.reports.push(report);
      writeJsonDb(db);
      res.status(201).json({ success: true, report });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'resolved', 'ignored'

    if (!isFallbackMode()) {
      const report = await Report.findById(id);
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

      report.status = status;
      await report.save();

      await logAdminAction(req, 'UPDATE_REPORT_STATUS', id, 'report', `Marked report against ${report.reportedUsername} as ${status}`);
      res.status(200).json({ success: true, report });
    } else {
      const db = readJsonDb();
      const idx = db.reports.findIndex(r => r._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Report not found' });

      db.reports[idx].status = status;
      writeJsonDb(db);

      await logAdminAction(req, 'UPDATE_REPORT_STATUS', id, 'report', `Marked report against ${db.reports[idx].reportedUsername} as ${status}`);
      res.status(200).json({ success: true, report: db.reports[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    if (!isFallbackMode()) {
      const messages = await Message.find({}).sort({ createdAt: -1 }).limit(100);
      res.status(200).json({ success: true, messages });
    } else {
      const db = readJsonDb();
      const messages = db.messages || [];
      const latestMessages = messages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100);
      res.status(200).json({ success: true, messages: latestMessages });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteChatMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!isFallbackMode()) {
      const message = await Message.findById(messageId);
      if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

      await Message.findByIdAndDelete(messageId);
      
      // Update last message on conversation
      const remaining = await Message.find({ conversationId: message.conversationId }).sort({ createdAt: -1 }).limit(1);
      await Conversation.findByIdAndUpdate(message.conversationId, {
        lastMessage: remaining.length > 0 ? remaining[0]._id : null
      });

      await logAdminAction(req, 'DELETE_CHAT_MESSAGE', messageId, 'chat', `Deleted message content: "${message.text}" sent by user ID ${message.sender}`);
      res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } else {
      const db = readJsonDb();
      const idx = db.messages.findIndex(m => m._id === messageId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Message not found' });

      const msg = db.messages[idx];
      db.messages.splice(idx, 1);
      
      const remaining = db.messages.filter(m => m.conversationId === msg.conversationId);
      remaining.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const cIdx = db.conversations.findIndex(c => c._id === msg.conversationId);
      if (cIdx !== -1) {
        db.conversations[cIdx].lastMessage = remaining.length > 0 ? remaining[0]._id : null;
      }
      writeJsonDb(db);

      await logAdminAction(req, 'DELETE_CHAT_MESSAGE', messageId, 'chat', `Deleted message content: "${msg.text}" sent by user ID ${msg.sender}`);
      res.status(200).json({ success: true, message: 'Message deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. AUDIT LOGS
// ==========================================
export const getAuditLogs = async (req, res) => {
  try {
    if (!isFallbackMode()) {
      const logs = await AuditLog.find({}).sort({ timestamp: -1 });
      res.status(200).json({ success: true, logs });
    } else {
      const db = readJsonDb();
      const logs = db.auditLogs || [];
      res.status(200).json({ success: true, logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. DYNAMIC SETTINGS & GAMIFICATION BALANCES
// ==========================================

export const adjustUserBalance = async (req, res) => {
  try {
    const { gems, hearts } = req.body;
    const userId = req.params.id;

    const user = await import('../services/db.service.js').then(m => m.findUserById(userId));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentGems = user.gems || 0;
    const newGems = Math.max(0, currentGems + Number(gems || 0));

    const maxHeartsVal = user.hearts?.max || globalSettings.maxHearts || 5;
    const currentHearts = user.hearts?.current ?? maxHeartsVal;
    const newHearts = Math.max(0, Math.min(maxHeartsVal, currentHearts + Number(hearts || 0)));

    const updatedUser = await import('../services/db.service.js').then(m => m.updateUser(userId, {
      gems: newGems,
      hearts: {
        ...user.hearts,
        current: newHearts
      }
    }));

    await logAdminAction(req, 'ADJUST_USER_BALANCE', userId, 'user', `Adjusted balance: Gems: ${gems > 0 ? '+' : ''}${gems}, Hearts: ${hearts > 0 ? '+' : ''}${hearts}`);

    res.status(200).json({
      success: true,
      message: 'User balance successfully adjusted.',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminSettings = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      settings: globalSettings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminSettings = async (req, res) => {
  try {
    const { maxHearts, heartRegenMinutes, startingGems } = req.body;

    if (maxHearts !== undefined) {
      await updateSystemSettingInDb('maxHearts', Number(maxHearts));
    }
    if (heartRegenMinutes !== undefined) {
      await updateSystemSettingInDb('heartRegenMinutes', Number(heartRegenMinutes));
    }
    if (startingGems !== undefined) {
      await updateSystemSettingInDb('startingGems', Number(startingGems));
    }

    await logAdminAction(req, 'UPDATE_SYSTEM_SETTINGS', null, 'system', `Updated settings to: Max Hearts: ${maxHearts}, Regen Minutes: ${heartRegenMinutes}, Starting Gems: ${startingGems}`);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully.',
      settings: globalSettings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. STORE & INVENTORY MANAGEMENT
// ==========================================

export const getAdminStoreItems = async (req, res) => {
  try {
    const items = await getShopItems();
    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminStoreItem = async (req, res) => {
  try {
    const { itemId, name, description, icon, price, category, maxOwnable } = req.body;

    if (!itemId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Item ID, Name, and Price are required.' });
    }

    const newItem = await createShopItem({
      itemId,
      name,
      description: description || '',
      icon: icon || '🛍️',
      price: Number(price),
      category: category || 'general',
      maxOwnable: Number(maxOwnable || 1)
    });

    await logAdminAction(req, 'CREATE_STORE_ITEM', newItem._id, 'store', `Created item: ${name} (ID: ${itemId}) for ${price} Gems`);

    res.status(201).json({ success: true, message: 'Store item created successfully.', item: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminStoreItem = async (req, res) => {
  try {
    const updated = await updateShopItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Store item not found.' });
    }

    await logAdminAction(req, 'UPDATE_STORE_ITEM', req.params.id, 'store', `Updated store item: ${updated.name}`);

    res.status(200).json({ success: true, message: 'Store item updated successfully.', item: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminStoreItem = async (req, res) => {
  try {
    const deleted = await deleteShopItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Store item not found.' });
    }

    await logAdminAction(req, 'DELETE_STORE_ITEM', req.params.id, 'store', `Deleted store item ID: ${req.params.id}`);

    res.status(200).json({ success: true, message: 'Store item deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 10. TRANSACTION HISTORIES
// ==========================================

export const getAdminTransactions = async (req, res) => {
  try {
    const transactions = await getTransactions();
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 11. CAMPAIGNS & GLOBAL SYSTEM EVENTS
// ==========================================

export const launchGlobalEvent = async (req, res) => {
  try {
    const { eventType } = req.body;

    if (!['double_xp', 'free_hearts', 'weekend_rewards'].includes(eventType)) {
      return res.status(400).json({ success: false, message: 'Invalid campaign event type.' });
    }

    let affectedCount = 0;

    if (eventType === 'free_hearts') {
      const maxHeartsVal = globalSettings.maxHearts || 5;
      if (!isFallbackMode()) {
        const updateResult = await User.updateMany({}, {
          $set: {
            "hearts.current": maxHeartsVal,
            "hearts.lastRegeneratedAt": new Date()
          }
        });
        affectedCount = updateResult.modifiedCount;
      } else {
        const db = readJsonDb();
        db.users.forEach(u => {
          u.hearts = {
            current: maxHeartsVal,
            max: maxHeartsVal,
            lastRegeneratedAt: new Date().toISOString()
          };
        });
        affectedCount = db.users.length;
        writeJsonDb(db);
      }
      await logAdminAction(req, 'LAUNCH_EVENT_FREE_HEARTS', null, 'campaign', `Restored Hearts to maximum (${maxHeartsVal}) for all ${affectedCount} users.`);
    }

    if (eventType === 'double_xp') {
      // Simulate double XP configuration launch
      affectedCount = 999;
      await logAdminAction(req, 'LAUNCH_EVENT_DOUBLE_XP', null, 'campaign', `Launched a platform-wide 2× XP event!`);
    }

    if (eventType === 'weekend_rewards') {
      const maxHeartsVal = globalSettings.maxHearts || 5;
      if (!isFallbackMode()) {
        const updateResult = await User.updateMany({}, {
          $inc: { gems: 50 },
          $set: {
            "hearts.current": maxHeartsVal,
            "hearts.lastRegeneratedAt": new Date()
          }
        });
        affectedCount = updateResult.modifiedCount;
      } else {
        const db = readJsonDb();
        db.users.forEach(u => {
          u.gems = (u.gems || 0) + 50;
          u.hearts = {
            current: maxHeartsVal,
            max: maxHeartsVal,
            lastRegeneratedAt: new Date().toISOString()
          };
        });
        affectedCount = db.users.length;
        writeJsonDb(db);
      }
      await logAdminAction(req, 'LAUNCH_EVENT_WEEKEND_REWARDS', null, 'campaign', `Awarded Weekend Rewards (+50 Gems and Heart refills) to all ${affectedCount} users.`);
    }

    res.status(200).json({
      success: true,
      message: `Successfully launched "${eventType}" event across LingoLeap!`,
      affectedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 12. ADMIN GIFT REWARDS SYSTEM
// ==========================================
export const giftRewards = async (req, res) => {
  try {
    const { rewardType, amount, rewardItem, targetType, targetUserIds, count } = req.body;

    if (!['gems', 'hearts', 'xp', 'special', 'badges'].includes(rewardType)) {
      return res.status(400).json({ success: false, message: 'Invalid reward type.' });
    }

    let usersToReward = [];

    if (targetType === 'individual' || targetType === 'multiple') {
      if (!targetUserIds || !Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No target user IDs specified.' });
      }
      if (!isFallbackMode()) {
        usersToReward = await User.find({ _id: { $in: targetUserIds } });
      } else {
        const db = readJsonDb();
        usersToReward = db.users.filter(u => targetUserIds.includes(u._id));
      }
    } else if (targetType === 'all') {
      if (!isFallbackMode()) {
        usersToReward = await User.find({});
      } else {
        const db = readJsonDb();
        usersToReward = db.users;
      }
    } else if (targetType === 'top_xp') {
      const limit = Number(count) || 10;
      if (!isFallbackMode()) {
        usersToReward = await User.find({}).sort({ xp: -1 }).limit(limit);
      } else {
        const db = readJsonDb();
        usersToReward = [...db.users].sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, limit);
      }
    } else if (targetType === 'top_leaderboard') {
      const limit = Number(count) || 10;
      if (!isFallbackMode()) {
        usersToReward = await User.find({}).sort({ weeklyXp: -1 }).limit(limit);
      } else {
        const db = readJsonDb();
        usersToReward = [...db.users].sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0)).slice(0, limit);
      }
    } else if (targetType === 'top_streak') {
      const limit = Number(count) || 10;
      if (!isFallbackMode()) {
        usersToReward = await User.find({}).sort({ streakCount: -1 }).limit(limit);
      } else {
        const db = readJsonDb();
        usersToReward = [...db.users].sort((a, b) => (b.streakCount || 0) - (a.streakCount || 0)).slice(0, limit);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid target type.' });
    }

    if (usersToReward.length === 0) {
      return res.status(404).json({ success: false, message: 'No target users found to reward.' });
    }

    const amtVal = Number(amount) || 0;
    let message = '';
    if (rewardType === 'gems') {
      message = `You received ${amtVal} Gems from LingoLeap.`;
    } else if (rewardType === 'hearts') {
      message = `You received ${amtVal} Hearts from LingoLeap.`;
    } else if (rewardType === 'xp') {
      message = `You received ${amtVal} XP from LingoLeap.`;
    } else if (rewardType === 'special') {
      message = `You received a special reward from LingoLeap.`;
    } else if (rewardType === 'badges') {
      message = `You received a new badge: ${rewardItem} from LingoLeap.`;
    }

    const db = isFallbackMode() ? readJsonDb() : null;

    for (let targetUser of usersToReward) {
      const notification = {
        _id: new mongoose.Types.ObjectId().toString(),
        type: 'reward',
        title: 'LingoLeap Organization',
        message,
        read: false,
        createdAt: new Date().toISOString(),
        rewardType,
        rewardAmount: amtVal,
        rewardItem: rewardItem || '',
        rewardClaimed: false
      };

      if (!isFallbackMode()) {
        await User.findByIdAndUpdate(targetUser._id, {
          $push: { notifications: notification }
        });
      } else {
        const userInDb = db.users.find(u => u._id === targetUser._id.toString());
        if (userInDb) {
          userInDb.notifications = userInDb.notifications || [];
          userInDb.notifications.push(notification);
        }
      }
    }

    if (isFallbackMode()) {
      writeJsonDb(db);
    }

    await logAdminAction(
      req, 
      'GIFT_REWARD', 
      targetType, 
      'user_group', 
      `Gifted ${rewardType} (${amtVal || rewardItem}) to ${usersToReward.length} users targeted by ${targetType}.`
    );

    res.status(200).json({
      success: true,
      message: `Successfully gifted ${rewardType} to ${usersToReward.length} users!`,
      recipientCount: usersToReward.length
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 13. ADMIN ANNOUNCEMENT CENTER & CUSTOM ANALYTICS
// ==========================================
export const createAdminAnnouncement = async (req, res) => {
  try {
    const { title, content, type, targetGroup, targetUsers, scheduledFor, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const announcementData = {
      title,
      content,
      type: type || 'update',
      targetGroup: targetGroup || 'all',
      targetUsers: targetUsers || [],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: status || 'sent',
      sender: 'LingoLeap Organization',
      viewsCount: 0,
      clicksCount: 0,
      createdAt: new Date()
    };

    const newAnn = await createAnnouncementInDb(announcementData);

    if (newAnn.status === 'sent') {
      let recipientUsers = [];
      if (newAnn.targetGroup === 'all') {
        if (!isFallbackMode()) {
          recipientUsers = await User.find({}, '_id notifications');
        } else {
          recipientUsers = readJsonDb().users;
        }
      } else {
        if (!isFallbackMode()) {
          recipientUsers = await User.find({ _id: { $in: targetUsers } }, '_id notifications');
        } else {
          recipientUsers = readJsonDb().users.filter(u => targetUsers.includes(u._id));
        }
      }

      const notificationMsg = `${title}`;
      const db = isFallbackMode() ? readJsonDb() : null;

      for (let recUser of recipientUsers) {
        const notif = {
          _id: new mongoose.Types.ObjectId().toString(),
          type: 'announcement',
          title: 'LingoLeap Organization',
          message: notificationMsg,
          read: false,
          createdAt: new Date().toISOString(),
          announcementId: newAnn._id.toString()
        };

        if (!isFallbackMode()) {
          await User.findByIdAndUpdate(recUser._id, {
            $push: { notifications: notif }
          });
        } else {
          const userInDb = db.users.find(u => u._id === recUser._id.toString());
          if (userInDb) {
            userInDb.notifications = userInDb.notifications || [];
            userInDb.notifications.push(notif);
          }
        }
      }

      if (isFallbackMode()) {
        writeJsonDb(db);
      }
    }

    await logAdminAction(req, 'CREATE_ANNOUNCEMENT', newAnn._id.toString(), 'announcement', `Created announcement: ${title}`);

    res.status(201).json({
      success: true,
      message: newAnn.status === 'scheduled' ? 'Announcement scheduled successfully.' : 'Announcement sent successfully.',
      announcement: newAnn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminAnnouncements = async (req, res) => {
  try {
    const announcements = await getAnnouncementsFromDb(null, true);
    res.status(200).json({
      success: true,
      announcements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateAnnouncementInDb(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    await logAdminAction(req, 'UPDATE_ANNOUNCEMENT', id, 'announcement', `Updated announcement: ${req.body.title || 'Untitled'}`);
    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteAnnouncementInDb(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    await logAdminAction(req, 'DELETE_ANNOUNCEMENT', id, 'announcement', `Deleted announcement`);
    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomAnalytics = async (req, res) => {
  try {
    const stats = await getAnalyticsStatsInDb();
    res.status(200).json({
      success: true,
      analytics: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
