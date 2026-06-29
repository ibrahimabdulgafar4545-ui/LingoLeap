import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { checkDbConnection } from './services/db.service.js';
import User from './models/User.js';

async function run() {
  await checkDbConnection();
  try {
    const users = await User.find({}).select('+password');
    console.log('--- USERS IN MONGO ---');
    for (const u of users) {
      console.log(`Username: ${u.username}`);
      console.log(`Email: ${u.email}`);
      console.log(`Password Hash: ${u.password}`);
      console.log(`Role: ${u.role}`);
      console.log('--------------------');
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  }
  process.exit(0);
}

run();
