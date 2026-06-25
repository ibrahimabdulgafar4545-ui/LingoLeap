import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { 
  checkDbConnection, 
  isFallbackMode, 
  readJsonDb 
} from './services/db.service.js';
import User from './models/User.js';
import { 
  evaluatePronunciation,
  getPronunciationHistory
} from './controllers/ai.controller.js';

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
  console.log('🗣️ STARTING PRONUNCIATION ENDPOINTS INTEGRATION TEST 🗣️');
  console.log('=========================================\n');

  try {
    await checkDbConnection();
    const fallbackMode = isFallbackMode();
    console.log(`Database Mode: ${fallbackMode ? '⚠️ Fallback Local JSON DB' : '✅ MongoDB Active'}`);

    // Grab or mock user
    let testUser = null;
    if (!fallbackMode) {
      testUser = await User.findOne({});
    } else {
      const db = readJsonDb();
      testUser = db.users[0];
    }
    
    if (!testUser) {
      console.warn("⚠️ No test user found. Please register a user or run seeds first.");
      process.exit(1);
    }
    
    const testUserId = testUser._id || testUser.id;
    console.log(`Using Test User: ${testUser.username} (ID: ${testUserId})`);

    // 1. Test evaluation with invalid format (Security Check)
    console.log('\n-----------------------------------------');
    console.log('🔒 Test 1a: Security Guard - Invalid Audio String (Non-Audio Mime)');
    console.log('-----------------------------------------');
    const invalidFormatReq = {
      body: {
        phrase: 'Hola, ¿cómo estás?',
        audioUrl: 'data:video/mp4;base64,AAAA'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const invalidFormatRes = createMockRes();
    await evaluatePronunciation(invalidFormatReq, invalidFormatRes);
    console.log('Response Status:', invalidFormatRes.statusCode);
    console.log('Response Message:', invalidFormatRes.data?.message);
    if (invalidFormatRes.statusCode !== 400 || !invalidFormatRes.data?.message.includes('Invalid audio format')) {
      throw new Error('Security check failed: did not catch invalid format regex.');
    }
    console.log('✅ Correctly blocked invalid format regex.');

    console.log('\n-----------------------------------------');
    console.log('🔒 Test 1b: Security Guard - Unsupported Audio Type');
    console.log('-----------------------------------------');
    const unsupportedFormatReq = {
      body: {
        phrase: 'Hola, ¿cómo estás?',
        audioUrl: 'data:audio/gif;base64,AAAA'
      },
      user: { _id: testUserId, id: testUserId }
    };
    const unsupportedFormatRes = createMockRes();
    await evaluatePronunciation(unsupportedFormatReq, unsupportedFormatRes);
    console.log('Response Status:', unsupportedFormatRes.statusCode);
    console.log('Response Message:', unsupportedFormatRes.data?.message);
    if (unsupportedFormatRes.statusCode !== 400 || !unsupportedFormatRes.data?.message.includes('Unsupported audio format')) {
      throw new Error('Security check failed: did not catch unsupported format.');
    }
    console.log('✅ Correctly blocked unsupported format.');

    // 2. Test evaluation with too large file (Security Check)
    console.log('\n-----------------------------------------');
    console.log('🔒 Test 2: Security Guard - File Size Limit');
    console.log('-----------------------------------------');
    const hugeAudioUrl = 'data:audio/webm;base64,' + 'A'.repeat(8000000);
    const tooLargeReq = {
      body: {
        phrase: 'Hola, ¿cómo estás?',
        audioUrl: hugeAudioUrl
      },
      user: { _id: testUserId, id: testUserId }
    };
    const tooLargeRes = createMockRes();
    await evaluatePronunciation(tooLargeReq, tooLargeRes);
    console.log('Response Status:', tooLargeRes.statusCode);
    console.log('Response Message:', tooLargeRes.data?.message);
    if (tooLargeRes.statusCode !== 400 || !tooLargeRes.data?.message.includes('too large')) {
      throw new Error('Security check failed: did not catch oversized file.');
    }
    console.log('✅ Correctly blocked oversized file.');

    // 3. Test successful pronunciation evaluation (Valid WebM Base64)
    console.log('\n-----------------------------------------');
    console.log('🎤 Test 3: Successful Pronunciation Evaluation');
    console.log('-----------------------------------------');
    // Minimal valid-looking base64 WebM structure
    const mockAudioUrl = 'data:audio/webm;base64,GkXfo09uZW1ic2NmSVQ=';
    const evalReq = {
      body: {
        phrase: 'Hola, ¿cómo estás?',
        audioUrl: mockAudioUrl
      },
      user: { _id: testUserId, id: testUserId }
    };
    const evalRes = createMockRes();
    await evaluatePronunciation(evalReq, evalRes);
    console.log('Response Status:', evalRes.statusCode);
    if (evalRes.statusCode !== 200) {
      throw new Error(`Evaluation failed with status ${evalRes.statusCode}: ${evalRes.data?.message}`);
    }
    
    const evaluation = evalRes.data.evaluation;
    console.log('Evaluation Results:');
    console.log(`- Original Phrase: "${evaluation.phrase}"`);
    console.log(`- Spoken Transcript: "${evaluation.transcript}"`);
    console.log(`- Score: ${evaluation.score}/100`);
    console.log(`- Fluency: ${evaluation.fluencyScore}/100`);
    console.log(`- Accuracy: ${evaluation.accuracyScore}/100`);
    console.log(`- Tips: ${JSON.stringify(evaluation.tips)}`);
    console.log(`- Mispronounced Words: ${JSON.stringify(evaluation.mispronouncedWords)}`);
    
    if (evaluation.score === undefined || evaluation.fluencyScore === undefined || evaluation.accuracyScore === undefined) {
      throw new Error('Evaluation response is missing required score fields.');
    }
    console.log('✅ Evaluation completed successfully.');

    // 4. Test history retrieval
    console.log('\n-----------------------------------------');
    console.log('📜 Test 4: Retrieve Pronunciation History');
    console.log('-----------------------------------------');
    const histReq = {
      user: { _id: testUserId, id: testUserId }
    };
    const histRes = createMockRes();
    await getPronunciationHistory(histReq, histRes);
    console.log('Response Status:', histRes.statusCode);
    if (histRes.statusCode !== 200) {
      throw new Error(`Fetching history failed with status ${histRes.statusCode}`);
    }
    console.log(`Found ${histRes.data.history.length} records in history.`);
    if (histRes.data.history.length === 0) {
      throw new Error('History should contain at least the attempt we just created.');
    }
    console.log('✅ History retrieved successfully.');

    console.log('\n=========================================');
    console.log('🎉 ALL PRONUNCIATION ENDPOINT TESTS PASSED! 🎉');
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ PRONUNCIATION INTEGRATION TEST FAILED:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

run();
