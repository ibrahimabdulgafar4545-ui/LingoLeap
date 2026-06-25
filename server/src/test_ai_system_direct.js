import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { 
  checkDbConnection, 
  isFallbackMode, 
  readJsonDb, 
  writeJsonDb 
} from './services/db.service.js';
import User from './models/User.js';
import { 
  chatDirect,
  grammarCheckDirect,
  vocabularyHelpDirect,
  pronunciationHelpDirect
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
  console.log('🤖 STARTING DIRECT AI ENDPOINTS INTEGRATION TEST 🤖');
  console.log('=========================================\n');

  try {
    await checkDbConnection();
    const fallbackMode = isFallbackMode();
    console.log(`Database Mode: ${fallbackMode ? '⚠️ Fallback Local JSON DB' : '✅ MongoDB Active'}`);

    // Grab user
    let testUser = null;
    if (!fallbackMode) {
      testUser = await User.findOne({});
    } else {
      const db = readJsonDb();
      testUser = db.users[0];
    }
    const testUserId = testUser._id || testUser.id;
    console.log(`Using Test User: ${testUser.username} (ID: ${testUserId})`);

    // 1. Test /api/ai/chat direct
    console.log('\n-----------------------------------------');
    console.log('💬 Test 1: Direct Chat Stateless Turn (/chat)');
    console.log('-----------------------------------------');
    const chatReq = {
      body: {
        scenario: 'restaurant',
        language: 'Spanish',
        level: 'Intermediate',
        messages: [
          { role: 'model', content: '¿Qué desea tomar para empezar?' },
          { role: 'user', content: 'Quiero una paella y una copa de agua.' }
        ]
      },
      user: { _id: testUserId, id: testUserId }
    };
    const chatRes = createMockRes();
    await chatDirect(chatReq, chatRes);
    console.log('Chat Status:', chatRes.statusCode);
    
    if (chatRes.statusCode !== 200) {
      throw new Error(`Direct chat turn failed: ${chatRes.data?.message}`);
    }
    console.log('Tutor reply:', chatRes.data.reply);

    // 2. Test /api/ai/grammar-check
    console.log('\n-----------------------------------------');
    console.log('🩺 Test 2: Direct Grammar Check (/grammar-check)');
    console.log('-----------------------------------------');
    const gramReq = {
      body: {
        text: 'yo querer cafe por favor',
        language: 'Spanish'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const gramRes = createMockRes();
    await grammarCheckDirect(gramReq, gramRes);
    console.log('Grammar Check Status:', gramRes.statusCode);
    
    if (gramRes.statusCode !== 200) {
      throw new Error(`Grammar check failed: ${gramRes.data?.message}`);
    }
    console.log('Feedback:', JSON.stringify(gramRes.data, null, 2));
    if (!gramRes.data.hasErrors) {
      throw new Error('Grammar check should have detected errors in "yo querer cafe"!');
    }

    // 3. Test /api/ai/vocabulary-help
    console.log('\n-----------------------------------------');
    console.log('📚 Test 3: Direct Vocabulary Help (/vocabulary-help)');
    console.log('-----------------------------------------');
    const vocabReq = {
      body: {
        word: 'reserva',
        language: 'Spanish'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const vocabRes = createMockRes();
    await vocabularyHelpDirect(vocabReq, vocabRes);
    console.log('Vocabulary Help Status:', vocabRes.statusCode);
    
    if (vocabRes.statusCode !== 200) {
      throw new Error(`Vocab help failed: ${vocabRes.data?.message}`);
    }
    console.log('Vocab Info:', JSON.stringify(vocabRes.data, null, 2));
    if (!vocabRes.data.translation) {
      throw new Error('Vocab help should return translation details!');
    }

    // 4. Test /api/ai/pronunciation-help
    console.log('\n-----------------------------------------');
    console.log('🗣️ Test 4: Direct Pronunciation Help (/pronunciation-help)');
    console.log('-----------------------------------------');
    const pronReq = {
      body: {
        word: 'reserva',
        language: 'Spanish'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const pronRes = createMockRes();
    await pronunciationHelpDirect(pronReq, pronRes);
    console.log('Pronunciation Help Status:', pronRes.statusCode);

    if (pronRes.statusCode !== 200) {
      throw new Error(`Pronunciation help failed: ${pronRes.data?.message}`);
    }
    console.log('Pronunciation Guide:', JSON.stringify(pronRes.data, null, 2));
    if (!pronRes.data.phonetic) {
      throw new Error('Pronunciation help should return phonetic breakdowns!');
    }

    console.log('\n=========================================');
    console.log('🎉 ALL DIRECT AI HELP INTEGRATION TESTS PASSED! 🎉');
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ DIRECT AI INTEGRATION TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
  process.exit(0);
}

run();
