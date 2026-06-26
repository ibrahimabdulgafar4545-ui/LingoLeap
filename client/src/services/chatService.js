import api from './api';

export const chatService = {
  getConversations: async (query = '') => {
    const res = await api.get(`/chat/conversations?q=${query}`);
    return res.data;
  },
  getMessages: async (conversationId) => {
    const res = await api.get(`/chat/messages/${conversationId}`);
    return res.data;
  },
  createConversation: async (recipientId) => {
    const res = await api.post('/chat/conversations', { recipientId });
    return res.data;
  },
  deleteMessage: async (messageId) => {
    const res = await api.delete(`/chat/messages/${messageId}`);
    return res.data;
  },
  markAsRead: async (conversationId, otherUserId) => {
    const res = await api.post('/chat/messages/read', { conversationId, otherUserId });
    return res.data;
  }
};

