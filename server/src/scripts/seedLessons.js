import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lesson from '../models/Lesson.js';
import connectDB from '../config/db.js';
import { lessonsData } from '../data/lessonsData.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    await Lesson.deleteMany({});
    console.log('✅ Cleared existing lessons.');
    const inserted = await Lesson.insertMany(lessonsData);
    console.log(`✅ Seeded ${inserted.length} lessons across all languages:`);
    const byLang = {};
    inserted.forEach(l => { byLang[l.language] = (byLang[l.language] || 0) + 1; });
    Object.entries(byLang).forEach(([lang, count]) => console.log(`   ${lang}: ${count} lessons`));
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
