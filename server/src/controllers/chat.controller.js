import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { isFallbackMode, readJsonDb, writeJsonDb, findUserById } from '../services/db.service.js';
import mongoose from 'mongoose';

// Helper to check if two users are friends
const checkAreFriends = async (userId1, userId2) => {
  if (!isFallbackMode()) {
    const user = await User.findById(userId1);
    return user && (user.friends || []).some(id => id.toString() === userId2.toString());
  }
  const db = readJsonDb();
  const user = db.users.find(u => u._id === userId1);
  return user && (user.friends || []).some(id => id.toString() === userId2.toString());
};

// Create or fetch conversation
export const createConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (currentUserId === recipientId) {
      return res.status(400).json({ message: 'You cannot chat with yourself' });
    }

    if (recipientId === '666666666666666666666666') {
      return res.json({
        _id: 'ai-conversation-id',
        participants: [currentUserId, '666666666666666666666666'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 1. Lock check: must be friends
    const isFriend = await checkAreFriends(currentUserId, recipientId);
    if (!isFriend) {
      return res.status(403).json({ message: 'Chat is locked until you are friends.' });
    }

    if (!isFallbackMode()) {
      // Find existing
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, recipientId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [currentUserId, recipientId]
        });
      }

      return res.json(conversation);
    }

    // Fallback logic
    const db = readJsonDb();
    db.conversations = db.conversations || [];

    let conversation = db.conversations.find(c =>
      c.participants.includes(currentUserId) && c.participants.includes(recipientId)
    );

    if (!conversation) {
      conversation = {
        _id: new mongoose.Types.ObjectId().toString(),
        participants: [currentUserId, recipientId],
        lastMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.conversations.push(conversation);
      writeJsonDb(db);
    }

    res.json(conversation);
  } catch (error) {
    console.error('Create Conversation Error:', error);
    res.status(500).json({ message: 'Server error creating conversation' });
  }
};

// Get conversations list with unread counter, last message, presence
export const getConversations = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();
    const { q } = req.query; // search filter

    if (!isFallbackMode()) {
      let conversations = await Conversation.find({
        participants: currentUserId
      })
        .populate('participants', 'username email avatarUrl level xp isOnline lastSeen friends')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

      // Transform conversations to compute unread counts and filter based on search
      let results = [];
      for (let conv of conversations) {
        const otherParticipant = conv.participants.find(p => p._id.toString() !== currentUserId);
        if (!otherParticipant) continue;

        // Apply search query filter if provided
        if (q) {
          const qLower = q.toLowerCase();
          const matchesSearch = otherParticipant.username.toLowerCase().includes(qLower) || 
                                otherParticipant.email.toLowerCase().includes(qLower);
          if (!matchesSearch) continue;
        }

        // Count unread messages sent by the other participant
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          sender: otherParticipant._id,
          isRead: false
        });

        // Check if currently friends (if friendship was removed, lock chat status)
        const isFriend = (otherParticipant.friends || []).some(id => id.toString() === currentUserId.toString());

        results.push({
          _id: conv._id,
          otherUser: {
            _id: otherParticipant._id,
            username: otherParticipant.username,
            email: otherParticipant.email,
            avatarUrl: otherParticipant.avatarUrl,
            level: otherParticipant.level,
            xp: otherParticipant.xp,
            isOnline: otherParticipant.isOnline,
            lastSeen: otherParticipant.lastSeen
          },
          lastMessage: conv.lastMessage,
          unreadCount,
          isLocked: !isFriend,
          updatedAt: conv.updatedAt
        });
      }

      return res.json(results);
    }

    // Fallback logic
    const db = readJsonDb();
    db.conversations = db.conversations || [];
    db.messages = db.messages || [];

    const userConvs = db.conversations.filter(c => c.participants.includes(currentUserId));

    let results = [];
    for (let conv of userConvs) {
      const otherId = conv.participants.find(id => id !== currentUserId);
      const otherParticipant = db.users.find(u => u._id === otherId);
      if (!otherParticipant) continue;

      if (q) {
        const qLower = q.toLowerCase();
        const matchesSearch = otherParticipant.username.toLowerCase().includes(qLower) || 
                              otherParticipant.email.toLowerCase().includes(qLower);
        if (!matchesSearch) continue;
      }

      const lastMsg = db.messages.find(m => m._id === conv.lastMessage) || null;
      const unreadCount = db.messages.filter(m =>
        m.conversationId === conv._id && m.sender === otherId && !m.isRead
      ).length;

      const isFriend = (otherParticipant.friends || []).some(id => id.toString() === currentUserId.toString());

      results.push({
        _id: conv._id,
        otherUser: {
          _id: otherParticipant._id,
          username: otherParticipant.username,
          email: otherParticipant.email,
          avatarUrl: otherParticipant.avatarUrl,
          level: otherParticipant.level,
          xp: otherParticipant.xp,
          isOnline: otherParticipant.isOnline || false,
          lastSeen: otherParticipant.lastSeen || new Date().toISOString()
        },
        lastMessage: lastMsg,
        unreadCount,
        isLocked: !isFriend,
        updatedAt: conv.updatedAt
      });
    }

    results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Append AI Conversation Partner dynamically
    let hasAiConv = results.some(r => r.otherUser?._id?.toString() === '666666666666666666666666');
    let shouldIncludeAi = true;
    if (q) {
      const qLower = q.toLowerCase();
      shouldIncludeAi = 'ai conversation partner robot tutor'.includes(qLower);
    }

    if (!hasAiConv && shouldIncludeAi) {
      let lastMsg = null;
      if (!isFallbackMode()) {
        lastMsg = await Message.findOne({ conversationId: 'ai-conversation-id' }).sort({ createdAt: -1 });
      } else {
        const db = readJsonDb();
        const aiMsgs = (db.messages || []).filter(m => m.conversationId === 'ai-conversation-id');
        if (aiMsgs.length > 0) {
          aiMsgs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          lastMsg = aiMsgs[0];
        }
      }

      const welcomeTexts = {
        Spanish: '¡Hola! Soy tu compañero de IA. ¿De qué te gustaría hablar hoy?',
        French: 'Bonjour! Je suis ton partenaire IA. De quoi aimerais-tu parler aujourd\'hui ?',
        German: 'Hallo! Ich bin dein KI-Partner. Worüber möchtest du heute sprechen?',
        Arabic: 'مرحباً! أنا شريكك بالذكاء الاصطناعي. عن ماذا تريد أن نتحدث اليوم؟',
        Italian: 'Ciao! Sono il tuo partner IA. Di cosa vorresti parlare oggi?',
        English: 'Hello! I am your AI partner. What would you like to talk about today?'
      };

      const userLang = req.user?.targetLanguage || 'Spanish';
      const welcomeText = welcomeTexts[userLang] || welcomeTexts['Spanish'];

      results.unshift({
        _id: 'ai-conversation-id',
        otherUser: {
          _id: '666666666666666666666666',
          username: 'AI Chat Partner 🤖',
          email: 'aipartner@lingoleap.ai',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=AIPartner',
          level: 99,
          xp: 99999,
          isOnline: true,
          lastSeen: new Date().toISOString()
        },
        lastMessage: lastMsg || {
          _id: 'ai-welcome-msg',
          text: welcomeText,
          createdAt: new Date().toISOString()
        },
        unreadCount: 0,
        isLocked: false,
        updatedAt: lastMsg ? lastMsg.createdAt : new Date().toISOString()
      });
    }

    res.json(results);
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({ message: 'Server error loading conversations' });
  }
};

// Get message history
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (conversationId === 'ai-conversation-id') {
      let messages = [];
      if (!isFallbackMode()) {
        messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
      } else {
        const db = readJsonDb();
        messages = (db.messages || []).filter(m => m.conversationId === conversationId);
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      if (messages.length === 0) {
        const welcomeTexts = {
          Spanish: '¡Hola! Soy tu compañero de IA. ¿De qué te gustaría hablar hoy?',
          French: 'Bonjour! Je suis ton partenaire IA. De quoi aimerais-tu parler aujourd\'hui ?',
          German: 'Hallo! Ich bin dein KI-Partner. Worüber möchtest du heute sprechen?',
          Arabic: 'مرحباً! أنا شريكك بالذكاء الاصطناعي. عن ماذا تريد أن نتحدث اليوم؟',
          Italian: 'Ciao! Sono il tuo partner IA. Di cosa vorresti parlare oggi?',
          English: 'Hello! I am your AI partner. What would you like to talk about today?'
        };
        const userLang = req.user?.targetLanguage || 'Spanish';
        const welcomeText = welcomeTexts[userLang] || welcomeTexts['Spanish'];

        const welcomeMsg = {
          _id: 'ai-welcome-msg',
          conversationId: 'ai-conversation-id',
          sender: '666666666666666666666666',
          recipient: currentUserId,
          text: welcomeText,
          translatedText: 'Hello! I am your AI partner. What would you like to talk about today?',
          originalLanguage: userLang,
          targetLanguage: 'English',
          messageType: 'text',
          isRead: true,
          createdAt: new Date().toISOString()
        };
        messages = [welcomeMsg];
      }
      return res.json(messages);
    }

    if (!isFallbackMode()) {
      // Find conversation first to verify access
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(currentUserId)) {
        return res.status(403).json({ message: 'Access denied to this conversation' });
      }

      const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
      return res.json(messages);
    }

    // Fallback logic
    const db = readJsonDb();
    db.conversations = db.conversations || [];
    db.messages = db.messages || [];

    const conversation = db.conversations.find(c => c._id === conversationId);
    if (!conversation || !conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    const messages = db.messages.filter(m => m.conversationId === conversationId);
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json(messages);
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ message: 'Server error loading messages' });
  }
};

// Delete own message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      if (message.sender.toString() !== currentUserId) {
        return res.status(403).json({ message: 'You can only delete your own messages' });
      }

      const conversationId = message.conversationId;
      await Message.findByIdAndDelete(messageId);

      // Check if this was the last message, if so update conversation
      const remainingMessages = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(1);
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        conversation.lastMessage = remainingMessages.length > 0 ? remainingMessages[0]._id : null;
        await conversation.save();
      }

      return res.json({ message: 'Message deleted successfully', conversationId });
    }

    // Fallback logic
    const db = readJsonDb();
    db.messages = db.messages || [];
    db.conversations = db.conversations || [];

    const msgIndex = db.messages.findIndex(m => m._id === messageId);
    if (msgIndex === -1) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = db.messages[msgIndex];
    if (message.sender !== currentUserId) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    const conversationId = message.conversationId;
    db.messages.splice(msgIndex, 1);

    // Update conversation's last message if needed
    const remaining = db.messages.filter(m => m.conversationId === conversationId);
    remaining.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const convIndex = db.conversations.findIndex(c => c._id === conversationId);
    if (convIndex !== -1) {
      db.conversations[convIndex].lastMessage = remaining.length > 0 ? remaining[0]._id : null;
    }

    writeJsonDb(db);
    res.json({ message: 'Message deleted successfully', conversationId });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({ message: 'Server error deleting message' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId, otherUserId } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      await Message.updateMany(
        { conversationId, sender: otherUserId, isRead: false },
        { $set: { isRead: true } }
      );
      return res.json({ success: true });
    }

    // Fallback logic
    const db = readJsonDb();
    db.messages = db.messages || [];

    db.messages.forEach(m => {
      if (m.conversationId === conversationId && m.sender === otherUserId && !m.isRead) {
        m.isRead = true;
      }
    });

    writeJsonDb(db);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ message: 'Server error marking messages as read' });
  }
};
