import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
  claimReward,
  getAnnouncements,
  viewAnnouncement
} from '../controllers/notification.controller.js';

const router = express.Router();

// Notification management
router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllRead);
router.delete('/', protect, deleteAllNotifications);
router.put('/:id/read', protect, markNotificationRead);
router.delete('/:id', protect, deleteNotification);
router.post('/:id/claim-reward', protect, claimReward);

// Announcements for current user
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements/:id/view', protect, viewAnnouncement);

export default router;
