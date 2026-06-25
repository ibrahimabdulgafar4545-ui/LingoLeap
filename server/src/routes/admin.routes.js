import express from 'express';
import { protect, admin } from '../middleware/auth.middleware.js';
import {
  getAnalytics,
  getUsers,
  getUserProfile,
  banUser,
  deleteUser,
  resetUserXP,
  resetUserStreak,
  getAllLessons,
  createLesson,
  editLesson,
  deleteLesson,
  reorderLessons,
  getAllAchievements,
  createAchievement,
  editAchievement,
  deleteAchievement,
  getOnboardingContent,
  updateOnboardingContent,
  getReports,
  createReport,
  updateReportStatus,
  getAllMessages,
  deleteChatMessage,
  getAuditLogs,
  adjustUserBalance,
  getAdminSettings,
  updateAdminSettings,
  getAdminStoreItems,
  createAdminStoreItem,
  updateAdminStoreItem,
  deleteAdminStoreItem,
  getAdminTransactions,
  launchGlobalEvent,
  giftRewards,
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  deleteAdminAnnouncement,
  getCustomAnalytics
} from '../controllers/admin.controller.js';

const router = express.Router();

// Publicly report endpoint for any logged-in user
router.post('/reports', protect, createReport);

// All other endpoints require Admin role
router.use(protect, admin);

// Analytics
router.get('/analytics', getAnalytics);

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUserProfile);
router.put('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/reset-xp', resetUserXP);
router.put('/users/:id/reset-streak', resetUserStreak);
router.put('/users/:id/adjust-balance', adjustUserBalance);

// System Settings
router.get('/settings', getAdminSettings);
router.put('/settings', updateAdminSettings);

// Store Item Management
router.get('/store-items', getAdminStoreItems);
router.post('/store-items', createAdminStoreItem);
router.put('/store-items/:id', updateAdminStoreItem);
router.delete('/store-items/:id', deleteAdminStoreItem);

// Transactions & Payments logs
router.get('/transactions', getAdminTransactions);

// Global Events launching
router.post('/events/launch', launchGlobalEvent);

// Admin Gift Rewards System
router.post('/rewards/gift', giftRewards);

// Admin Announcement Center
router.get('/announcements', getAdminAnnouncements);
router.post('/announcements', createAdminAnnouncement);
router.put('/announcements/:id', updateAdminAnnouncement);
router.delete('/announcements/:id', deleteAdminAnnouncement);

// Custom Analytics
router.get('/analytics/custom', getCustomAnalytics);

// Lesson Management
router.get('/lessons', getAllLessons);
router.post('/lessons', createLesson);
router.put('/lessons/:id', editLesson);
router.delete('/lessons/:id', deleteLesson);
router.put('/lessons/reorder', reorderLessons);

// Achievement Management
router.get('/achievements', getAllAchievements);
router.post('/achievements', createAchievement);
router.put('/achievements/:id', editAchievement);
router.delete('/achievements/:id', deleteAchievement);

// Onboarding Management
router.get('/onboarding', getOnboardingContent);
router.put('/onboarding', updateOnboardingContent);

// Social & Moderation
router.get('/reports', getReports);
router.put('/reports/:id', updateReportStatus);
router.get('/chats', getAllMessages);
router.delete('/chats/:messageId', deleteChatMessage);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
