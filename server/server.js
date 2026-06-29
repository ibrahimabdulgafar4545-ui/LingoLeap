import app from './src/app.js';
import { checkDbConnection, isFallbackMode, seedMockLessons, findUserById, readJsonDb, writeJsonDb, findUserByEmail, createUser } from './src/services/db.service.js';
import { verifyEmailTransporter } from './src/services/email.service.js';
import { verifyAIConnectionOnStartup, translateChatMessage, transcribeAudioMessage, callAIService } from './src/controllers/ai.controller.new.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from './src/models/Message.js';
import Conversation from './src/models/Conversation.js';
import User from './src/models/User.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Self-executing diagnostic block
(async () => {
  const diagLogs = [];
  diagLogs.push(`=== STARTUP DIAGNOSTIC AT ${new Date().toISOString()} ===`);
  try {
    const dbPath = path.join(process.cwd(), './data/db.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      diagLogs.push(`Loaded db.json successfully. User count: ${db.users?.length || 0}`);
      
      let updatedCount = 0;
      for (const u of db.users || []) {
        if (u.email === 'admin@lingoleap.com') {
          diagLogs.push(`User: admin (${u.email}) - Skipped resetting admin`);
          continue;
        }
        
        let isPwd123 = false;
        try {
          isPwd123 = bcrypt.compareSync('password123', u.password);
        } catch (e) {
          isPwd123 = false;
        }
        
        diagLogs.push(`User: ${u.username} (${u.email})`);
        diagLogs.push(`  Existing Hash: ${u.password}`);
        diagLogs.push(`  Matches 'password123'? ${isPwd123}`);
        
        if (!isPwd123) {
          diagLogs.push(`  -> Resetting local db.json password hash to 'password123'`);
          const salt = bcrypt.genSaltSync(10);
          u.password = bcrypt.hashSync('password123', salt);
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
        diagLogs.push(`Saved updated db.json with ${updatedCount} corrected passwords.`);
      } else {
        diagLogs.push(`No password updates required in db.json.`);
      }
    } else {
      diagLogs.push(`db.json not found at ${dbPath}`);
    }
  } catch (err) {
    diagLogs.push(`Diagnostic error: ${err.message}`);
  }
  
  try {
    fs.writeFileSync(path.join(process.cwd(), './diagnostic.txt'), diagLogs.join('\n'), 'utf-8');
    console.log('📝 Startup diagnostic complete. Log saved to server/diagnostic.txt');
  } catch (logErr) {
    console.error('Failed to write diagnostic file:', logErr.message);
  }
})();

const PORT = process.env.PORT || 5000;

// Dynamic import will overwrite this lessonsData variable inside startServer
let lessonsData = [];
const dummyLessonsData = [];

const startServer = async () => {
  // Attempt MongoDB connection (falls back to JSON automatically)
  await checkDbConnection();

  if (!isFallbackMode()) {
    try {
      const Lesson = (await import('./src/models/Lesson.js')).default;
      const count = await Lesson.countDocuments({});
      const langs = await Lesson.distinct('language');
      const logs = [`Total lessons in MongoDB: ${count}`, `Languages present: ${langs.join(', ')}`];
      for (const l of langs) {
        const lCount = await Lesson.countDocuments({ language: l });
        const firstL = await Lesson.findOne({ language: l, order: 1 });
        const wordsLen = firstL?.words?.length ?? 'none';
        logs.push(` - ${l}: ${lCount} lessons (Lesson 1 words length: ${wordsLen})`);
      }
      fs.writeFileSync('./db_lessons_audit.txt', logs.join('\n'), 'utf-8');
      console.log('📝 Lesson audit written to server/db_lessons_audit.txt');
    } catch (err) {
      console.error('Lesson audit failed:', err);
    }
  } else {
    try {
      const db = readJsonDb();
      const logs = [`Total lessons in local JSON DB: ${db.lessons?.length || 0}`];
      fs.writeFileSync('./db_lessons_audit.txt', logs.join('\n'), 'utf-8');
      console.log('📝 Local JSON Lesson audit written to server/db_lessons_audit.txt');
    } catch (err) {
      console.error('Local JSON Lesson audit failed:', err);
    }
  }

  // Generate curriculum files on startup
  try {
    const { generateCurriculum } = await import('./src/services/curriculumGenerator.js');
    generateCurriculum();
  } catch (err) {
    console.error('❌ Failed to run curriculum generator:', err);
  }

  // Load generated lessonsData
  try {
    const lessonsModule = await import('./src/data/lessonsData.js');
    lessonsData = lessonsModule.lessonsData;
  } catch (err) {
    console.error('❌ Failed to load lessonsData:', err);
  }

  // Seed database
  if (isFallbackMode()) {
    seedMockLessons(lessonsData);
  } else {
    try {
      const crypto = await import('crypto');
      const Lesson = (await import('./src/models/Lesson.js')).default;
      const uniqueLanguages = [...new Set(lessonsData.map(l => l.language))];
      
      for (const lang of uniqueLanguages) {
        const langLessons = lessonsData.filter(l => l.language.toLowerCase() === lang.toLowerCase());
        const countForLang = await Lesson.countDocuments({ language: { $regex: new RegExp(`^${lang}$`, 'i') } });

        const hasOldPrompts = await Lesson.findOne({
          language: { $regex: new RegExp(`^${lang}$`, 'i') },
          'questions.prompt': { $regex: /English meaning/i }
        });
        
        const firstLessonDb = await Lesson.findOne({
          language: { $regex: new RegExp(`^${lang}$`, 'i') },
          order: 1
        });
        const isOldSchema = !firstLessonDb || !firstLessonDb.words || firstLessonDb.words.length === 0;
        
        if (countForLang !== langLessons.length || hasOldPrompts || isOldSchema || process.env.FORCE_SEED === 'true') {
          console.log(`🍃 Curriculum mismatch/update detected for ${lang} (DB count: ${countForLang}, expected: ${langLessons.length}). Re-seeding...`);
          
          // Clear old lessons for this language
          await Lesson.deleteMany({ language: { $regex: new RegExp(`^${lang}$`, 'i') } });
          
          // Seed new lessons with deterministic ObjectIds
          const lessonsToInsert = langLessons.map((l) => {
            const lessonKey = `lesson_${l.language.toLowerCase()}_${l.order}`;
            const hash = crypto.default.createHash('md5').update(lessonKey).digest('hex');
            const unlockedId = new mongoose.Types.ObjectId(hash.substring(0, 24));
            
            return {
              ...l,
              _id: unlockedId,
              questions: l.questions.map((q, qIndex) => {
                const questionKey = `q_${l.language.toLowerCase()}_${l.order}_${qIndex}`;
                const qHash = crypto.default.createHash('md5').update(questionKey).digest('hex');
                return {
                  ...q,
                  _id: new mongoose.Types.ObjectId(qHash.substring(0, 24))
                };
              })
            };
          });
          
          await Lesson.insertMany(lessonsToInsert);
          console.log(`✅ Deterministically seeded ${lessonsToInsert.length} lessons for ${lang} into MongoDB.`);
        }
      }
      console.log('🍃 MongoDB lessons check complete.');
    } catch (err) {
      console.error('❌ Failed to check or seed MongoDB lessons:', err);
    }
  }
  const server = app.listen(PORT, async () => {
    console.log(`\n🚀 LingoLeap server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    if (isFallbackMode()) {
      console.log('📦 Using local filesystem database (data/db.json)\n');
    } else {
      console.log('🍃 Using MongoDB Atlas/local database\n');
    }
    // Verify Brevo SMTP connection
    verifyEmailTransporter();

    // Verify AI connection
    await verifyAIConnectionOnStartup();
  });

  // Socket.io initialization
  const socketAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175'];
  if (process.env.CLIENT_URL) {
    const clientUrls = process.env.CLIENT_URL.split(',').map(url => url.trim());
    socketAllowedOrigins.push(...clientUrls);
  }

  const io = new Server(server, {
    cors: {
      origin: socketAllowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Expose io to routes/controllers
  app.set('io', io);

  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456789');
      const user = await findUserById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected to sockets: ${socket.user.username} (${userId})`);
    
    // Join personal room
    socket.join(userId);

    // Set online status in DB
    if (!isFallbackMode()) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      } catch (err) {
        console.error('Error updating online presence (Mongo):', err);
      }
    } else {
      const db = readJsonDb();
      const uIdx = db.users.findIndex(u => u._id === userId);
      if (uIdx !== -1) {
        db.users[uIdx].isOnline = true;
        db.users[uIdx].lastSeen = new Date().toISOString();
        writeJsonDb(db);
      }
    }

    // Broadcast status change
    io.emit('user_status', { userId, isOnline: true });

    // Handle typing events
    socket.on('typing', ({ conversationId, recipientId, isTyping }) => {
      socket.to(recipientId).emit('typing', { conversationId, senderId: userId, isTyping });
    });

    // Handle incoming messages
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
          (async () => {
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

              let aiReplyText = "¡Hola! Sigamos practicando.";
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
                aiReplyText += `\n\n💡 Correction tip: ${aiTip}`;
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
          })();
        }
      } catch (err) {
        console.error('Socket error sending message:', err);
        callback?.({ success: false, error: 'Server error sending message' });
      }
    });

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
          const CallHistory = (await import('./src/models/CallHistory.js')).default;
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
          const Conversation = (await import('./src/models/Conversation.js')).default;
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
          const Message = (await import('./src/models/Message.js')).default;
          const Conversation = (await import('./src/models/Conversation.js')).default;
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

          // Check if user already reacted
          const existingReactionIndex = (message.reactions || []).findIndex(
            r => r.userId.toString() === userId
          );

          if (existingReactionIndex !== -1) {
            // If same emoji, remove it (toggle)
            if (message.reactions[existingReactionIndex].emoji === emoji) {
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // Update emoji
              message.reactions[existingReactionIndex].emoji = emoji;
            }
          } else {
            // Add new reaction
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

        // Broadcast reaction to both users
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

          // Translate if text changed
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

    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      
      // Update offline status in DB
      const logoutTime = new Date();
      if (!isFallbackMode()) {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: logoutTime });
        } catch (err) {
          console.error('Error updating offline presence (Mongo):', err);
        }
      } else {
        const db = readJsonDb();
        const uIdx = db.users.findIndex(u => u._id === userId);
        if (uIdx !== -1) {
          db.users[uIdx].isOnline = false;
          db.users[uIdx].lastSeen = logoutTime.toISOString();
          writeJsonDb(db);
        }
      }

      // Broadcast presence updates
      io.emit('user_status', { userId, isOnline: false, lastSeen: logoutTime });
    });
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
