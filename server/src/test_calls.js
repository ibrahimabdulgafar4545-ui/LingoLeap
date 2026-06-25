import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { 
  checkDbConnection, 
  isFallbackMode, 
  readJsonDb 
} from './services/db.service.js';
import User from './models/User.js';
import { 
  logCall,
  getCallHistory,
  getMissedCalls
} from './controllers/call.controller.js';

dotenv.config();

// Helper to create mock Express response object
const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

async function run() {
  console.log('\n=========================================');
  console.log('📞 STARTING CALL SYSTEM INTEGRATION TESTS 📞');
  console.log('=========================================\n');

  try {
    await checkDbConnection();
    const fallbackMode = isFallbackMode();
    console.log(`Database Mode: ${fallbackMode ? '⚠️ Fallback Local JSON DB' : '✅ MongoDB Active'}`);

    // Grab or mock user
    let testUser = null;
    let peerUser = null;
    if (!fallbackMode) {
      testUser = await User.findOne({});
      peerUser = await User.findOne({ _id: { $ne: testUser?._id } });
    } else {
      const db = readJsonDb();
      testUser = db.users[0];
      peerUser = db.users[1];
    }
    
    if (!testUser || !peerUser) {
      console.warn("⚠️ Two users are required to run call history tests. Please register users or seed the database.");
      process.exit(1);
    }
    
    const testUserId = testUser._id || testUser.id;
    const peerUserId = peerUser._id || peerUser.id;
    console.log(`Test Caller User: ${testUser.username} (ID: ${testUserId})`);
    console.log(`Test Receiver User: ${peerUser.username} (ID: ${peerUserId})`);

    // 1. Test validation on logCall (missing receiverId / type)
    console.log('\n-----------------------------------------');
    console.log('🔒 Test 1: Validation - Missing Inputs');
    console.log('-----------------------------------------');
    const missingReq = {
      body: {}, // empty
      user: { _id: testUserId, id: testUserId }
    };
    const missingRes = createMockRes();
    await logCall(missingReq, missingRes);
    console.log('Response Status:', missingRes.statusCode);
    if (missingRes.statusCode !== 400) {
      throw new Error('Validation failed: accepted call log without receiverId / type');
    }
    console.log('✅ Correctly caught missing inputs.');

    // 2. Test successful Audio Call Logging
    console.log('\n-----------------------------------------');
    console.log('📞 Test 2: Log Connected Audio Call');
    console.log('-----------------------------------------');
    const audioLogReq = {
      body: {
        receiverId: peerUserId,
        type: 'audio',
        status: 'connected',
        duration: 45 // 45 seconds duration
      },
      user: { _id: testUserId, id: testUserId }
    };
    const audioLogRes = createMockRes();
    await logCall(audioLogReq, audioLogRes);
    console.log('Response Status:', audioLogRes.statusCode);
    if (audioLogRes.statusCode !== 200) {
      throw new Error(`Log audio call failed: ${audioLogRes.data?.message}`);
    }
    
    const callLog = audioLogRes.data.call;
    console.log('Logged Call details:');
    console.log(`- Caller ID: ${callLog.caller._id || callLog.caller}`);
    console.log(`- Receiver ID: ${callLog.receiver._id || callLog.receiver}`);
    console.log(`- Type: ${callLog.type}`);
    console.log(`- Status: ${callLog.status}`);
    console.log(`- Duration: ${callLog.duration} seconds`);
    
    if (callLog.type !== 'audio' || callLog.status !== 'connected' || callLog.duration !== 45) {
      throw new Error('Call log fields did not save correctly.');
    }
    console.log('✅ Connected audio call logged successfully.');

    // 3. Test successful Missed Video Call Logging
    console.log('\n-----------------------------------------');
    console.log('🎥 Test 3: Log Missed Video Call');
    console.log('-----------------------------------------');
    const videoLogReq = {
      body: {
        receiverId: peerUserId,
        type: 'video',
        status: 'missed',
        duration: 0
      },
      user: { _id: testUserId, id: testUserId }
    };
    const videoLogRes = createMockRes();
    await logCall(videoLogReq, videoLogRes);
    console.log('Response Status:', videoLogRes.statusCode);
    if (videoLogRes.statusCode !== 200) {
      throw new Error(`Log video call failed: ${videoLogRes.data?.message}`);
    }
    
    const videoCallLog = videoLogRes.data.call;
    console.log('Logged Call details:');
    console.log(`- Type: ${videoCallLog.type}`);
    console.log(`- Status: ${videoCallLog.status}`);
    console.log(`- Duration: ${videoCallLog.duration} seconds`);
    
    if (videoCallLog.type !== 'video' || videoCallLog.status !== 'missed') {
      throw new Error('Video call log fields did not save correctly.');
    }
    console.log('✅ Missed video call logged successfully.');

    // 4. Test fetch call history
    console.log('\n-----------------------------------------');
    console.log('📜 Test 4: Retrieve Call History List');
    console.log('-----------------------------------------');
    const histReq = {
      user: { _id: testUserId, id: testUserId }
    };
    const histRes = createMockRes();
    await getCallHistory(histReq, histRes);
    console.log('Response Status:', histRes.statusCode);
    if (histRes.statusCode !== 200) {
      throw new Error(`Fetching call history failed: ${histRes.data?.message}`);
    }
    
    const logs = histRes.data.history;
    console.log(`Found ${logs.length} call history logs.`);
    if (logs.length < 2) {
      throw new Error('Call history should contain both logged attempts.');
    }
    console.log('✅ Call history list retrieved successfully.');

    // 5. Test fetch missed calls
    console.log('\n-----------------------------------------');
    console.log('🔔 Test 5: Retrieve Missed Calls Notification');
    console.log('-----------------------------------------');
    // Fetch for receiver user (peerUser) who received the missed call
    const missedReq = {
      user: { _id: peerUserId, id: peerUserId }
    };
    const missedRes = createMockRes();
    await getMissedCalls(missedReq, missedRes);
    console.log('Response Status:', missedRes.statusCode);
    if (missedRes.statusCode !== 200) {
      throw new Error(`Fetching missed calls failed: ${missedRes.data?.message}`);
    }
    
    const missedLogs = missedRes.data.missed;
    console.log(`Found ${missedLogs.length} missed calls for receiver.`);
    if (missedLogs.length === 0) {
      throw new Error('Receiver should have at least 1 missed call record.');
    }
    console.log('✅ Missed calls list retrieved successfully.');

    console.log('\n=========================================');
    console.log('🎉 ALL CALL SYSTEM ENDPOINT TESTS PASSED! 🎉');
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ CALL SYSTEM INTEGRATION TEST FAILED:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

run();
