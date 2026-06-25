import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection } from './services/db.service.js';
import User from './models/User.js';

process.on('unhandledRejection', (err) => {
  console.log(`[PROCESS IN TEST DETECTED CRASH] Unhandled Rejection:`, err);
});

async function run() {
  await checkDbConnection();
  try {
    console.log('Testing findById without password select + save...');
    const user = await User.findOne({ email: 'rickrose2008@gmail.com' }).select('-password');
    if (!user) {
      console.log('User not found');
    } else {
      console.log('User found:', user.username);
      console.log('Calling user.save()...');
      await user.save();
      console.log('Save call completed. Waiting 3 seconds to check for crashes...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Finished waiting. No crashes detected!');
    }
  } catch (err) {
    console.error('TEST CAUGHT CRASH:', err);
  }
  process.exit(0);
}

run();
