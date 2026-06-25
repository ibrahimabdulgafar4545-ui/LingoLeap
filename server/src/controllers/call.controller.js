import CallHistory from '../models/CallHistory.js';
import User from '../models/User.js';
import { isFallbackMode, readJsonDb, writeJsonDb } from '../services/db.service.js';
import mongoose from 'mongoose';

// Log a call history entry
export const logCall = async (req, res) => {
  try {
    const { receiverId, type, status, duration } = req.body;
    const callerId = (req.user._id || req.user.id).toString();

    if (!receiverId || !type) {
      return res.status(400).json({ success: false, message: 'ReceiverId and type are required' });
    }

    let callRecord;
    if (!isFallbackMode()) {
      callRecord = await CallHistory.create({
        caller: callerId,
        receiver: receiverId,
        type,
        status: status || 'missed',
        duration: duration || 0
      });
      // Populate fields
      callRecord = await CallHistory.findById(callRecord._id)
        .populate('caller', 'username avatarUrl')
        .populate('receiver', 'username avatarUrl');
    } else {
      const db = readJsonDb();
      db.callHistory = db.callHistory || [];
      
      const callerUser = db.users.find(u => u._id === callerId);
      const receiverUser = db.users.find(u => u._id === receiverId);

      callRecord = {
        _id: new mongoose.Types.ObjectId().toString(),
        caller: callerId,
        receiver: receiverId,
        type,
        status: status || 'missed',
        duration: duration || 0,
        createdAt: new Date().toISOString()
      };

      db.callHistory.push(callRecord);
      writeJsonDb(db);

      // Simulated population
      callRecord.caller = { _id: callerId, username: callerUser?.username || 'User', avatarUrl: callerUser?.avatarUrl };
      callRecord.receiver = { _id: receiverId, username: receiverUser?.username || 'User', avatarUrl: receiverUser?.avatarUrl };
    }

    res.status(200).json({ success: true, call: callRecord });
  } catch (error) {
    console.error('Log Call Error:', error);
    res.status(500).json({ success: false, message: 'Server error logging call history' });
  }
};

// Retrieve call history for current user
export const getCallHistory = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const calls = await CallHistory.find({
        $or: [{ caller: userId }, { receiver: userId }]
      })
        .populate('caller', 'username avatarUrl')
        .populate('receiver', 'username avatarUrl')
        .sort({ createdAt: -1 })
        .limit(50);
      return res.status(200).json({ success: true, history: calls });
    }

    // Fallback mode
    const db = readJsonDb();
    const history = (db.callHistory || [])
      .filter(c => c.caller === userId || c.receiver === userId)
      .map(c => {
        const callerUser = db.users.find(u => u._id === c.caller);
        const receiverUser = db.users.find(u => u._id === c.receiver);
        return {
          ...c,
          caller: { _id: c.caller, username: callerUser?.username || 'User', avatarUrl: callerUser?.avatarUrl },
          receiver: { _id: c.receiver, username: receiverUser?.username || 'User', avatarUrl: receiverUser?.avatarUrl }
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);

    res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Get Call History Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving call history' });
  }
};

// Retrieve missed calls for current user
export const getMissedCalls = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const missed = await CallHistory.find({
        receiver: userId,
        status: 'missed'
      })
        .populate('caller', 'username avatarUrl')
        .sort({ createdAt: -1 });
      return res.status(200).json({ success: true, missed });
    }

    // Fallback mode
    const db = readJsonDb();
    const missed = (db.callHistory || [])
      .filter(c => c.receiver === userId && c.status === 'missed')
      .map(c => {
        const callerUser = db.users.find(u => u._id === c.caller);
        return {
          ...c,
          caller: { _id: c.caller, username: callerUser?.username || 'User', avatarUrl: callerUser?.avatarUrl }
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, missed });
  } catch (error) {
    console.error('Get Missed Calls Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving missed calls' });
  }
};
