import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection, findUserById } from './services/db.service.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function run() {
  console.log('--- STARTING E2E AUTHENTICATION AUDIT ---');
  await checkDbConnection();
  
  const testEmail = `e2e_test_${Date.now()}@example.com`;
  const testUsername = `e2e_user_${Date.now()}`;
  const testPassword = 'mySecurePassword123!';
  
  try {
    // 1. Signup Flow Verification
    console.log('\n[1/6] Verifying Signup Flow...');
    const newUser = new User({
      username: testUsername,
      email: testEmail,
      password: testPassword,
      targetLanguage: 'French'
    });
    
    await newUser.save();
    console.log('User signed up successfully!');
    
    // 2. Password Hashing Verification
    console.log('\n[2/6] Verifying Password Hashing...');
    const userInDb = await User.findOne({ email: testEmail }).select('+password');
    if (!userInDb) {
      throw new Error('Verification failed: User was not saved in MongoDB');
    }
    console.log('Saved user password hash:', userInDb.password);
    const isHashed = userInDb.password && userInDb.password.startsWith('$2a$');
    console.log('Is password hashed with bcrypt:', isHashed);
    if (!isHashed) {
      throw new Error('Verification failed: Password was not hashed!');
    }
    
    // 3. Password Comparison Verification
    console.log('\n[3/6] Verifying Login Password Comparison...');
    const correctMatch = await userInDb.matchPassword(testPassword);
    console.log('Match with correct password:', correctMatch);
    if (!correctMatch) {
      throw new Error('Verification failed: Correct password comparison failed');
    }
    
    const wrongMatch = await userInDb.matchPassword('wrongPassword');
    console.log('Match with incorrect password:', wrongMatch);
    if (wrongMatch) {
      throw new Error('Verification failed: Incorrect password comparison should fail');
    }
    
    // 4. JWT Generation Verification
    console.log('\n[4/6] Verifying JWT Token Generation...');
    const token = jwt.sign(
      { id: userInDb._id.toString() },
      process.env.JWT_SECRET || 'lingoleap_super_secret_jwt_key_123!',
      { expiresIn: '7d' }
    );
    console.log('Generated JWT token successfully:', token);
    
    // 5. JWT Verification
    console.log('\n[5/6] Verifying JWT Token Decoding...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lingoleap_super_secret_jwt_key_123!');
    console.log('Decoded token payload:', decoded);
    if (decoded.id !== userInDb._id.toString()) {
      throw new Error('Verification failed: Decoded ID does not match database user ID');
    }
    
    // 6. Auth Middleware / findUserById compatibility check
    console.log('\n[6/6] Verifying findUserById (Auth Middleware simulation)...');
    const authUser = await findUserById(decoded.id);
    console.log('Fetched user from findUserById:', authUser.username);
    
    // Ensure that modifying user stats and calling save works
    const mongoUser = await User.findById(decoded.id);
    mongoUser.xp += 50;
    await mongoUser.save();
    console.log('Successfully saved user modifications without crash.');
    
    console.log('\n--- ALL E2E AUTHENTICATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('\n❌ E2E AUTH TEST FAILED:', err);
  } finally {
    // Cleanup
    console.log('\nCleaning up E2E test user...');
    await User.deleteOne({ email: testEmail });
    console.log('Cleanup completed.');
  }
  process.exit(0);
}

run();
