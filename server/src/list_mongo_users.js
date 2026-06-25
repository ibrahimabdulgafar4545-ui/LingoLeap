import dotenv from 'dotenv';
dotenv.config();

import { checkDbConnection } from './services/db.service.js';
import User from './models/User.js';

async function run() {
  await checkDbConnection();
  try {
    const users = await User.find({}).select('username email xp level createdAt');
    console.log('--- MONGO USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('Total users:', users.length);
  } catch (err) {
    console.error('Failed to list users:', err);
  }
  process.exit(0);
}

run();
