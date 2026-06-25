import api from './api';

export const socialService = {
  searchUsers: async (query) => {
    const res = await api.get(`/social/search?q=${query}`);
    return res.data;
  },
  getFriends: async () => {
    const res = await api.get('/social/friends');
    return res.data;
  },
  sendFriendRequest: async (recipientId) => {
    const res = await api.post('/social/request', { recipientId });
    return res.data;
  },
  acceptFriendRequest: async (requesterId) => {
    const res = await api.post('/social/request/accept', { requesterId });
    return res.data;
  },
  rejectFriendRequest: async (requesterId) => {
    const res = await api.post('/social/request/reject', { requesterId });
    return res.data;
  },
  cancelFriendRequest: async (recipientId) => {
    const res = await api.post('/social/request/cancel', { recipientId });
    return res.data;
  },
  removeFriend: async (friendId) => {
    const res = await api.delete(`/social/friends/${friendId}`);
    return res.data;
  },
  blockUser: async (userIdToBlock) => {
    const res = await api.post('/social/block', { userIdToBlock });
    return res.data;
  },
  unblockUser: async (userIdToUnblock) => {
    const res = await api.post('/social/unblock', { userIdToUnblock });
    return res.data;
  },
  getFriendProfile: async (userId) => {
    const res = await api.get(`/social/profile/${userId}`);
    return res.data;
  },
  getNotifications: async () => {
    const res = await api.get('/social/notifications');
    return res.data;
  },
  markNotificationsRead: async () => {
    const res = await api.post('/social/notifications/read');
    return res.data;
  },
  getFriendFeed: async () => {
    const res = await api.get('/social/feed');
    return res.data;
  },

  // Legacy compat
  followUser: async (userIdToFollow) => {
    const res = await api.post('/social/follow', { userIdToFollow });
    return res.data;
  },
  unfollowUser: async (userIdToUnfollow) => {
    const res = await api.delete(`/social/unfollow/${userIdToUnfollow}`);
    return res.data;
  }
};
