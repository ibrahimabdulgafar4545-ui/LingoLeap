import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection } from './services/db.service.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

async function run() {
  console.log('--- RESETTING CORRUPTED MONGO PASSWORDS ---');
  await checkDbConnection();
  
  const targetEmails = [
    'ibrahimabdulgafar4545@gmail.com', // Marybro
    'ibrahimbolarin5@gmail.com',        // Gafboi
    'rickrose2008@gmail.com'           // GAFMAN
  ];
  
  try {
    for (const email of targetEmails) {
      const user = await User.findOne({ email }).select('+password');
      if (user) {
        console.log(`\nUser found: ${user.username} (${email})`);
        console.log(`Old corrupted hash: ${user.password}`);
        
        // Reset password to 'password123'
        user.password = 'password123';
        // Save user (this will invoke the fixed pre-save hook to hash 'password123' once)
        await user.save();
        
        const updatedUser = await User.findOne({ email }).select('+password');
        console.log(`New clean hash: ${updatedUser.password}`);
        
        const isMatch = await updatedUser.matchPassword('password123');
        console.log(`Verifying 'password123' match: ${isMatch}`);
      } else {
        console.log(`\nUser not found for email: ${email}`);
      }
    }
    console.log('\n--- PASSWORD RESET COMPLETED SYSTEM-WIDE ---');
  } catch (err) {
    console.error('Password reset crash:', err);
  }
  process.exit(0);
}

run();
