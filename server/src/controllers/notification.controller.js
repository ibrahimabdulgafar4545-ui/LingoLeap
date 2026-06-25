import {
  findUserById,
  updateUser,
  getAnnouncementsFromDb,
  getAnnouncementByIdFromDb,
  updateAnnouncementInDb,
  incrementAnalyticsMetric
} from '../services/db.service.js';

// @desc    Get user's notifications
// @route   GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({
      success: true,
      notifications: user.notifications || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const notification = (user.notifications || []).find(n => (n._id || n.id || '').toString() === id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (!notification.read) {
      notification.read = true;
      await updateUser(userId, { notifications: user.notifications });
      await incrementAnalyticsMetric('notification_opens');
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notifications: user.notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let openedCount = 0;
    (user.notifications || []).forEach(n => {
      if (!n.read) {
        n.read = true;
        openedCount++;
      }
    });

    if (openedCount > 0) {
      await updateUser(userId, { notifications: user.notifications });
      for (let i = 0; i < openedCount; i++) {
        await incrementAnalyticsMetric('notification_opens');
      }
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      notifications: user.notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const filtered = (user.notifications || []).filter(n => (n._id || n.id || '').toString() !== id);
    await updateUser(userId, { notifications: filtered });

    res.status(200).json({
      success: true,
      message: 'Notification deleted.',
      notifications: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await updateUser(userId, { notifications: [] });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
      notifications: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Claim a reward from a notification
// @route   POST /api/notifications/:id/claim-reward
export const claimReward = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const notification = (user.notifications || []).find(n => (n._id || n.id || '').toString() === id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (notification.type !== 'reward') {
      return res.status(400).json({ success: false, message: 'This notification is not a reward.' });
    }

    if (notification.rewardClaimed) {
      return res.status(400).json({ success: false, message: 'Reward has already been claimed.' });
    }

    // Apply reward
    const rewardType = notification.rewardType;
    const rewardAmount = Number(notification.rewardAmount) || 0;
    const rewardItem = notification.rewardItem;

    const updates = {};
    if (rewardType === 'gems') {
      updates.gems = (user.gems || 0) + rewardAmount;
    } else if (rewardType === 'hearts') {
      const maxHearts = user.hearts?.max || 5;
      updates.hearts = {
        ...user.hearts,
        current: Math.min((user.hearts?.current || 0) + rewardAmount, maxHearts),
        lastRegeneratedAt: new Date()
      };
    } else if (rewardType === 'xp') {
      const newXp = (user.xp || 0) + rewardAmount;
      updates.xp = newXp;
      updates.level = Math.floor(newXp / 100) + 1;
    } else if (rewardType === 'special') {
      const owned = user.ownedItems || [];
      if (rewardItem && !owned.includes(rewardItem)) {
        updates.ownedItems = [...owned, rewardItem];
      }
    }

    // Mark as claimed and read
    notification.rewardClaimed = true;
    notification.read = true;
    updates.notifications = user.notifications;

    const updatedUser = await updateUser(userId, updates);
    await incrementAnalyticsMetric('reward_claims');
    await incrementAnalyticsMetric('notification_opens');

    res.status(200).json({
      success: true,
      message: 'Reward claimed successfully!',
      user: updatedUser,
      notifications: updatedUser.notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get announcements for the current user
// @route   GET /api/notifications/announcements
export const getAnnouncements = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const announcements = await getAnnouncementsFromDb(userId, false);
    res.status(200).json({
      success: true,
      announcements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record announcement view
// @route   POST /api/notifications/announcements/:id/view
export const viewAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await getAnnouncementByIdFromDb(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    const currentViews = announcement.viewsCount || 0;
    await updateAnnouncementInDb(id, { viewsCount: currentViews + 1 });
    await incrementAnalyticsMetric('announcement_views');

    res.status(200).json({
      success: true,
      message: 'Announcement view recorded.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
