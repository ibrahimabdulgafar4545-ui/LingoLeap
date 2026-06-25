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
  register, 
  verifyEmailCode, 
  resendVerification, 
  completeOnboarding 
} from './controllers/auth.controller.js';

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
    },
    cookie: function(name, val, options) {
      this.headers[name] = val;
      return this;
    }
  };
  return res;
};

async function run() {
  console.log('\n=========================================');
  console.log('🏁 STARTING LINGOLEAP ONBOARDING & VERIFICATION FLOW TEST 🏁');
  console.log('=========================================\n');

  try {
    await checkDbConnection();
    const fallbackMode = isFallbackMode();
    console.log(`Database Mode: ${fallbackMode ? '⚠️ Fallback Local JSON DB' : '✅ MongoDB Active'}`);

    const randomUsername = `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const testEmail = `${randomUsername}@lingoleaptest.com`;

    // 1. Test registration
    console.log('\n-----------------------------------------');
    console.log('📝 Test 1: Register User & Code Generation (/register)');
    console.log('-----------------------------------------');
    
    const regReq = {
      body: {
        username: randomUsername,
        email: testEmail,
        password: 'password123!',
        targetLanguage: 'Spanish'
      }
    };
    const regRes = createMockRes();
    await register(regReq, regRes);
    console.log('Register Status:', regRes.statusCode);
    
    if (regRes.statusCode !== 201) {
      throw new Error(`Registration failed: ${regRes.data?.message}`);
    }

    const regUser = regRes.data.user;
    console.log(`User created: ${regUser.username} | Email: ${regUser.email}`);
    console.log(`Initial status: Verified = ${regUser.emailVerified} | Onboarded = ${regUser.isOnboarded}`);

    // Retrieve verification code from DB
    let verifyCode = '';
    if (!fallbackMode) {
      const dbUser = await User.findOne({ email: testEmail });
      verifyCode = dbUser.emailVerificationToken;
    } else {
      const db = readJsonDb();
      const dbUser = db.users.find(u => u.email === testEmail);
      verifyCode = dbUser.emailVerificationToken;
    }
    console.log(`Generated verification code from DB: "${verifyCode}" (Length: ${verifyCode?.length})`);
    
    if (!verifyCode || verifyCode.length !== 6) {
      throw new Error(`Verification code must be 6 digits, got: "${verifyCode}"`);
    }
    console.log('✅ Secure 6-digit code generation validated successfully!');

    // 2. Test Resend Verification Code
    console.log('\n-----------------------------------------');
    console.log('🔄 Test 2: Resend Verification Code (/resend-verification)');
    console.log('-----------------------------------------');
    const resendReq = {
      body: { email: testEmail }
    };
    const resendRes = createMockRes();
    await resendVerification(resendReq, resendRes);
    console.log('Resend Status:', resendRes.statusCode);
    console.log('Resend Message:', resendRes.data?.message);

    // Get the new code from DB
    let newCode = '';
    if (!fallbackMode) {
      const dbUser = await User.findOne({ email: testEmail });
      newCode = dbUser.emailVerificationToken;
    } else {
      const db = readJsonDb();
      const dbUser = db.users.find(u => u.email === testEmail);
      newCode = dbUser.emailVerificationToken;
    }
    console.log(`New verification code from DB after resend: "${newCode}"`);
    if (newCode === verifyCode) {
      throw new Error('Resending verification code should generate a fresh code!');
    }
    console.log('✅ Verification code regeneration verified!');

    // 3. Test verifyEmailCode
    console.log('\n-----------------------------------------');
    console.log('🔑 Test 3: Enter Verification Code (/verify-email)');
    console.log('-----------------------------------------');
    const verifyReq = {
      body: {
        code: newCode,
        email: testEmail
      }
    };
    const verifyRes = createMockRes();
    await verifyEmailCode(verifyReq, verifyRes);
    console.log('Verify Status:', verifyRes.statusCode);
    console.log('Verify Response:', verifyRes.data?.message);

    if (verifyRes.statusCode !== 200) {
      throw new Error(`Code verification failed: ${verifyRes.data?.message}`);
    }

    // Check DB status again
    let verifiedUser = null;
    if (!fallbackMode) {
      verifiedUser = await User.findOne({ email: testEmail });
    } else {
      const db = readJsonDb();
      verifiedUser = db.users.find(u => u.email === testEmail);
    }
    console.log(`User Verification Status in DB: Verified = ${verifiedUser.emailVerified}`);
    if (!verifiedUser.emailVerified) {
      throw new Error('User emailVerified flag was not updated to true!');
    }
    if (verifiedUser.emailVerificationToken !== null) {
      throw new Error('Verification token was not cleared after success!');
    }
    console.log('✅ Verification code confirmation verified!');

    // 4. Test completeOnboarding preferences
    console.log('\n-----------------------------------------');
    console.log('🎯 Test 4: Complete Onboarding (/onboarding)');
    console.log('-----------------------------------------');
    const onboardReq = {
      body: {
        nativeLanguage: 'French',
        targetLanguage: 'German',
        learningGoal: 'Business',
        dailyGoal: '30 min',
        skillLevel: 'Intermediate'
      },
      user: { _id: verifiedUser._id || verifiedUser.id, id: verifiedUser._id || verifiedUser.id }
    };
    const onboardRes = createMockRes();
    await completeOnboarding(onboardReq, onboardRes);
    console.log('Onboarding Status:', onboardRes.statusCode);

    if (onboardRes.statusCode !== 200) {
      throw new Error(`Onboarding failed: ${onboardRes.data?.message}`);
    }

    // Check DB status of onboarding preferences
    let onboardedUser = null;
    if (!fallbackMode) {
      onboardedUser = await User.findOne({ email: testEmail });
    } else {
      const db = readJsonDb();
      onboardedUser = db.users.find(u => u.email === testEmail);
    }

    console.log('Onboarded User Preferences in DB:');
    console.log(`- Native Language: ${onboardedUser.nativeLanguage} (Expected: French)`);
    console.log(`- Target Language: ${onboardedUser.targetLanguage} (Expected: German)`);
    console.log(`- Learning Goal: ${onboardedUser.learningGoal} (Expected: Business)`);
    console.log(`- Daily Goal XP: ${onboardedUser.dailyGoalXp} (Expected: 50)`);
    console.log(`- Skill Level: ${onboardedUser.skillLevel} (Expected: Intermediate)`);
    console.log(`- Onboarding Complete Flag: ${onboardedUser.isOnboarded} (Expected: true)`);

    if (onboardedUser.nativeLanguage !== 'French') throw new Error('Native language not updated!');
    if (onboardedUser.targetLanguage !== 'German') throw new Error('Target language not updated!');
    if (onboardedUser.learningGoal !== 'Business') throw new Error('Learning goal not updated!');
    if (onboardedUser.dailyGoalXp !== 50) throw new Error('Daily Goal XP was not correctly mapped to 50 XP!');
    if (onboardedUser.skillLevel !== 'Intermediate') throw new Error('Skill level not updated!');
    if (!onboardedUser.isOnboarded) throw new Error('isOnboarded flag was not updated to true!');

    console.log('✅ Preferences saved in DB successfully verified!');

    // 5. Cleanup test artifacts
    console.log('\n-----------------------------------------');
    console.log('🧹 Test 5: Cleanup Test User');
    console.log('-----------------------------------------');
    if (!fallbackMode) {
      await User.deleteOne({ email: testEmail });
      console.log('MongoDB temporary test user deleted.');
    } else {
      const db = readJsonDb();
      db.users = db.users.filter(u => u.email !== testEmail);
      writeJsonDb(db);
      console.log('Local JSON DB temporary test user deleted.');
    }

    console.log('\n=========================================');
    console.log('🎉 ALL ONBOARDING FLOW INTEGRATION TESTS PASSED! 🎉');
    console.log('=========================================\n');

  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

run();
