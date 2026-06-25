import { checkDbConnection, findUserByEmail, isFallbackMode } from './services/db.service.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
  console.log('--- STARTING ADMIN SEED VERIFICATION TEST ---');
  
  // 1. Establish db connection
  await checkDbConnection();
  
  // Wait for asynchronous seeding to complete
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 2. Fetch admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lingoleap.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
  console.log(`Checking if default admin '${adminEmail}' exists...`);
  const admin = await findUserByEmail(adminEmail);
  
  if (!admin) {
    console.error('❌ FAIL: Default admin user was NOT found in the database.');
    process.exit(1);
  }
  
  console.log('✅ SUCCESS: Default admin user found!');
  console.log('User Details:', {
    id: admin._id || admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    isBanned: admin.isBanned,
    emailVerified: admin.emailVerified
  });
  
  // 3. Verify password match
  console.log(`Verifying password matches '${adminPassword}'...`);
  const isMatch = await admin.matchPassword(adminPassword);
  if (isMatch) {
    console.log(`✅ SUCCESS: Admin password matches '${adminPassword}'!`);
  } else {
    console.error(`❌ FAIL: Admin password does NOT match '${adminPassword}'.`);
    process.exit(1);
  }
  
  // 4. Verify role is admin
  if (admin.role === 'admin') {
    console.log('✅ SUCCESS: User role is verified as "admin"!');
  } else {
    console.error(`❌ FAIL: User role is '${admin.role}', expected 'admin'.`);
    process.exit(1);
  }

  console.log('--- ADMIN SEED VERIFICATION PASSED SUCCESSFULLY ---');
  process.exit(0);
};

runTest().catch(err => {
  console.error('❌ TEST ERRORED:', err);
  process.exit(1);
});
