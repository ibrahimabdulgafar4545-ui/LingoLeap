import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { isFallbackMode, readJsonDb, writeJsonDb, findUserById } from '../services/db.service.js';

// Search for users by username or email
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!q || q.length < 3) {
      return res.status(400).json({ message: 'Search query must be at least 3 characters' });
    }

    if (!isFallbackMode()) {
      const currentUser = await User.findById(currentUserId);
      const blockedList = currentUser.blockedUsers || [];

      // Exclude current user, users who blocked us, and users we blocked
      const users = await User.find({
        _id: { $ne: currentUserId, $nin: blockedList },
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ],
        blockedUsers: { $ne: currentUserId }
      }).select('username email avatarUrl level xp targetLanguage friendRequests friends');

      const results = users.map(user => {
        let relationship = 'none';
        
        if ((currentUser.friends || []).some(id => id.toString() === user._id.toString())) {
          relationship = 'friends';
        } else if ((user.friendRequests || []).some(r => r.from.toString() === currentUserId && r.status === 'pending')) {
          relationship = 'sent_pending';
        } else if ((currentUser.friendRequests || []).some(r => r.from.toString() === user._id.toString() && r.status === 'pending')) {
          relationship = 'received_pending';
        }

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          level: user.level,
          xp: user.xp,
          targetLanguage: user.targetLanguage,
          relationship
        };
      });

      return res.json(results);
    }

    // Fallback logic
    const db = readJsonDb();
    const currentUser = db.users.find(u => u._id === currentUserId);
    if (!currentUser) return res.status(404).json({ message: 'Current user not found' });
    
    const blockedList = currentUser.blockedUsers || [];

    const matchedUsers = db.users.filter(u => {
      if (u._id === currentUserId) return false;
      if (blockedList.includes(u._id)) return false;
      if (u.blockedUsers && u.blockedUsers.includes(currentUserId)) return false;
      
      const qLower = q.toLowerCase();
      return (u.username && u.username.toLowerCase().includes(qLower)) || 
             (u.email && u.email.toLowerCase().includes(qLower));
    });

    const results = matchedUsers.map(user => {
      let relationship = 'none';
      
      const userFriends = user.friends || [];
      const userRequests = user.friendRequests || [];
      const myFriends = currentUser.friends || [];
      const myRequests = currentUser.friendRequests || [];

      if (myFriends.some(id => id.toString() === user._id.toString())) {
        relationship = 'friends';
      } else if (userRequests.some(r => r.from.toString() === currentUserId.toString() && r.status === 'pending')) {
        relationship = 'sent_pending';
      } else if (myRequests.some(r => r.from.toString() === user._id.toString() && r.status === 'pending')) {
        relationship = 'received_pending';
      }

      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        level: user.level,
        xp: user.xp,
        targetLanguage: user.targetLanguage,
        relationship
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Search Users Error:', error);
    res.status(500).json({ message: 'Server error while searching users' });
  }
};

// Get current user's friends
export const getFriends = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId).populate(
        'friends',
        'username email avatarUrl level xp streakCount targetLanguage recentActivity'
      );
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user.friends || []);
    }

    // Fallback logic
    const db = readJsonDb();
    const user = db.users.find(u => u._id === currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const friends = (user.friends || []).map(friendId => {
      const friend = db.users.find(u => u._id === friendId);
      if (!friend) return null;
      return {
        _id: friend._id,
        username: friend.username,
        email: friend.email,
        avatarUrl: friend.avatarUrl,
        level: friend.level,
        xp: friend.xp,
        streakCount: friend.streakCount,
        targetLanguage: friend.targetLanguage,
        recentActivity: friend.recentActivity || []
      };
    }).filter(Boolean);

    res.json(friends);
  } catch (error) {
    console.error('Get Friends Error:', error);
    res.status(500).json({ message: 'Server error while fetching friends' });
  }
};

// Send a friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (currentUserId === recipientId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    if (!isFallbackMode()) {
      const recipient = await User.findById(recipientId);
      const sender = await User.findById(currentUserId);

      if (!recipient || !sender) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if blocked
      if ((recipient.blockedUsers || []).some(id => id.toString() === currentUserId.toString()) || 
          (sender.blockedUsers || []).some(id => id.toString() === recipientId.toString())) {
        return res.status(400).json({ message: 'Blocked interaction' });
      }

      // Check if already friends
      if ((sender.friends || []).some(id => id.toString() === recipientId.toString())) {
        return res.status(400).json({ message: 'You are already friends' });
      }

      // Check if request already pending
      const alreadySent = recipient.friendRequests.some(
        r => r.from.toString() === currentUserId && r.status === 'pending'
      );
      if (alreadySent) {
        return res.status(400).json({ message: 'Friend request already sent' });
      }

      // Check if there is an incoming request from them already (then they should accept it instead)
      const incoming = sender.friendRequests.some(
        r => r.from.toString() === recipientId && r.status === 'pending'
      );
      if (incoming) {
        return res.status(400).json({ message: 'They have already sent you a friend request' });
      }

      // Add request to recipient
      recipient.friendRequests.push({ from: currentUserId, status: 'pending' });

      // Add notification to recipient
      recipient.notifications.push({
        type: 'friend_request',
        sender: currentUserId,
        message: `${sender.username} sent you a friend request.`
      });

      await recipient.save();
      return res.json({ message: 'Friend request sent successfully' });
    }

    // Fallback logic
    const db = readJsonDb();
    const senderIndex = db.users.findIndex(u => u._id === currentUserId);
    const recipientIndex = db.users.findIndex(u => u._id === recipientId);

    if (senderIndex === -1 || recipientIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sender = db.users[senderIndex];
    const recipient = db.users[recipientIndex];

    sender.blockedUsers = sender.blockedUsers || [];
    recipient.blockedUsers = recipient.blockedUsers || [];
    sender.friends = sender.friends || [];
    recipient.friendRequests = recipient.friendRequests || [];
    sender.friendRequests = sender.friendRequests || [];
    recipient.notifications = recipient.notifications || [];

    if (recipient.blockedUsers.includes(currentUserId) || sender.blockedUsers.includes(recipientId)) {
      return res.status(400).json({ message: 'Blocked interaction' });
    }

    if (sender.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'You are already friends' });
    }

    const alreadySent = recipient.friendRequests.some(
      r => r.from === currentUserId && r.status === 'pending'
    );
    if (alreadySent) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    const incoming = sender.friendRequests.some(
      r => r.from === recipientId && r.status === 'pending'
    );
    if (incoming) {
      return res.status(400).json({ message: 'They have already sent you a friend request' });
    }

    recipient.friendRequests.push({
      from: currentUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    recipient.notifications.push({
      type: 'friend_request',
      sender: currentUserId,
      message: `${sender.username} sent you a friend request.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    writeJsonDb(db);
    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send Friend Request Error:', error);
    res.status(500).json({ message: 'Server error while sending friend request' });
  }
};

// Accept a friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      const requester = await User.findById(requesterId);

      if (!user || !requester) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if request exists in user's friendRequests
      const reqIndex = user.friendRequests.findIndex(
        r => r.from.toString() === requesterId && r.status === 'pending'
      );

      if (reqIndex === -1) {
        return res.status(400).json({ message: 'No pending friend request found from this user' });
      }

      // Remove request
      user.friendRequests.splice(reqIndex, 1);

      // Add to friends
      if (!(user.friends || []).some(id => id.toString() === requesterId.toString())) {
        user.friends.push(requesterId);
      }
      if (!(requester.friends || []).some(id => id.toString() === currentUserId.toString())) {
        requester.friends.push(currentUserId);
      }

      // Add notification to both users
      requester.notifications.push({
        type: 'friend_accepted',
        sender: currentUserId,
        message: `You and ${user.username} are now friends.`
      });

      user.notifications.push({
        type: 'friend_accepted',
        sender: requesterId,
        message: `You and ${requester.username} are now friends.`
      });

      // Add activity
      const activityMsg = `${user.username} and ${requester.username} became friends.`;
      user.recentActivity = user.recentActivity || [];
      requester.recentActivity = requester.recentActivity || [];
      
      user.recentActivity.push({
        type: 'friend_added',
        message: activityMsg,
        xp: 0
      });
      requester.recentActivity.push({
        type: 'friend_added',
        message: activityMsg,
        xp: 0
      });

      await user.save();
      await requester.save();

      // Emit real-time notification
      const io = req.app.get('io');
      if (io) {
        const notifForRequester = requester.notifications[requester.notifications.length - 1];
        const notifForUser = user.notifications[user.notifications.length - 1];
        io.to(requesterId).emit('new_notification', notifForRequester);
        io.to(currentUserId).emit('new_notification', notifForUser);
      }

      return res.json({ message: 'Friend request accepted successfully' });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    const requesterIndex = db.users.findIndex(u => u._id === requesterId);

    if (userIndex === -1 || requesterIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = db.users[userIndex];
    const requester = db.users[requesterIndex];

    user.friendRequests = user.friendRequests || [];
    user.friends = user.friends || [];
    requester.friends = requester.friends || [];
    requester.notifications = requester.notifications || [];
    user.notifications = user.notifications || [];

    const reqIndex = user.friendRequests.findIndex(
      r => r.from === requesterId && r.status === 'pending'
    );

    if (reqIndex === -1) {
      return res.status(400).json({ message: 'No pending friend request found from this user' });
    }

    user.friendRequests.splice(reqIndex, 1);

    if (!user.friends.includes(requesterId)) {
      user.friends.push(requesterId);
    }
    if (!requester.friends.includes(currentUserId)) {
      requester.friends.push(currentUserId);
    }

    // Add activity
    user.recentActivity = user.recentActivity || [];
    requester.recentActivity = requester.recentActivity || [];
    const activityMsg = `${user.username} and ${requester.username} became friends.`;
    const activityObj = {
      _id: Math.random().toString(),
      type: 'friend_added',
      message: activityMsg,
      xp: 0,
      timestamp: new Date().toISOString()
    };
    user.recentActivity.push(activityObj);
    requester.recentActivity.push(activityObj);

    requester.notifications.push({
      _id: Math.random().toString(),
      type: 'friend_accepted',
      sender: currentUserId,
      message: `You and ${user.username} are now friends.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    user.notifications.push({
      _id: Math.random().toString(),
      type: 'friend_accepted',
      sender: requesterId,
      message: `You and ${requester.username} are now friends.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    writeJsonDb(db);

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      const notifForRequester = requester.notifications[requester.notifications.length - 1];
      const notifForUser = user.notifications[user.notifications.length - 1];
      io.to(requesterId).emit('new_notification', notifForRequester);
      io.to(currentUserId).emit('new_notification', notifForUser);
    }

    res.json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    console.error('Accept Friend Request Error:', error);
    res.status(500).json({ message: 'Server error while accepting friend request' });
  }
};

// Reject a friend request
export const rejectFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const reqIndex = user.friendRequests.findIndex(
        r => r.from.toString() === requesterId && r.status === 'pending'
      );

      if (reqIndex === -1) {
        return res.status(400).json({ message: 'No pending request found' });
      }

      user.friendRequests.splice(reqIndex, 1);
      await user.save();

      return res.json({ message: 'Friend request rejected successfully' });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const user = db.users[userIndex];
    user.friendRequests = user.friendRequests || [];

    const reqIndex = user.friendRequests.findIndex(
      r => r.from === requesterId && r.status === 'pending'
    );

    if (reqIndex === -1) {
      return res.status(400).json({ message: 'No pending request found' });
    }

    user.friendRequests.splice(reqIndex, 1);
    writeJsonDb(db);

    res.json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    console.error('Reject Friend Request Error:', error);
    res.status(500).json({ message: 'Server error while rejecting friend request' });
  }
};

// Cancel a pending friend request
export const cancelFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const recipient = await User.findById(recipientId);
      if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

      const reqIndex = recipient.friendRequests.findIndex(
        r => r.from.toString() === currentUserId && r.status === 'pending'
      );

      if (reqIndex === -1) {
        return res.status(400).json({ message: 'No pending request found' });
      }

      recipient.friendRequests.splice(reqIndex, 1);
      
      // Clean up request notification
      recipient.notifications = recipient.notifications.filter(
        n => !(n.type === 'friend_request' && n.sender.toString() === currentUserId)
      );

      await recipient.save();
      return res.json({ message: 'Friend request cancelled successfully' });
    }

    // Fallback logic
    const db = readJsonDb();
    const recipientIndex = db.users.findIndex(u => u._id === recipientId);
    if (recipientIndex === -1) return res.status(404).json({ message: 'Recipient not found' });

    const recipient = db.users[recipientIndex];
    recipient.friendRequests = recipient.friendRequests || [];
    recipient.notifications = recipient.notifications || [];

    const reqIndex = recipient.friendRequests.findIndex(
      r => r.from === currentUserId && r.status === 'pending'
    );

    if (reqIndex === -1) {
      return res.status(400).json({ message: 'No pending request found' });
    }

    recipient.friendRequests.splice(reqIndex, 1);
    recipient.notifications = recipient.notifications.filter(
      n => !(n.type === 'friend_request' && n.sender === currentUserId)
    );

    writeJsonDb(db);
    res.json({ message: 'Friend request cancelled successfully' });
  } catch (error) {
    console.error('Cancel Friend Request Error:', error);
    res.status(500).json({ message: 'Server error while cancelling friend request' });
  }
};

// Remove a friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      const friend = await User.findById(friendId);

      if (!user || !friend) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.friends = user.friends.filter(id => id.toString() !== friendId);
      friend.friends = friend.friends.filter(id => id.toString() !== currentUserId);

      await user.save();
      await friend.save();

      return res.json({ message: 'Friend removed successfully', friends: user.friends });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    const friendIndex = db.users.findIndex(u => u._id === friendId);

    if (userIndex === -1 || friendIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = db.users[userIndex];
    const friend = db.users[friendIndex];

    user.friends = (user.friends || []).filter(id => id !== friendId);
    friend.friends = (friend.friends || []).filter(id => id !== currentUserId);

    writeJsonDb(db);
    res.json({ message: 'Friend removed successfully', friends: user.friends });
  } catch (error) {
    console.error('Remove Friend Error:', error);
    res.status(500).json({ message: 'Server error while removing friend' });
  }
};

// Block a user
export const blockUser = async (req, res) => {
  try {
    const { userIdToBlock } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (currentUserId === userIdToBlock) {
      return res.status(400).json({ message: 'You cannot block yourself' });
    }

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      const targetUser = await User.findById(userIdToBlock);

      if (!user || !targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Add to blockedUsers
      if (!(user.blockedUsers || []).some(id => id.toString() === userIdToBlock.toString())) {
        user.blockedUsers.push(userIdToBlock);
      }

      // Remove from friends on both sides
      user.friends = user.friends.filter(id => id.toString() !== userIdToBlock);
      targetUser.friends = targetUser.friends.filter(id => id.toString() !== currentUserId);

      // Remove pending requests on both sides
      user.friendRequests = user.friendRequests.filter(r => r.from.toString() !== userIdToBlock);
      targetUser.friendRequests = targetUser.friendRequests.filter(r => r.from.toString() !== currentUserId);

      await user.save();
      await targetUser.save();

      return res.json({ message: 'User blocked successfully', blockedUsers: user.blockedUsers });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    const targetIndex = db.users.findIndex(u => u._id === userIdToBlock);

    if (userIndex === -1 || targetIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = db.users[userIndex];
    const targetUser = db.users[targetIndex];

    user.blockedUsers = user.blockedUsers || [];
    targetUser.blockedUsers = targetUser.blockedUsers || [];
    user.friends = user.friends || [];
    targetUser.friends = targetUser.friends || [];
    user.friendRequests = user.friendRequests || [];
    targetUser.friendRequests = targetUser.friendRequests || [];

    if (!user.blockedUsers.includes(userIdToBlock)) {
      user.blockedUsers.push(userIdToBlock);
    }

    user.friends = user.friends.filter(id => id !== userIdToBlock);
    targetUser.friends = targetUser.friends.filter(id => id !== currentUserId);

    user.friendRequests = user.friendRequests.filter(r => r.from !== userIdToBlock);
    targetUser.friendRequests = targetUser.friendRequests.filter(r => r.from !== currentUserId);

    writeJsonDb(db);
    res.json({ message: 'User blocked successfully', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({ message: 'Server error while blocking user' });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userIdToUnblock } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.blockedUsers = (user.blockedUsers || []).filter(id => id && id.toString() !== userIdToUnblock);
      await user.save();

      return res.json({ message: 'User unblocked successfully', blockedUsers: user.blockedUsers });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const user = db.users[userIndex];
    user.blockedUsers = user.blockedUsers || [];

    user.blockedUsers = user.blockedUsers.filter(id => id !== userIdToUnblock);
    writeJsonDb(db);

    res.json({ message: 'User unblocked successfully', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Unblock User Error:', error);
    res.status(500).json({ message: 'Server error while unblocking user' });
  }
};

// Get list of blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId).populate(
        'blockedUsers',
        'username email avatarUrl level xp targetLanguage'
      );
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user.blockedUsers || []);
    }

    // Fallback logic
    const db = readJsonDb();
    const user = db.users.find(u => u._id === currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const blockedList = (user.blockedUsers || []).map(blockedId => {
      const blocked = db.users.find(u => u._id === blockedId);
      if (!blocked) return null;
      return {
        _id: blocked._id,
        username: blocked.username,
        email: blocked.email,
        avatarUrl: blocked.avatarUrl,
        level: blocked.level,
        xp: blocked.xp,
        targetLanguage: blocked.targetLanguage
      };
    }).filter(Boolean);

    res.json(blockedList);
  } catch (error) {
    console.error('Get Blocked Users Error:', error);
    res.status(500).json({ message: 'Server error while fetching blocked users' });
  }
};

// Permanently remove a blocked user (unblocks them AND deletes all conversational history/chat logs)
export const permanentlyRemoveBlockedUser = async (req, res) => {
  try {
    const { userIdToRemove } = req.body;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Unblock first
      user.blockedUsers = (user.blockedUsers || []).filter(id => id.toString() !== userIdToRemove.toString());
      await user.save();

      // Find any conversation between them
      const conversations = await Conversation.find({
        participants: { $all: [currentUserId, userIdToRemove] }
      });

      for (const conv of conversations) {
        // Delete all messages in the conversation
        await Message.deleteMany({ conversationId: conv._id });
        // Delete conversation itself
        await Conversation.findByIdAndDelete(conv._id);
      }

      return res.json({ message: 'User permanently removed from block list and chat history deleted successfully', blockedUsers: user.blockedUsers });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const user = db.users[userIndex];
    user.blockedUsers = (user.blockedUsers || []).filter(id => id !== userIdToRemove);

    // Filter conversations
    db.conversations = db.conversations || [];
    db.messages = db.messages || [];

    const conversationsToRemove = db.conversations.filter(c =>
      c.participants.includes(currentUserId) && c.participants.includes(userIdToRemove)
    );

    for (const conv of conversationsToRemove) {
      db.messages = db.messages.filter(m => m.conversationId !== conv._id);
    }
    db.conversations = db.conversations.filter(c =>
      !(c.participants.includes(currentUserId) && c.participants.includes(userIdToRemove))
    );

    writeJsonDb(db);
    res.json({ message: 'User permanently removed from block list and chat history deleted successfully', blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error('Permanently Remove Blocked User Error:', error);
    res.status(500).json({ message: 'Server error while permanently removing blocked user' });
  }
};

// Get a user's profile details
export const getFriendProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const targetUser = await User.findById(userId).select('username email avatarUrl level xp streakCount targetLanguage recentActivity studyCalendar blockedUsers friendRequests friends');
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const currentUser = await User.findById(currentUserId);

      // Check if blocked either way
      if (targetUser.blockedUsers && targetUser.blockedUsers.includes(currentUserId)) {
        return res.status(403).json({ message: 'Access denied: User blocked you' });
      }
      if (currentUser.blockedUsers && currentUser.blockedUsers.includes(userId)) {
        return res.status(403).json({ message: 'Access denied: You blocked this user' });
      }

      let relationship = 'none';
      if ((currentUser.friends || []).includes(userId)) {
        relationship = 'friends';
      } else if ((targetUser.friendRequests || []).some(r => r.from.toString() === currentUserId && r.status === 'pending')) {
        relationship = 'sent_pending';
      } else if ((currentUser.friendRequests || []).some(r => r.from.toString() === userId && r.status === 'pending')) {
        relationship = 'received_pending';
      }

      return res.json({
        _id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        avatarUrl: targetUser.avatarUrl,
        level: targetUser.level,
        xp: targetUser.xp,
        streakCount: targetUser.streakCount,
        targetLanguage: targetUser.targetLanguage,
        recentActivity: targetUser.recentActivity || [],
        studyCalendar: targetUser.studyCalendar || [],
        relationship,
        friendsCount: (targetUser.friends || []).length
      });
    }

    // Fallback logic
    const db = readJsonDb();
    const targetUser = db.users.find(u => u._id === userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = db.users.find(u => u._id === currentUserId);
    if (!currentUser) return res.status(404).json({ message: 'Current user not found' });

    if (targetUser.blockedUsers && targetUser.blockedUsers.includes(currentUserId)) {
      return res.status(403).json({ message: 'Access denied: User blocked you' });
    }
    if (currentUser.blockedUsers && currentUser.blockedUsers.includes(userId)) {
      return res.status(403).json({ message: 'Access denied: You blocked this user' });
    }

    let relationship = 'none';
    const targetRequests = targetUser.friendRequests || [];
    const myRequests = currentUser.friendRequests || [];

    if ((currentUser.friends || []).includes(userId)) {
      relationship = 'friends';
    } else if (targetRequests.some(r => r.from === currentUserId && r.status === 'pending')) {
      relationship = 'sent_pending';
    } else if (myRequests.some(r => r.from === userId && r.status === 'pending')) {
      relationship = 'received_pending';
    }

    res.json({
      _id: targetUser._id,
      username: targetUser.username,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
      level: targetUser.level,
      xp: targetUser.xp,
      streakCount: targetUser.streakCount,
      targetLanguage: targetUser.targetLanguage,
      recentActivity: targetUser.recentActivity || [],
      studyCalendar: targetUser.studyCalendar || [],
      relationship,
      friendsCount: (targetUser.friends || []).length
    });
  } catch (error) {
    console.error('Get Friend Profile Error:', error);
    res.status(500).json({ message: 'Server error while fetching friend profile' });
  }
};

// Get current user's notifications
export const getNotifications = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId)
        .populate({
          path: 'notifications.sender',
          select: 'username avatarUrl level xp'
        });
      
      if (!user) return res.status(404).json({ message: 'User not found' });

      // Sort notifications by newest first
      const sorted = (user.notifications || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return res.json(sorted);
    }

    // Fallback logic
    const db = readJsonDb();
    const user = db.users.find(u => u._id === currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.notifications = user.notifications || [];

    const populatedNotifications = user.notifications.map(noti => {
      const sender = db.users.find(u => u._id === noti.sender) || {
        username: 'Unknown User',
        avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Unknown'
      };

      return {
        _id: noti._id || Math.random().toString(),
        type: noti.type,
        message: noti.message,
        read: noti.read,
        createdAt: noti.createdAt,
        sender: {
          _id: sender._id,
          username: sender.username,
          avatarUrl: sender.avatarUrl,
          level: sender.level,
          xp: sender.xp
        }
      };
    });

    populatedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(populatedNotifications);
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Mark notifications as read
export const markNotificationsRead = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.notifications.forEach(n => {
        n.read = true;
      });

      await user.save();
      return res.json({ message: 'Notifications marked as read' });
    }

    // Fallback logic
    const db = readJsonDb();
    const userIndex = db.users.findIndex(u => u._id === currentUserId);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

    const user = db.users[userIndex];
    user.notifications = user.notifications || [];
    user.notifications.forEach(n => {
      n.read = true;
    });

    writeJsonDb(db);
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark Notifications Read Error:', error);
    res.status(500).json({ message: 'Server error while marking notifications as read' });
  }
};

// Get friend feed
export const getFriendFeed = async (req, res) => {
  try {
    const currentUserId = (req.user._id || req.user.id).toString();

    if (!isFallbackMode()) {
      const user = await User.findById(currentUserId).populate('friends', 'username avatarUrl recentActivity');
      if (!user) return res.status(404).json({ message: 'User not found' });

      let feed = [];
      user.friends.forEach(friend => {
        if (friend.recentActivity && friend.recentActivity.length > 0) {
          friend.recentActivity.forEach(activity => {
            feed.push({
              _id: activity._id || Math.random().toString(),
              user: {
                _id: friend._id,
                username: friend.username,
                avatarUrl: friend.avatarUrl
              },
              type: activity.type,
              message: activity.message,
              xp: activity.xp,
              timestamp: activity.timestamp
            });
          });
        }
      });

      feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return res.json(feed.slice(0, 20));
    }

    // Fallback logic
    const db = readJsonDb();
    const user = db.users.find(u => u._id === currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    let feed = [];
    const friends = user.friends || [];
    
    friends.forEach(friendId => {
      const friend = db.users.find(u => u._id === friendId);
      if (friend && friend.recentActivity && friend.recentActivity.length > 0) {
        friend.recentActivity.forEach(activity => {
          feed.push({
            _id: activity._id || Math.random().toString(),
            user: {
              _id: friend._id,
              username: friend.username,
              avatarUrl: friend.avatarUrl
            },
            type: activity.type,
            message: activity.message,
            xp: activity.xp,
            timestamp: activity.timestamp
          });
        });
      }
    });

    feed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(feed.slice(0, 20));
  } catch (error) {
    console.error('Get Friend Feed Error:', error);
    res.status(500).json({ message: 'Server error while fetching friend feed' });
  }
};

// For backward compatibility (map follow/unfollow to friends directly)
export const followUser = async (req, res) => {
  return sendFriendRequest(req, res);
};

export const unfollowUser = async (req, res) => {
  const { userIdToUnfollow } = req.params;
  req.params.friendId = userIdToUnfollow;
  return removeFriend(req, res);
};
