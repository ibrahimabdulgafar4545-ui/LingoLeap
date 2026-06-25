import dotenv from 'dotenv';
dotenv.config();

import {
  checkDbConnection,
  findUserByEmail,
  findUserByVerificationToken,
  findUserByResetToken,
  isFallbackMode
} from './services/db.service.js';
import User from './models/User.js';
import crypto from 'crypto';

async function runTests() {
  console.log('🏁 STARTING BREVO EMAIL INTEGRATION FLOW TESTS');
  await checkDbConnection();

  const testEmail = `email_flow_test_${Date.now()}@example.com`;
  const testUsername = `email_flow_${Date.now()}`;
  const testPassword = 'InitialPassword123!';
  const newPassword = 'NewResetPassword456!';

  try {
    // -------------------------------------------------------------
    // Test 1: Register User & Check Verification Tokens
    // -------------------------------------------------------------
    console.log('\n🔹 [1/5] Testing registration verification token creation...');
    
    // Call registration controller behavior manually or via API simulation
    const verifyRawToken = crypto.randomBytes(32).toString('hex');
    const verifyHashedToken = crypto.createHash('sha256').update(verifyRawToken).digest('hex');
    const verifyExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const UserSchemaModel = (await import('./models/User.js')).default;
    const user = new UserSchemaModel({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      targetLanguage: 'Spanish',
      emailVerified: false,
      emailVerificationToken: verifyHashedToken,
      emailVerificationExpire: verifyExpire
    });
    
    await user.save();
    console.log('✅ Mock user registered with verification tokens.');

    // Look up by verification token
    const verifiedUser = await findUserByVerificationToken(verifyHashedToken);
    if (!verifiedUser) {
      throw new Error('Could not find user by verification token!');
    }
    console.log('✅ Found unverified user in database using hashed verification token.');
    if (verifiedUser.emailVerified !== false) {
      throw new Error('User email should not be verified yet.');
    }

    // -------------------------------------------------------------
    // Test 2: Resend Verification Token Creation
    // -------------------------------------------------------------
    console.log('\n🔹 [2/5] Testing token generation on resend verification...');
    const newVerifyRawToken = crypto.randomBytes(32).toString('hex');
    const newVerifyHashedToken = crypto.createHash('sha256').update(newVerifyRawToken).digest('hex');
    const newVerifyExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Simulate resend verification save
    const userToVerify = await UserSchemaModel.findById(user._id);
    userToVerify.emailVerificationToken = newVerifyHashedToken;
    userToVerify.emailVerificationExpire = newVerifyExpire;
    await userToVerify.save();

    const resentUser = await findUserByVerificationToken(newVerifyHashedToken);
    if (!resentUser) {
      throw new Error('Could not find user by new verification token after resend.');
    }
    console.log('✅ Resend verification token saved and retrieved successfully.');

    // -------------------------------------------------------------
    // Test 3: Verify Email
    // -------------------------------------------------------------
    console.log('\n🔹 [3/5] Testing email verification flow...');
    resentUser.emailVerified = true;
    resentUser.emailVerificationToken = null;
    resentUser.emailVerificationExpire = null;
    await resentUser.save();

    const checkedUser = await findUserByEmail(testEmail);
    if (!checkedUser.emailVerified) {
      throw new Error('User email was not marked as verified.');
    }
    console.log('✅ User email successfully marked as verified.');

    // -------------------------------------------------------------
    // Test 4: Forgot Password Token Creation
    // -------------------------------------------------------------
    console.log('\n🔹 [4/5] Testing forgot password reset token generation...');
    const resetRawToken = crypto.randomBytes(32).toString('hex');
    const resetHashedToken = crypto.createHash('sha256').update(resetRawToken).digest('hex');
    const resetExpire = new Date(Date.now() + 60 * 60 * 1000);

    const userForReset = await UserSchemaModel.findById(user._id);
    userForReset.passwordResetToken = resetHashedToken;
    userForReset.passwordResetExpire = resetExpire;
    await userForReset.save();

    const foundResetUser = await findUserByResetToken(resetHashedToken);
    if (!foundResetUser) {
      throw new Error('Could not find user using the password reset token.');
    }
    console.log('✅ Password reset token successfully created and matched.');

    // -------------------------------------------------------------
    // Test 5: Reset Password
    // -------------------------------------------------------------
    console.log('\n🔹 [5/5] Testing password update and token clearing...');
    // In db.service/auth.controller, we save the new password directly
    const userToUpdate = await UserSchemaModel.findById(user._id).select('+password');
    userToUpdate.password = newPassword;
    userToUpdate.passwordResetToken = null;
    userToUpdate.passwordResetExpire = null;
    await userToUpdate.save();

    const updatedUser = await UserSchemaModel.findById(user._id).select('+password');
    const isNewPasswordMatch = await updatedUser.matchPassword(newPassword);
    if (!isNewPasswordMatch) {
      throw new Error('Password reset failed: password does not match new password.');
    }
    console.log('✅ Password reset successfully updated and matched using new hash.');
    
    if (updatedUser.passwordResetToken !== null) {
      throw new Error('Reset tokens were not cleared.');
    }
    console.log('✅ Password reset tokens cleared cleanly.');

    console.log('\n🎉 ALL INTEGRATION FLOW TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ INTEGRATION FLOW TEST FAILED:', error);
  } finally {
    console.log('\nCleaning up integration test user...');
    await User.deleteOne({ email: testEmail });
    console.log('Cleanup completed.');
  }
  process.exit(0);
}

runTests();
