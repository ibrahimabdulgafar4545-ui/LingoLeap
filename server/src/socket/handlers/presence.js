import User from '../../models/User.js';
import { isFallbackMode, readJsonDb, writeJsonDb } from '../../services/db.service.js';

/**
 * Handles user coming online: updates DB and broadcasts status.
 */
export const handleUserConnect = async (io, socket, userId) => {
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
};

/**
 * Handles user going offline: updates DB and broadcasts status.
 */
export const handleUserDisconnect = async (io, socket, userId) => {
  console.log(`🔌 User disconnected: ${socket.user.username}`);
  
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
};
