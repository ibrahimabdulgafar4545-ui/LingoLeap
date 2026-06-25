import express from 'express';
import {
  createConversation,
  getConversations,
  getMessages,
  deleteMessage,
  markAsRead
} from '../controllers/chat.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/messages/:conversationId', getMessages);
router.delete('/messages/:messageId', deleteMessage);
router.post('/messages/read', markAsRead);

export default router;
