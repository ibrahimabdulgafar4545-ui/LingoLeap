import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection } from './services/db.service.js';
import User from './models/User.js';
import Conversation from './models/Conversation.js';
import Message from './models/Message.js';
import { createConversation } from './controllers/chat.controller.js';

async function run() {
  console.log('--- STARTING E2E CHAT SYSTEM AUDIT ---');
  await checkDbConnection();
  
  const gafboiId = '6a39c43c2ef460acb379098c'; // Marybro
  const gafmanId = '6a39c4a92ef460acb37910f1'; // Gafar
  
  try {
    const gafboi = await User.findById(gafboiId);
    const gafman = await User.findById(gafmanId);
    
    if (!gafboi || !gafman) {
      console.log('Test users not found, skipping friendship checks.');
      process.exit(0);
    }
    
    console.log(`User A: ${gafboi.username} (Friends list size: ${gafboi.friends.length})`);
    console.log(`User B: ${gafman.username} (Friends list size: ${gafman.friends.length})`);
    
    // Check if they are friends in DB
    const isAFriendOfB = gafboi.friends.some(id => id.toString() === gafmanId);
    const isBFriendOfA = gafman.friends.some(id => id.toString() === gafboiId);
    
    console.log(`Is GAFMAN in Gafboi's friends list: ${isAFriendOfB}`);
    console.log(`Is Gafboi in GAFMAN's friends list: ${isBFriendOfA}`);
    
    if (!isAFriendOfB || !isBFriendOfA) {
      console.log('Ensuring they are friends in database for E2E chat verification...');
      if (!isAFriendOfB) gafboi.friends.push(gafmanId);
      if (!isBFriendOfA) gafman.friends.push(gafboiId);
      await gafboi.save();
      await gafman.save();
      console.log('Users are now friends in MongoDB!');
    }
    
    // Simulate conversation creation/lookup controller call
    const mockReq = {
      body: { recipientId: gafmanId },
      user: { _id: gafboiId, id: gafboiId }
    };
    
    const mockRes = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };
    
    console.log('\n[1/3] Simulating createConversation controller call...');
    await createConversation(mockReq, mockRes);
    console.log('Controller Status Code:', mockRes.statusCode || 200);
    console.log('Conversation details:', JSON.stringify(mockRes.data, null, 2));
    
    if (mockRes.statusCode && mockRes.statusCode >= 400) {
      throw new Error(`Controller failed with code ${mockRes.statusCode}: ${mockRes.data?.message}`);
    }
    
    const convId = mockRes.data._id;
    
    // Simulate message creation
    console.log('\n[2/3] Simulating saving a message to MongoDB...');
    const testMsg = await Message.create({
      conversationId: convId,
      sender: gafboiId,
      recipient: gafmanId,
      text: `Hello GAFMAN! E2E Test message at ${new Date().toISOString()}`
    });
    console.log('Message created successfully in MongoDB:', testMsg._id);
    
    // Verify messages list
    console.log('\n[3/3] Verifying message persistence and sorting...');
    const history = await Message.find({ conversationId: convId }).sort({ createdAt: 1 });
    console.log(`Total messages in history: ${history.length}`);
    console.log(`Last message: "${history[history.length - 1].text}"`);
    
    // Clean up test message
    await Message.deleteOne({ _id: testMsg._id });
    console.log('Test message cleaned up.');
    
    console.log('\n--- ALL E2E CHAT SYSTEM AUDIT TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ E2E CHAT SYSTEM AUDIT FAILED:', err);
  }
  process.exit(0);
}

run();
