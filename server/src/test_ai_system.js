import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { 
  checkDbConnection, 
  isFallbackMode, 
  readJsonDb, 
  writeJsonDb 
} from './services/db.service.js';
import User from './models/User.js';
import AIPracticeSession from './models/AIPracticeSession.js';
import { 
  startSession, 
  sendMessageToSession, 
  completeSession, 
  getUserSessions, 
  getUserStats, 
  testGeminiConnection 
} from './controllers/ai.controller.js';

dotenv.config();

// Helper to create mock response object
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
  console.log('🤖 STARTING LINGOLEAP AI TUTOR SYSTEM INTEGRATION TEST 🤖');
  console.log('=========================================\n');

  try {
    // 1. Establish connection to active DB mode
    await checkDbConnection();
    const fallbackMode = isFallbackMode();
    console.log(`Database Mode: ${fallbackMode ? '⚠️ Fallback Local JSON DB' : '✅ MongoDB Active'}`);

    // 2. Obtain a test user
    let testUser = null;
    if (!fallbackMode) {
      testUser = await User.findOne({});
      if (!testUser) {
        console.log('Creating a temporary user in MongoDB for tests...');
        testUser = await User.create({
          username: 'aitestuser',
          email: 'aitest@lingoleap.com',
          password: 'password123!',
          targetLanguage: 'Spanish',
          xp: 100,
          gems: 20,
          emailVerified: true
        });
      }
    } else {
      const db = readJsonDb();
      if (!db.users || db.users.length === 0) {
        console.log('Creating a temporary user in local JSON DB for tests...');
        testUser = {
          _id: new mongoose.Types.ObjectId().toString(),
          username: 'aitestuser',
          email: 'aitest@lingoleap.com',
          password: 'password123!',
          targetLanguage: 'Spanish',
          xp: 100,
          gems: 20,
          emailVerified: true,
          studyCalendar: [],
          recentActivity: []
        };
        db.users.push(testUser);
        writeJsonDb(db);
      } else {
        testUser = db.users[0];
      }
    }

    const testUserId = testUser._id || testUser.id;
    console.log(`Using Test User: ${testUser.username} (ID: ${testUserId})`);
    console.log(`Initial User Stats: XP = ${testUser.xp}, Gems = ${testUser.gems}`);

    // 3. Test Gemini connection diagnostic endpoint
    console.log('\n-----------------------------------------');
    console.log('🩺 Test 1: Gemini Connection Diagnostic');
    console.log('-----------------------------------------');
    const diagnosticRes = createMockRes();
    await testGeminiConnection({}, diagnosticRes);
    console.log('Diagnostic Status:', diagnosticRes.statusCode);
    console.log('Diagnostic Response:', JSON.stringify(diagnosticRes.data, null, 2));

    // 4. Test startSession
    console.log('\n-----------------------------------------');
    console.log('🚀 Test 2: Start Practice Session (/session/start)');
    console.log('-----------------------------------------');
    const startReq = {
      body: {
        scenario: 'casual',
        language: 'Spanish',
        level: 'Intermediate'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const startRes = createMockRes();
    await startSession(startReq, startRes);
    console.log('Start Session Status:', startRes.statusCode);
    
    if (startRes.statusCode !== 201) {
      throw new Error(`Start session failed with code ${startRes.statusCode}: ${startRes.data?.message}`);
    }

    const session = startRes.data.session;
    const sessionId = session._id || session.id;
    console.log(`Practice Session Created Successfully: SessionID = ${sessionId}`);
    console.log(`Tutor greeting: "${session.messages[0].content}"`);

    // 5. Test sendMessageToSession
    console.log('\n-----------------------------------------');
    console.log('💬 Test 3: Send Message to Session (/session/:id/message)');
    console.log('-----------------------------------------');
    const msgReq = {
      params: { sessionId },
      body: {
        message: 'Hola tutor! ¿Qué tal estás hoy? Quiero practicar español.'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const msgRes = createMockRes();
    await sendMessageToSession(msgReq, msgRes);
    console.log('Send Message Status:', msgRes.statusCode);

    if (msgRes.statusCode !== 200) {
      throw new Error(`Send message failed with code ${msgRes.statusCode}: ${msgRes.data?.message}`);
    }

    console.log('Tutor reply:', msgRes.data.reply);
    console.log('Grammar Mistakes found:', JSON.stringify(msgRes.data.grammarMistakes));
    console.log('Vocabulary highlights:', JSON.stringify(msgRes.data.vocabulary));

    // 6. Test completeSession and scoring/rewards
    console.log('\n-----------------------------------------');
    console.log('🏁 Test 4: Complete Session & Generate Feedback (/session/:id/complete)');
    console.log('-----------------------------------------');
    const compReq = {
      params: { sessionId },
      user: { _id: testUserId, id: testUserId }
    };
    const compRes = createMockRes();
    await completeSession(compReq, compRes);
    console.log('Complete Session Status:', compRes.statusCode);

    if (compRes.statusCode !== 200) {
      throw new Error(`Complete session failed with code ${compRes.statusCode}: ${compRes.data?.message}`);
    }

    const evaluation = compRes.data.session;
    console.log(`Evaluated Scores: Fluency = ${evaluation.score.fluency}%, Grammar = ${evaluation.score.grammar}%, Vocabulary = ${evaluation.score.vocabulary}%`);
    console.log('Tutor Suggestions:', evaluation.feedback.suggestions);
    console.log('Grammar Mistakes Log:', evaluation.feedback.grammarMistakes);
    console.log(`Rewards Awarded: +${compRes.data.xpAwarded} XP, +${compRes.data.gemsAwarded} Gems`);

    // Verify user profile got updated with XP and Gems
    let updatedUser = null;
    if (!fallbackMode) {
      updatedUser = await User.findById(testUserId);
    } else {
      const db = readJsonDb();
      updatedUser = db.users.find(u => u._id === testUserId);
    }
    console.log(`Updated User Stats: XP = ${updatedUser.xp} (Diff: +${updatedUser.xp - testUser.xp}), Gems = ${updatedUser.gems} (Diff: +${updatedUser.gems - testUser.gems})`);
    
    if (updatedUser.xp <= testUser.xp) {
      throw new Error('XP rewards were not properly credited to user profile!');
    }
    if (updatedUser.gems <= testUser.gems) {
      throw new Error('Gem rewards were not properly credited to user profile!');
    }
    console.log('✅ User profile rewards successfully validated!');

    // 7. Test getUserSessions
    console.log('\n-----------------------------------------');
    console.log('📜 Test 5: Fetch User Sessions (/sessions)');
    console.log('-----------------------------------------');
    const listReq = {
      user: { _id: testUserId, id: testUserId }
    };
    const listRes = createMockRes();
    await getUserSessions(listReq, listRes);
    console.log('Fetch Sessions Status:', listRes.statusCode);
    console.log(`Retrieved ${listRes.data.sessions?.length} sessions from history.`);
    if (!listRes.data.sessions || listRes.data.sessions.length === 0) {
      throw new Error('Could not retrieve completed practice sessions in history!');
    }

    // 8. Test getUserStats
    console.log('\n-----------------------------------------');
    console.log('📊 Test 6: Fetch Progress Analytics (/stats)');
    console.log('-----------------------------------------');
    const statsReq = {
      user: { _id: testUserId, id: testUserId }
    };
    const statsRes = createMockRes();
    await getUserStats(statsReq, statsRes);
    console.log('Fetch Stats Status:', statsRes.statusCode);
    console.log('Stats Body summary:', JSON.stringify({
      totalSessions: statsRes.data.stats?.totalSessions,
      averageFluency: statsRes.data.stats?.averageFluency,
      averageGrammar: statsRes.data.stats?.averageGrammar,
      averageVocabulary: statsRes.data.stats?.averageVocabulary,
      recommendedPractice: statsRes.data.stats?.recommendedPractice
    }, null, 2));

    if (statsRes.data.stats?.totalSessions === 0) {
      throw new Error('Calculated total sessions should not be zero!');
    }

    // 9. Cleanup
    console.log('\n-----------------------------------------');
    console.log('🧹 Test 7: Cleanup Test Artifacts');
    console.log('-----------------------------------------');
    if (!fallbackMode) {
      await AIPracticeSession.deleteMany({ userId: testUserId });
      // If we created a temporary test user, clean it up
      if (testUser.username === 'aitestuser') {
        await User.deleteOne({ _id: testUserId });
        console.log('Cleaned up MongoDB temporary test user and sessions.');
      } else {
        // Reset original stats
        await User.findByIdAndUpdate(testUserId, { xp: testUser.xp, gems: testUser.gems });
        console.log('Restored user original stats in MongoDB.');
      }
    } else {
      const db = readJsonDb();
      db.aiPracticeSessions = db.aiPracticeSessions.filter(s => s.userId !== testUserId.toString());
      if (testUser.username === 'aitestuser') {
        db.users = db.users.filter(u => u._id !== testUserId);
        console.log('Cleaned up local JSON DB temporary test user and sessions.');
      } else {
        const idx = db.users.findIndex(u => u._id === testUserId);
        if (idx !== -1) {
          db.users[idx].xp = testUser.xp;
          db.users[idx].gems = testUser.gems;
        }
        console.log('Restored user original stats in local JSON DB.');
      }
      writeJsonDb(db);
    }

    console.log('\n=========================================');
    console.log('🎉 ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
  process.exit(0);
}

run();
