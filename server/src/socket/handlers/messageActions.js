import Message from '../../models/Message.js';
import Conversation from '../../models/Conversation.js';
import mongoose from 'mongoose';
import { isFallbackMode, readJsonDb, writeJsonDb } from '../../services/db.service.js';
import { translateChatMessage } from '../../controllers/ai.controller.new.js';

/**
 * Registers socket event handlers for message actions:
 * read receipts, delete, react, edit, delete-for-me, delete-for-everyone, view-once.
 */
export const registerMessageActionHandlers = (socket, io, userId) => {
  // Handle read receipts
  socket.on('read_messages', async ({ conversationId, otherUserId }) => {
    if (!isFallbackMode()) {
      await Message.updateMany(
        { conversationId, sender: otherUserId, isRead: false },
        { $set: { isRead: true } }
      );
    } else {
      const db = readJsonDb();
      db.messages = db.messages || [];
      db.messages.forEach(m => {
        if (m.conversationId === conversationId && m.sender === otherUserId && !m.isRead) {
          m.isRead = true;
        }
      });
      writeJsonDb(db);
    }
    socket.to(otherUserId).emit('messages_read', { conversationId, readerId: userId });
  });

  // Handle message delete
  socket.on('delete_message', async ({ messageId, conversationId, recipientId }, callback) => {
    try {
      let isOwner = false;
      if (!isFallbackMode()) {
        const msg = await Message.findById(messageId);
        isOwner = msg && msg.sender.toString() === userId;
        if (isOwner) {
          await Message.findByIdAndDelete(messageId);
          const remaining = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(1);
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: remaining.length > 0 ? remaining[0]._id : null
          });
        }
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        const idx = db.messages.findIndex(m => m._id === messageId);
        isOwner = idx !== -1 && db.messages[idx].sender === userId;
        if (isOwner) {
          db.messages.splice(idx, 1);
          const remaining = db.messages.filter(m => m.conversationId === conversationId);
          remaining.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const cIdx = db.conversations.findIndex(c => c._id === conversationId);
          if (cIdx !== -1) {
            db.conversations[cIdx].lastMessage = remaining.length > 0 ? remaining[0]._id : null;
          }
          writeJsonDb(db);
        }
      }

      if (isOwner) {
        io.to(userId).to(recipientId).emit('message_deleted', { messageId, conversationId });
        callback?.({ success: true });
      } else {
        callback?.({ success: false, error: 'Unauthorized delete request' });
      }
    } catch (err) {
      console.error('Socket message delete error:', err);
      callback?.({ success: false, error: 'Server error' });
    }
  });

  // Handle message reaction
  socket.on('react_message', async ({ messageId, conversationId, recipientId, emoji }, callback) => {
    try {
      let updatedReactions = [];
      if (!isFallbackMode()) {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ success: false, error: 'Message not found' });
        }

        const existingReactionIndex = (message.reactions || []).findIndex(
          r => r.userId.toString() === userId
        );

        if (existingReactionIndex !== -1) {
          if (message.reactions[existingReactionIndex].emoji === emoji) {
            message.reactions.splice(existingReactionIndex, 1);
          } else {
            message.reactions[existingReactionIndex].emoji = emoji;
          }
        } else {
          message.reactions = message.reactions || [];
          message.reactions.push({ userId, emoji });
        }

        await message.save();
        updatedReactions = message.reactions;
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        const idx = db.messages.findIndex(m => m._id === messageId);
        if (idx === -1) {
          return callback?.({ success: false, error: 'Message not found' });
        }

        const message = db.messages[idx];
        message.reactions = message.reactions || [];

        const existingReactionIndex = message.reactions.findIndex(
          r => r.userId === userId
        );

        if (existingReactionIndex !== -1) {
          if (message.reactions[existingReactionIndex].emoji === emoji) {
            message.reactions.splice(existingReactionIndex, 1);
          } else {
            message.reactions[existingReactionIndex].emoji = emoji;
          }
        } else {
          message.reactions.push({ userId, emoji });
        }

        writeJsonDb(db);
        updatedReactions = message.reactions;
      }

      io.to(userId).to(recipientId).emit('message_reaction', {
        messageId,
        conversationId,
        reactions: updatedReactions
      });

      callback?.({ success: true, reactions: updatedReactions });
    } catch (err) {
      console.error('Socket reaction error:', err);
      callback?.({ success: false, error: 'Server error adding reaction' });
    }
  });

  // Handle message editing
  socket.on('edit_message', async ({ messageId, conversationId, recipientId, newText }, callback) => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      let savedMessage;

      if (!isFallbackMode()) {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ success: false, error: 'Message not found' });
        }
        if (message.sender.toString() !== userId) {
          return callback?.({ success: false, error: 'You can only edit your own messages' });
        }
        if (message.createdAt < fifteenMinutesAgo) {
          return callback?.({ success: false, error: 'Edit time limit (15 mins) exceeded' });
        }

        let translatedText = message.translatedText;
        let originalLanguage = message.originalLanguage;
        if (newText && newText !== message.text) {
          const translationResult = await translateChatMessage(newText, message.targetLanguage);
          translatedText = translationResult.translatedText;
          originalLanguage = translationResult.sourceLanguage;
        }

        message.text = newText;
        message.translatedText = translatedText;
        message.originalLanguage = originalLanguage;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();
        savedMessage = message;
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        const idx = db.messages.findIndex(m => m._id === messageId);
        if (idx === -1) {
          return callback?.({ success: false, error: 'Message not found' });
        }
        const message = db.messages[idx];
        if (message.sender !== userId) {
          return callback?.({ success: false, error: 'You can only edit your own messages' });
        }
        if (new Date(message.createdAt) < fifteenMinutesAgo) {
          return callback?.({ success: false, error: 'Edit time limit (15 mins) exceeded' });
        }

        let translatedText = message.translatedText;
        let originalLanguage = message.originalLanguage;
        if (newText && newText !== message.text) {
          const translationResult = await translateChatMessage(newText, message.targetLanguage);
          translatedText = translationResult.translatedText;
          originalLanguage = translationResult.sourceLanguage;
        }

        message.text = newText;
        message.translatedText = translatedText;
        message.originalLanguage = originalLanguage;
        message.isEdited = true;
        message.editedAt = new Date().toISOString();
        writeJsonDb(db);
        savedMessage = message;
      }

      io.to(userId).to(recipientId).emit('new_message', savedMessage);
      callback?.({ success: true, message: savedMessage });
    } catch (err) {
      console.error('Socket edit_message error:', err);
      callback?.({ success: false, error: 'Server error editing message' });
    }
  });

  // Handle delete for me
  socket.on('delete_message_for_me', async ({ messageId, conversationId }, callback) => {
    try {
      if (!isFallbackMode()) {
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { deletedForUsers: userId }
        });
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        const idx = db.messages.findIndex(m => m._id === messageId);
        if (idx !== -1) {
          db.messages[idx].deletedForUsers = db.messages[idx].deletedForUsers || [];
          if (!db.messages[idx].deletedForUsers.includes(userId)) {
            db.messages[idx].deletedForUsers.push(userId);
          }
          writeJsonDb(db);
        }
      }
      callback?.({ success: true });
    } catch (err) {
      console.error('Socket delete_message_for_me error:', err);
      callback?.({ success: false, error: 'Server error deleting message' });
    }
  });

  // Handle delete for everyone
  socket.on('delete_message_for_everyone', async ({ messageId, conversationId, recipientId }, callback) => {
    try {
      let savedMessage;
      if (!isFallbackMode()) {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ success: false, error: 'Message not found' });
        }
        if (message.sender.toString() !== userId) {
          return callback?.({ success: false, error: 'You can only delete your own messages' });
        }

        message.isDeletedForEveryone = true;
        message.text = 'This message was deleted';
        message.translatedText = 'This message was deleted';
        message.imageUrl = null;
        message.audioUrl = null;
        message.stickerUrl = null;
        await message.save();
        savedMessage = message;
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        const idx = db.messages.findIndex(m => m._id === messageId);
        if (idx === -1) {
          return callback?.({ success: false, error: 'Message not found' });
        }
        const message = db.messages[idx];
        if (message.sender !== userId) {
          return callback?.({ success: false, error: 'You can only delete your own messages' });
        }

        message.isDeletedForEveryone = true;
        message.text = 'This message was deleted';
        message.translatedText = 'This message was deleted';
        message.imageUrl = null;
        message.audioUrl = null;
        message.stickerUrl = null;
        writeJsonDb(db);
        savedMessage = message;
      }

      io.to(userId).to(recipientId).emit('message_deleted_for_everyone', { messageId, conversationId, message: savedMessage });
      callback?.({ success: true });
    } catch (err) {
      console.error('Socket delete_message_for_everyone error:', err);
      callback?.({ success: false, error: 'Server error deleting message' });
    }
  });

  // Handle open view once
  socket.on('open_view_once', async ({ messageId, conversationId, recipientId }, callback) => {
    try {
      let savedMessage;
      if (!isFallbackMode()) {
        const message = await Message.findById(messageId);
        if (!message) {
          return callback?.({ success: false, error: 'Message not found' });
        }
        message.viewOnceOpened = true;
        message.text = 'Opened';
        message.translatedText = 'Opened';
        message.imageUrl = null;
        await message.save();
        savedMessage = message;
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        const idx = db.messages.findIndex(m => m._id === messageId);
        if (idx === -1) {
          return callback?.({ success: false, error: 'Message not found' });
        }
        const message = db.messages[idx];
        message.viewOnceOpened = true;
        message.text = 'Opened';
        message.translatedText = 'Opened';
        message.imageUrl = null;
        writeJsonDb(db);
        savedMessage = message;
      }

      io.to(userId).to(recipientId).emit('message_view_once_opened', { messageId, conversationId, message: savedMessage });
      callback?.({ success: true });
    } catch (err) {
      console.error('Socket open_view_once error:', err);
      callback?.({ success: false, error: 'Server error opening view once message' });
    }
  });
};
