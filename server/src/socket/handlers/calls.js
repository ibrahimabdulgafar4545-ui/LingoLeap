import mongoose from 'mongoose';
import { isFallbackMode, readJsonDb, writeJsonDb } from '../../services/db.service.js';

/**
 * Registers WebRTC signaling and call logging socket event handlers.
 */
export const registerCallHandlers = (socket, io, userId) => {
  // WebRTC Calling Signaling Events
  socket.on('call_user', ({ recipientId, signalData, type }) => {
    console.log(`📞 Socket: Routing call from ${socket.user.username} to ${recipientId} (${type})`);
    socket.to(recipientId).emit('incoming_call', {
      callerId: userId,
      callerUsername: socket.user.username,
      callerAvatarUrl: socket.user.avatarUrl,
      signalData,
      type
    });
  });

  socket.on('answer_call', ({ callerId, signalData, accepted }) => {
    console.log(`📞 Socket: Routing answer from ${socket.user.username} to ${callerId} (Accepted: ${accepted})`);
    socket.to(callerId).emit('call_answered', {
      recipientId: userId,
      signalData,
      accepted
    });
  });

  socket.on('end_call', ({ otherUserId }) => {
    console.log(`📞 Socket: End call session between ${userId} and ${otherUserId}`);
    socket.to(otherUserId).emit('call_ended');
  });

  socket.on('webrtc_signal', ({ recipientId, signalData }) => {
    socket.to(recipientId).emit('webrtc_signal', {
      senderId: userId,
      signalData
    });
  });

  socket.on('call_caption', ({ recipientId, text }) => {
    socket.to(recipientId).emit('incoming_caption', {
      senderId: userId,
      text
    });
  });

  socket.on('log_call', async ({ receiverId, type, status, duration }) => {
    try {
      const callerId = userId;

      // 1. Save Call History
      let callRecord;
      if (!isFallbackMode()) {
        const CallHistory = (await import('../../models/CallHistory.js')).default;
        callRecord = await CallHistory.create({
          caller: callerId,
          receiver: receiverId,
          type,
          status,
          duration: duration || 0
        });
      } else {
        const db = readJsonDb();
        db.callHistory = db.callHistory || [];
        callRecord = {
          _id: new mongoose.Types.ObjectId().toString(),
          caller: callerId,
          receiver: receiverId,
          type,
          status,
          duration: duration || 0,
          createdAt: new Date().toISOString()
        };
        db.callHistory.push(callRecord);
        writeJsonDb(db);
      }

      // 2. Find or Create Conversation
      let conversationId;
      if (!isFallbackMode()) {
        const Conversation = (await import('../../models/Conversation.js')).default;
        let conversation = await Conversation.findOne({
          participants: { $all: [callerId, receiverId] }
        });
        if (!conversation) {
          conversation = await Conversation.create({
            participants: [callerId, receiverId]
          });
        }
        conversationId = conversation._id;
      } else {
        const db = readJsonDb();
        db.conversations = db.conversations || [];
        let conversation = db.conversations.find(c =>
          c.participants.includes(callerId) && c.participants.includes(receiverId)
        );
        if (!conversation) {
          conversation = {
            _id: new mongoose.Types.ObjectId().toString(),
            participants: [callerId, receiverId],
            lastMessage: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.conversations.push(conversation);
          writeJsonDb(db);
        }
        conversationId = conversation._id;
      }

      // 3. Construct text for Call Log
      const formatDuration = (sec) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      };

      let callText = '';
      if (status === 'missed') {
        callText = `Missed ${type} call`;
      } else if (status === 'declined') {
        callText = `Declined ${type} call`;
      } else {
        callText = `${type === 'audio' ? 'Voice' : 'Video'} call, duration ${formatDuration(duration)}`;
      }

      // 4. Save call_log Message
      let savedMessage;
      if (!isFallbackMode()) {
        const Message = (await import('../../models/Message.js')).default;
        const Conversation = (await import('../../models/Conversation.js')).default;
        savedMessage = await Message.create({
          conversationId,
          sender: callerId,
          recipient: receiverId,
          text: callText,
          messageType: 'call_log',
          callDuration: duration || 0,
          callStatus: status,
          callType: type
        });
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: savedMessage._id,
          updatedAt: new Date()
        });
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        savedMessage = {
          _id: new mongoose.Types.ObjectId().toString(),
          conversationId: conversationId.toString(),
          sender: callerId,
          recipient: receiverId,
          text: callText,
          messageType: 'call_log',
          callDuration: duration || 0,
          callStatus: status,
          callType: type,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        db.messages.push(savedMessage);

        const cIdx = db.conversations.findIndex(c => c._id === conversationId.toString());
        if (cIdx !== -1) {
          db.conversations[cIdx].lastMessage = savedMessage._id;
          db.conversations[cIdx].updatedAt = savedMessage.createdAt;
        }
        writeJsonDb(db);
      }

      // 5. Emit message to sender and recipient
      io.to(callerId).to(receiverId).emit('new_message', savedMessage);
    } catch (err) {
      console.error('Socket log_call error:', err);
    }
  });
};
