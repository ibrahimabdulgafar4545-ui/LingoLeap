import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection } from './services/db.service.js';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js'; // Registers Message schema

async function run() {
  await checkDbConnection();
  
  const currentUserId = '6a39c43c2ef460acb379098c'; // Marybro
  const recipientId = '6a39c4a92ef460acb37910f1'; // Gafar
  
  console.log('--- DIAGNOSTIC: GET CONVERSATIONS FOR MARYBRO ---');
  let conversations = await Conversation.find({
    participants: currentUserId
  })
    .populate('participants', 'username email avatarUrl level xp isOnline lastSeen friends')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  for (let conv of conversations) {
    const otherParticipant = conv.participants.find(p => p._id.toString() !== currentUserId);
    if (!otherParticipant) {
      console.log(`Conv ${conv._id}: Other participant not found!`);
      continue;
    }

    const isFriend = (otherParticipant.friends || []).some(id => id.toString() === currentUserId.toString());
    console.log(`Conv: ${conv._id}`);
    console.log(`  Other User: ${otherParticipant.username} (${otherParticipant._id})`);
    console.log(`  Other User's Friends List:`, otherParticipant.friends.map(f => f.toString()));
    console.log(`  Is Friend: ${isFriend}`);
    console.log(`  isLocked status: ${!isFriend}`);
  }

  console.log('\n--- DIAGNOSTIC: GET CONVERSATIONS FOR GAFAR ---');
  let conversations2 = await Conversation.find({
    participants: recipientId
  })
    .populate('participants', 'username email avatarUrl level xp isOnline lastSeen friends')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

  for (let conv of conversations2) {
    const otherParticipant = conv.participants.find(p => p._id.toString() !== recipientId);
    if (!otherParticipant) {
      console.log(`Conv ${conv._id}: Other participant not found!`);
      continue;
    }

    const isFriend = (otherParticipant.friends || []).some(id => id.toString() === recipientId.toString());
    console.log(`Conv: ${conv._id}`);
    console.log(`  Other User: ${otherParticipant.username} (${otherParticipant._id})`);
    console.log(`  Other User's Friends List:`, otherParticipant.friends.map(f => f.toString()));
    console.log(`  Is Friend: ${isFriend}`);
    console.log(`  isLocked status: ${!isFriend}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
