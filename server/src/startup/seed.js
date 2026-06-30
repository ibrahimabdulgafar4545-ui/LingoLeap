import fs from 'fs';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { isFallbackMode, seedMockLessons, readJsonDb } from '../services/db.service.js';

/**
 * Audits, loads, and seeds lesson data on server startup.
 * Handles both MongoDB and JSON fallback modes.
 */
export const auditAndSeedLessons = async () => {
  // --- Lesson Audit ---
  if (!isFallbackMode()) {
    try {
      const Lesson = (await import('../models/Lesson.js')).default;
      const count = await Lesson.countDocuments({});
      const langs = await Lesson.distinct('language');
      const logs = [`Total lessons in MongoDB: ${count}`, `Languages present: ${langs.join(', ')}`];
      for (const l of langs) {
        const lCount = await Lesson.countDocuments({ language: l });
        const firstL = await Lesson.findOne({ language: l, order: 1 });
        const wordsLen = firstL?.words?.length ?? 'none';
        logs.push(` - ${l}: ${lCount} lessons (Lesson 1 words length: ${wordsLen})`);
      }
      fs.writeFileSync('./db_lessons_audit.txt', logs.join('\n'), 'utf-8');
      console.log('\u{1F4DD} Lesson audit written to server/db_lessons_audit.txt');
    } catch (err) {
      console.error('Lesson audit failed:', err);
    }
  } else {
    try {
      const db = readJsonDb();
      const logs = [`Total lessons in local JSON DB: ${db.lessons?.length || 0}`];
      fs.writeFileSync('./db_lessons_audit.txt', logs.join('\n'), 'utf-8');
      console.log('\u{1F4DD} Local JSON Lesson audit written to server/db_lessons_audit.txt');
    } catch (err) {
      console.error('Local JSON Lesson audit failed:', err);
    }
  }

  // --- Generate Curriculum ---
  try {
    const { generateCurriculum } = await import('../services/curriculumGenerator.js');
    generateCurriculum();
  } catch (err) {
    console.error('\u274C Failed to run curriculum generator:', err);
  }

  // --- Load Lessons Data ---
  let lessonsData = [];
  try {
    const lessonsModule = await import('../data/lessonsData.js');
    lessonsData = lessonsModule.lessonsData;
  } catch (err) {
    console.error('\u274C Failed to load lessonsData:', err);
  }

  // --- Seed Database ---
  if (isFallbackMode()) {
    seedMockLessons(lessonsData);
  } else {
    try {
      const Lesson = (await import('../models/Lesson.js')).default;
      const uniqueLanguages = [...new Set(lessonsData.map(l => l.language))];
      
      for (const lang of uniqueLanguages) {
        const langLessons = lessonsData.filter(l => l.language.toLowerCase() === lang.toLowerCase());
        const countForLang = await Lesson.countDocuments({ language: { $regex: new RegExp(`^${lang}$`, 'i') } });

        const hasOldPrompts = await Lesson.findOne({
          language: { $regex: new RegExp(`^${lang}$`, 'i') },
          'questions.prompt': { $regex: /English meaning/i }
        });
        
        const firstLessonDb = await Lesson.findOne({
          language: { $regex: new RegExp(`^${lang}$`, 'i') },
          order: 1
        });
        const isOldSchema = !firstLessonDb || !firstLessonDb.words || firstLessonDb.words.length === 0;
        
        if (countForLang !== langLessons.length || hasOldPrompts || isOldSchema || process.env.FORCE_SEED === 'true') {
          console.log(`\u{1F343} Curriculum mismatch/update detected for ${lang} (DB count: ${countForLang}, expected: ${langLessons.length}). Re-seeding...`);
          
          await Lesson.deleteMany({ language: { $regex: new RegExp(`^${lang}$`, 'i') } });
          
          const lessonsToInsert = langLessons.map((l) => {
            const lessonKey = `lesson_${l.language.toLowerCase()}_${l.order}`;
            const hash = crypto.createHash('md5').update(lessonKey).digest('hex');
            const unlockedId = new mongoose.Types.ObjectId(hash.substring(0, 24));
            
            return {
              ...l,
              _id: unlockedId,
              questions: l.questions.map((q, qIndex) => {
                const questionKey = `q_${l.language.toLowerCase()}_${l.order}_${qIndex}`;
                const qHash = crypto.createHash('md5').update(questionKey).digest('hex');
                return {
                  ...q,
                  _id: new mongoose.Types.ObjectId(qHash.substring(0, 24))
                };
              })
            };
          });
          
          await Lesson.insertMany(lessonsToInsert);
          console.log(`\u2705 Deterministically seeded ${lessonsToInsert.length} lessons for ${lang} into MongoDB.`);
        }
      }
      console.log('\u{1F343} MongoDB lessons check complete.');
    } catch (err) {
      console.error('\u274C Failed to check or seed MongoDB lessons:', err);
    }
  }
};
