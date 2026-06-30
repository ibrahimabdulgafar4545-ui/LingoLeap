import Message from '../../models/Message.js';
import Conversation from '../../models/Conversation.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import { isFallbackMode, readJsonDb, writeJsonDb } from '../../services/db.service.js';
import { translateChatMessage, transcribeAudioMessage, callAIService } from '../../controllers/ai.controller.new.js';

/**
 * Handles the AI conversation partner response flow.
 * Generates an AI reply, saves it, and emits it back to the user.
 */
const handleAIResponse = async (io, userId, savedMessage) => {
  try {
    let userProfile;
    if (!isFallbackMode()) {
      userProfile = await User.findById(userId);
    } else {
      const db = readJsonDb();
      userProfile = db.users.find(u => u._id === userId);
    }

    const targetLanguage = userProfile?.targetLanguage || 'Spanish';
    const skillLevel = userProfile?.difficultyLevel || userProfile?.skillLevel || 'Beginner';

    // Fetch last 8 messages of history for context
    let historyMessages = [];
    if (!isFallbackMode()) {
      historyMessages = await Message.find({ conversationId: 'ai-conversation-id' })
        .sort({ createdAt: -1 })
        .limit(8);
    } else {
      const db = readJsonDb();
      historyMessages = (db.messages || [])
        .filter(m => m.conversationId === 'ai-conversation-id');
      historyMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      historyMessages = historyMessages.slice(0, 8);
    }
    historyMessages.reverse();

    const conversationHistoryStr = historyMessages.map(m => {
      const senderName = m.sender.toString() === userId.toString() ? 'User' : 'AI';
      return `${senderName}: ${m.text}`;
    }).join('\n');

    const systemPrompt = `You are a friendly language conversation partner for LingoLeap named AI Partner.
The student is practicing their target language: ${targetLanguage}.
Student skill level: ${skillLevel} (Beginner, Intermediate, Advanced).

Your task:
1. Respond to the user's message in ${targetLanguage}.
2. Keep your response short and natural (1-3 sentences), matching their level.
3. If they make a grammatical error, spelling error, or construct a sentence awkwardly, provide a brief, polite correction or suggestion in English at the very end of your response.
4. Translate your main response into English.

Respond strictly as a JSON object:
{
  "reply": "your response in ${targetLanguage}",
  "translation": "English translation of your reply",
  "tip": "optional grammar tip or feedback if the user made a mistake, otherwise empty string"
}
`;

    const contents = [{ role: 'user', parts: [{ text: `Here is the conversation history:\n${conversationHistoryStr}\n\nRespond to the last message.` }] }];
    const aiResult = await callAIService(contents, systemPrompt);

    let aiReplyText = "\u00A1Hola! Sigamos practicando.";
    let aiTranslation = "Hello! Let's keep practicing.";
    let aiTip = "";

    if (aiResult.ok) {
      try {
        let cleaned = aiResult.text.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.reply) {
          aiReplyText = parsed.reply;
          aiTranslation = parsed.translation || "";
          aiTip = parsed.tip || "";
        }
      } catch (e) {
        console.error('Error parsing AI chat partner response:', e);
      }
    }

    if (aiTip) {
      aiReplyText += `\n\n\u{1F4A1} Correction tip: ${aiTip}`;
    }

    let savedAiMessage;
    if (!isFallbackMode()) {
      savedAiMessage = await Message.create({
        conversationId: 'ai-conversation-id',
        sender: '666666666666666666666666',
        recipient: userId,
        text: aiReplyText,
        translatedText: aiTranslation,
        originalLanguage: targetLanguage,
        targetLanguage: 'English',
        messageType: 'text',
        isRead: false
      });

      await Conversation.findByIdAndUpdate('ai-conversation-id', {
        lastMessage: savedAiMessage._id,
        updatedAt: new Date()
      });
    } else {
      const db = readJsonDb();
      db.messages = db.messages || [];
      savedAiMessage = {
        _id: new mongoose.Types.ObjectId().toString(),
        conversationId: 'ai-conversation-id',
        sender: '666666666666666666666666',
        recipient: userId,
        text: aiReplyText,
        translatedText: aiTranslation,
        originalLanguage: targetLanguage,
        targetLanguage: 'English',
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString()
      };
      db.messages.push(savedAiMessage);

      db.conversations = db.conversations || [];
      const cIdx = db.conversations.findIndex(c => c._id === 'ai-conversation-id');
      if (cIdx !== -1) {
        db.conversations[cIdx].lastMessage = savedAiMessage._id;
        db.conversations[cIdx].updatedAt = savedAiMessage.createdAt;
      }
      writeJsonDb(db);
    }

    // Emit AI message to recipient
    io.to(userId).emit('new_message', savedAiMessage);
  } catch (innerErr) {
    console.error('Error in async AI response generator:', innerErr);
  }
};

/**
 * Registers the 'send_message' socket event handler.
 * Handles friend checks, translation, message saving, and AI responses.
 */
export const registerMessagingHandlers = (socket, io, userId) => {
  socket.on('send_message', async ({ conversationId, recipientId, text, messageType, audioUrl, stickerUrl, imageUrl, isViewOnce, replyTo, isForwarded }, callback) => {
    try {
      const isAi = recipientId === '666666666666666666666666' || conversationId === 'ai-conversation-id';
      
      // Enforce friends lock
      let isFriend = false;
      if (isAi) {
        isFriend = true;
        recipientId = '666666666666666666666666';
        conversationId = 'ai-conversation-id';
      } else {
        if (!isFallbackMode()) {
          const sender = await User.findById(userId);
          isFriend = sender && (sender.friends || []).some(id => id.toString() === recipientId.toString());
        } else {
          const db = readJsonDb();
          const sender = db.users.find(u => u._id === userId);
          isFriend = sender && (sender.friends || []).some(id => id.toString() === recipientId.toString());
        }
      }

      if (!isFriend) {
        return callback?.({ success: false, error: 'Chat is locked until you are friends.' });
      }

      if (text && text.length > 2000) {
        return callback?.({ success: false, error: 'Message is too long.' });
      }

      let translatedText = null;
      let sourceLanguage = null;
      let targetLang = 'English'; // fallback

      // Get recipient to find their learning language
      let recipientUser;
      if (isAi) {
        if (!isFallbackMode()) {
          const sender = await User.findById(userId);
          targetLang = sender?.targetLanguage || 'Spanish';
        } else {
          const db = readJsonDb();
          const sender = db.users.find(u => u._id === userId);
          targetLang = sender?.targetLanguage || 'Spanish';
        }
      } else {
        if (!isFallbackMode()) {
          recipientUser = await User.findById(recipientId);
        } else {
          const db = readJsonDb();
          recipientUser = db.users.find(u => u._id === recipientId);
        }
        if (recipientUser && recipientUser.targetLanguage) {
          targetLang = recipientUser.targetLanguage;
        }
      }

      let actualText = text;

      if (messageType === 'audio' && audioUrl) {
        actualText = await transcribeAudioMessage(audioUrl);
      }

      if (actualText && actualText.trim().length > 0 && messageType !== 'sticker') {
        const translationResult = await translateChatMessage(actualText, targetLang);
        translatedText = translationResult.translatedText;
        sourceLanguage = translationResult.sourceLanguage;
      }

      let savedMessage;
      if (!isFallbackMode()) {
        savedMessage = await Message.create({
          conversationId,
          sender: userId,
          recipient: recipientId,
          text: actualText || (messageType === 'image' ? 'Image' : ''),
          translatedText,
          originalLanguage: sourceLanguage,
          targetLanguage: targetLang,
          messageType: messageType || 'text',
          audioUrl,
          stickerUrl,
          imageUrl,
          isViewOnce: !!isViewOnce,
          replyTo: replyTo || null,
          isForwarded: !!isForwarded
        });

        if (savedMessage.replyTo) {
          await savedMessage.populate('replyTo');
        }
        
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: savedMessage._id,
          updatedAt: new Date()
        });
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        db.conversations = db.conversations || [];

        savedMessage = {
          _id: new mongoose.Types.ObjectId().toString(),
          conversationId,
          sender: userId,
          recipient: recipientId,
          text: actualText || (messageType === 'image' ? 'Image' : ''),
          translatedText,
          originalLanguage: sourceLanguage,
          targetLanguage: targetLang,
          messageType: messageType || 'text',
          audioUrl,
          stickerUrl,
          imageUrl,
          isViewOnce: !!isViewOnce,
          replyTo: replyTo || null,
          isForwarded: !!isForwarded,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        db.messages.push(savedMessage);

        if (savedMessage.replyTo) {
          const replyMsg = db.messages.find(m => m._id === savedMessage.replyTo);
          if (replyMsg) {
            savedMessage.replyTo = replyMsg;
          }
        }

        const cIdx = db.conversations.findIndex(c => c._id === conversationId);
        if (cIdx !== -1) {
          db.conversations[cIdx].lastMessage = savedMessage._id;
          db.conversations[cIdx].updatedAt = savedMessage.createdAt;
        }
        writeJsonDb(db);
      }

      // Emit message to sender and recipient
      io.to(userId).to(recipientId).emit('new_message', savedMessage);
      callback?.({ success: true, message: savedMessage });

      // Trigger AI Conversation Partner response asynchronously
      if (isAi) {
        handleAIResponse(io, userId, savedMessage);
      }
    } catch (err) {
      console.error('Socket error sending message:', err);
      callback?.({ success: false, error: 'Server error sending message' });
    }
  });
};
