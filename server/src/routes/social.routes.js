import express from 'express';
import {
  searchUsers,
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
  permanentlyRemoveBlockedUser,
  getFriendProfile,
  getNotifications,
  markNotificationsRead,
  getFriendFeed,
  followUser,
  unfollowUser
} from '../controllers/social.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All social routes require authentication

router.get('/search', searchUsers);
router.get('/friends', getFriends);
router.post('/request', sendFriendRequest);
router.post('/request/accept', acceptFriendRequest);
router.post('/request/reject', rejectFriendRequest);
router.post('/request/cancel', cancelFriendRequest);
router.delete('/friends/:friendId', removeFriend);
router.get('/blocked', getBlockedUsers);
router.post('/block', blockUser);
router.post('/unblock', unblockUser);
router.post('/blocked/remove', permanentlyRemoveBlockedUser);
router.get('/profile/:userId', getFriendProfile);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);
router.get('/feed', getFriendFeed);

// Legacy compat
router.post('/follow', followUser);
router.delete('/unfollow/:userIdToUnfollow', unfollowUser);

export default router;
