import {
  findLessonsByLanguage,
  findLessonById,
  submitLessonProgress,
  getCompletedLessons,
  getGlobalLeaderboard,
  findUserById,
  updateUser,
  getLeagueName,
  isFallbackMode,
  readJsonDb
} from '../services/db.service.js';
import fs from 'fs';
import path from 'path';
import { callAIService } from './ai.controller.js';

const dailyQuestTemplates = [
  { id: 'lessons_3', title: 'Complete 3 lessons', type: 'lessonsCompleted', target: 3, xpReward: 20, gemsReward: 5 },
  { id: 'xp_50', title: 'Earn 50 XP', type: 'xpEarned', target: 50, xpReward: 15, gemsReward: 5 },
  { id: 'practice_10', title: 'Practice for 10 minutes', type: 'minutesPracticed', target: 10, xpReward: 10, gemsReward: 3 }
];

const achievementTemplates = [
  { id: 'first_lesson', name: 'First Lesson', description: 'Complete your first lesson', requireType: 'lessons', requireValue: 1 },
  { id: 'streak_7', name: '7 Day Streak', description: 'Study for 7 days in a row', requireType: 'streak', requireValue: 7 },
  { id: 'xp_100', name: '100 XP Earned', description: 'Earn 100 total XP', requireType: 'xp', requireValue: 100 },
  { id: 'unit_1', name: 'Complete Unit 1', description: 'Complete the first unit', requireType: 'unit', requireValue: 1 },
  { id: 'lessons_10', name: 'Complete 10 Lessons', description: 'Complete 10 lessons', requireType: 'lessons', requireValue: 10 }
];

const getUnitNumber = (lesson, index) => lesson.unit || Math.floor(index / 4) + 1;

const ensureDailyQuests = async (user) => {
  const today = new Date().toISOString().slice(0, 10);
  
  // If user already has quests generated for today, return them
  if (user.dailyQuests && user.dailyQuests.length > 0 && user.dailyQuestState?.date === today) {
    return user.dailyQuests;
  }
  
  // Otherwise, generate new daily quests
  let quests = [...dailyQuestTemplates];
  
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
  if (apiKey && !apiKey.includes('your_')) {
    const systemPrompt = `You are LingoLeap's Daily Challenges Engine. Generate exactly 3 personalized challenges for a user.
Student profile:
- Target Language: ${user.targetLanguage || 'Spanish'}
- Level: ${user.difficultyLevel || user.skillLevel || 'Beginner'}
- Weak Words: ${JSON.stringify(user.weakVocabulary || [])}
- Weak Grammar: ${JSON.stringify(user.weakGrammar || [])}

You must return exactly 3 challenges. Each challenge must map to one of LingoLeap's trackable progress types:
- 'lessonsCompleted': requires completing lessons (target value between 1 and 3)
- 'xpEarned': requires earning XP (target value between 20 and 100)
- 'minutesPracticed': requires practicing (target value between 5 and 30)

Provide a personalized, encouraging title matching their language and level. Examples:
1. "Complete 2 Spanish lessons to review verbs" (type: 'lessonsCompleted', target: 2)
2. "Learn 20 new words by earning 50 XP today" (type: 'xpEarned', target: 50)
3. "Practice your weak grammar for 15 minutes" (type: 'minutesPracticed', target: 15)

You MUST reply strictly with a JSON array of 3 objects. Do not wrap in markdown code blocks.
Each object must contain keys:
- "id": string (e.g., "quest_1", "quest_2", "quest_3")
- "title": string (the personalized title)
- "type": string ('lessonsCompleted', 'xpEarned', or 'minutesPracticed')
- "target": number (the target goal)
- "xpReward": number (between 10 and 30)
- "gemsReward": number (between 2 and 10)
`;

    try {
      const contents = [{ role: 'user', parts: [{ text: "Generate 3 daily challenges." }] }];
      const result = await callAIService(contents, systemPrompt);
      if (result.ok) {
        let text = result.text.trim();
        if (text.startsWith('```')) {
          text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length === 3) {
          quests = parsed;
        }
      }
    } catch (e) {
      console.error('[Daily Quest Generation Error, using templates]:', e);
    }
  }
  
  // Save generated quests in the user object
  await updateUser(user._id.toString(), { dailyQuests: quests });
  return quests;
};

// In-memory cache for buildLearningState (per user, 10 second TTL)
const learningStateCache = new Map();
const LEARNING_STATE_CACHE_TTL = 10000; // 10 seconds

const buildLearningState = async (userId) => {
  // Check cache first
  const cached = learningStateCache.get(userId);
  if (cached && Date.now() - cached.timestamp < LEARNING_STATE_CACHE_TTL) {
    return cached.data;
  }


  const user = await findUserById(userId);
  const language = user?.targetLanguage || 'Spanish';
  const lessons = await findLessonsByLanguage(language);
  const completedIds = await getCompletedLessons(userId.toString());
  const totalLessons = lessons.length;
  const completedLessons = completedIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const unitTotals = new Map();
  const unitCompleted = new Map();
  lessons.forEach((lesson, index) => {
    const unit = getUnitNumber(lesson, index);
    const id = lesson._id.toString();
    unitTotals.set(unit, (unitTotals.get(unit) || 0) + 1);
    if (completedIds.includes(id)) unitCompleted.set(unit, (unitCompleted.get(unit) || 0) + 1);
  });

  const activeQuests = await ensureDailyQuests(user);

  const quests = activeQuests.map((quest) => {
    const current = user?.dailyQuestState?.[quest.type] || 0;
    const completed = current >= quest.target;
    const claimed = (user?.dailyQuestState?.claimedQuestIds || []).includes(quest.id);
    return {
      ...quest,
      current,
      completed,
      claimed,
      progressPct: Math.min(Math.round((current / quest.target) * 100), 100)
    };
  });

  // Load achievements dynamically from DB or local JSON
  let achievementsList = [];
  if (!isFallbackMode()) {
    try {
      const Achievement = (await import('../models/Achievement.js')).default;
      achievementsList = await Achievement.find({});
    } catch (e) {
      achievementsList = [];
    }
  } else {
    try {
      achievementsList = readJsonDb().achievements || [];
    } catch (e) {
      achievementsList = [];
    }
  }

  // Fallback to static defaults if none configured in the database
  if (!achievementsList || achievementsList.length === 0) {
    achievementsList = achievementTemplates;
  }

  const achievements = achievementsList.map((achievement) => {
    // If it's a mongoose object, convert it
    const achObj = typeof achievement.toObject === 'function' ? achievement.toObject() : { ...achievement };
    let current = 0;
    if (achObj.requireType === 'xp') current = user?.xp || 0;
    if (achObj.requireType === 'streak') current = user?.streakCount || 0;
    if (achObj.requireType === 'lessons') current = completedLessons;
    if (achObj.requireType === 'unit') {
      current = (unitCompleted.get(achObj.requireValue) || 0) >= (unitTotals.get(achObj.requireValue) || 1) ? 1 : 0;
    }
    const unlocked = current >= achObj.requireValue;
    return {
      ...achObj,
      current,
      unlocked,
      progressPct: Math.min(Math.round((current / achObj.requireValue) * 100), 100)
    };
  });

  const result = {
    user,
    stats: { totalLessons, completedLessons, progressPct },
    quests,
    achievements,
    calendar: user?.studyCalendar || [],
    league: {
      name: getLeagueName(user?.weeklyXp || 0),
      weeklyXp: user?.weeklyXp || 0
    }
  };

  // Cache the result
  learningStateCache.set(userId, { data: result, timestamp: Date.now() });

  return result;
};

// @desc   Get all lessons for current user's target language
// @route  GET /api/lessons
export const getLessons = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // Skip expensive findUserById when language is explicitly provided
    const language = req.query.language || req.user.targetLanguage || 'Spanish';

    const lessons = await findLessonsByLanguage(language);
    const completedIds = await getCompletedLessons(userId.toString());

    // Mark each lesson as completed/locked
    const lessonsWithStatus = lessons.map((lesson, index) => {
      const lessonObj = typeof lesson.toObject === 'function' ? lesson.toObject() : { ...lesson };
      const lessonIdStr = lessonObj._id.toString();
      lessonObj.isCompleted = completedIds.includes(lessonIdStr);
      // Lesson is unlocked if it's first, or the previous lesson is completed
      lessonObj.isLocked = index > 0 && !completedIds.includes(lessons[index - 1]._id.toString());
      return lessonObj;
    });

    res.status(200).json({ success: true, lessons: lessonsWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get a single lesson by ID
// @route  GET /api/lessons/:id
export const getLessonById = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const lesson = await findLessonById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lessonObj = typeof lesson.toObject === 'function' ? lesson.toObject() : JSON.parse(JSON.stringify(lesson));

    // If userId exists, personalize it using Grok/Gemini
    if (userId) {
      const user = await findUserById(userId.toString());
      if (user) {
        const language = lessonObj.language || user.targetLanguage || 'Spanish';
        const level = user.skillLevel || 'Beginner';
        const weakVocabulary = user.weakVocabulary || [];
        const weakGrammar = user.weakGrammar || [];

        // Check if there is an active API key
        const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
        if (apiKey && !apiKey.includes('your_')) {
          // Dynamic Prompt for Grok
          const systemPrompt = `You are a professional language tutor for LingoLeap.
Generate a fresh, personalized, and randomized language lesson for a student.
Student profile:
- Target Language: ${language}
- Skill Level: ${level} (Beginner, Intermediate, Advanced)
- Weak vocabulary words/phrases to review: ${JSON.stringify(weakVocabulary)}
- Weak grammar topics/concepts to review: ${JSON.stringify(weakGrammar)}

Lesson blueprint to customize:
- Lesson Title: "${lessonObj.title}"
- Lesson Category: "${lessonObj.category}" (e.g. Vocabulary, Grammar, Reading, Listening, Speaking, Translation, Quiz)
- Unit Title: "${lessonObj.unitTitle}"

You MUST generate exactly 5 exercises/questions of various types. Include:
1. Vocabulary questions (type: "multiple-choice" or "fill-blank")
2. Grammar questions (type: "multiple-choice" or "fill-blank")
3. Translation exercises (type: "translate")
4. Sentence-building exercises (type: "multiple-choice" where prompt asks to reorder or choose correct syntax, or "fill-blank")
5. Conversation exercises (type: "speak" or "multiple-choice" dialogue)

Guidelines:
- Incorporate the user's weak vocabulary words or grammar concepts if any are available.
- Randomize and shuffle the answer options. Shuffled answers are crucial, ensure the correct answer is not always the first option.
- Every question must follow the required JSON structure.
- You MUST reply strictly with a JSON object. Do not add any markdown block format (no \`\`\`json ... \`\`\`).
The JSON object must have a single key "questions" containing an array of objects. Each question object must contain:
1. "type": one of "multiple-choice", "fill-blank", "translate", "speak", "listen", "match"
2. "prompt": (string) instructions or sentence to act on
3. "options": (array of strings) 3-4 options for choice questions, or empty for others. For "match", provide exactly 4 items in the format "ForeignWord - EnglishWord" (e.g. ["hola - hello", "gracias - thank you"]).
4. "correctAnswer": (string) the correct answer. For "match", this can match the first paired option or be a dummy string like "Matched successfully".
`;

          const contents = [{ role: 'user', parts: [{ text: `Generate questions matching unit title: "${lessonObj.unitTitle}" and lesson title: "${lessonObj.title}"` }] }];
          try {
            const result = await callAIService(contents, systemPrompt);
            if (result.ok) {
              let text = result.text.trim();
              // Clean any markdown formatting just in case
              if (text.startsWith('```')) {
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
              }
              const parsed = JSON.parse(text);
              if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                // Shuffle options for all multiple-choice/fill-blank questions to enforce randomization
                parsed.questions.forEach(q => {
                  if (q.options && Array.isArray(q.options) && q.options.length > 1) {
                    if (!q.options.includes(q.correctAnswer) && q.type !== 'match') {
                      q.options.push(q.correctAnswer);
                    }
                    q.options = q.options.sort(() => 0.5 - Math.random());
                  }
                });

                lessonObj.questions = parsed.questions;
                lessonObj.isDynamic = true;
                return res.status(200).json({ success: true, lesson: lessonObj });
              }
            }
          } catch (e) {
            console.error('[AI Lesson Generation Error, falling back to database]:', e);
          }
        }
      }
    }

    // Default Fallback: return static lesson with randomized and shuffled static questions
    if (lessonObj.questions && Array.isArray(lessonObj.questions)) {
      lessonObj.questions = lessonObj.questions.map(q => {
        if (q.options && Array.isArray(q.options) && q.options.length > 1) {
          return {
            ...q,
            options: [...q.options].sort(() => 0.5 - Math.random())
          };
        }
        return q;
      }).sort(() => 0.5 - Math.random());
    }

    res.status(200).json({ success: true, lesson: lessonObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Submit lesson answers and update XP/streak/progress
// @route  POST /api/lessons/:id/submit
export const submitLesson = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // Invalidate learning state cache on lesson submit
    learningStateCache.delete(userId.toString());
    const { answers, totalQuestions } = req.body;
    const lessonId = req.params.id;

    const lesson = await findLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Invalid answers format' });
    }

    // Server-side validation of score
    let correctCount = 0;
    const hasQuestionDetail = answers.length > 0 && (answers[0].question !== undefined);

    if (hasQuestionDetail) {
      correctCount = answers.filter(a => a.isCorrect).length;
    } else if (lesson.questions) {
      answers.forEach((ans, idx) => {
        const q = lesson.questions[idx];
        if (q) {
          if (ans.isCorrect) correctCount++;
        }
      });
    } else {
      correctCount = answers.filter(a => a.isCorrect).length;
    }

    const totalQ = totalQuestions || (lesson.questions ? lesson.questions.length : 1);
    correctCount = Math.min(correctCount, totalQ);
    const score = Math.round((correctCount / totalQ) * 100);

    const maxPossibleXp = lesson.xpReward || 15;
    const xpEarned = Math.round((score / 100) * maxPossibleXp);

    const incorrectCount = Math.max(0, totalQ - correctCount);
    
    // Extract weak vocabulary and weak grammar from incorrect answers
    let weakWords = [];
    let weakGrammar = [];

    answers.forEach((ans) => {
      if (!ans.isCorrect) {
        const q = ans.question || (lesson.questions && lesson.questions[ans.questionIndex]);
        if (q) {
          if (lesson.category === 'Vocabulary' || q.category === 'Vocabulary' || q.type === 'multiple-choice') {
            const word = q.correctAnswer || q.prompt;
            if (word && typeof word === 'string' && word.length < 50) {
              weakWords.push(word.trim());
            }
          }
          if (lesson.category === 'Grammar' || q.category === 'Grammar' || q.type === 'fill-blank') {
            const concept = lesson.title || q.prompt;
            if (concept && typeof concept === 'string' && concept.length < 100) {
              weakGrammar.push(concept.trim());
            }
          }
        }
      }
    });

    // Update user learning analytics
    const user = await findUserById(userId.toString());
    if (user) {
      let currentWeakWords = user.weakVocabulary || [];
      let currentWeakGrammar = user.weakGrammar || [];

      weakWords.forEach(w => {
        if (!currentWeakWords.includes(w)) {
          currentWeakWords.push(w);
        }
      });
      weakGrammar.forEach(g => {
        if (!currentWeakGrammar.includes(g)) {
          currentWeakGrammar.push(g);
        }
      });

      if (currentWeakWords.length > 50) currentWeakWords = currentWeakWords.slice(-50);
      if (currentWeakGrammar.length > 50) currentWeakGrammar = currentWeakGrammar.slice(-50);

      await updateUser(userId.toString(), {
        weakVocabulary: currentWeakWords,
        weakGrammar: currentWeakGrammar
      });
    }

    const updatedUser = await submitLessonProgress(userId.toString(), lessonId, score, xpEarned, {
      incorrectCount,
      minutesPracticed: Math.max(2, Math.ceil(totalQ * 0.75))
    });

    res.status(200).json({
      success: true,
      score,
      xpEarned,
      gemsEarned: score >= 80 ? 15 : 5,
      heartsLost: incorrectCount,
      user: updatedUser,
      message: score >= 80 ? 'Great job!' : 'Keep practicing!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get dashboard/path state for current user
// @route  GET /api/learning-state
export const getLearningState = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const state = await buildLearningState(userId.toString());
    res.status(200).json({ success: true, ...state });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Claim a completed daily quest
// @route  POST /api/quests/:id/claim
export const claimDailyQuest = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const state = await buildLearningState(userId.toString());
    const quest = state.quests.find(q => q.id === req.params.id);
    if (!quest) return res.status(404).json({ success: false, message: 'Quest not found' });
    if (!quest.completed) return res.status(400).json({ success: false, message: 'Quest is not complete yet' });
    if (quest.claimed) return res.status(400).json({ success: false, message: 'Quest already claimed' });

    const claimedQuestIds = [...(state.user.dailyQuestState?.claimedQuestIds || []), quest.id];
    const updatedUser = await updateUser(userId.toString(), {
      xp: (state.user.xp || 0) + quest.xpReward,
      gems: (state.user.gems || 0) + quest.gemsReward,
      dailyQuestState: { ...state.user.dailyQuestState, claimedQuestIds }
    });

    res.status(200).json({
      success: true,
      xpEarned: quest.xpReward,
      gemsEarned: quest.gemsReward,
      user: updatedUser,
      message: 'Quest reward claimed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get leaderboard (top 10 by XP)
// @route  GET /api/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const leaders = await getGlobalLeaderboard();
    const userRank = leaders.findIndex(l => (l._id || l.username) === (userId.toString() || req.user.username)) + 1;

    res.status(200).json({
      success: true,
      leaders,
      userRank: userRank > 0 ? userRank : leaders.length + 1
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get practice questions (random review from completed lessons)
// @route  GET /api/practice/recommend
export const getPracticeSession = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId.toString());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const language = user.targetLanguage || 'Spanish';
    const level = user.difficultyLevel || user.skillLevel || 'Beginner';
    const weakVocabulary = user.weakVocabulary || [];
    const weakGrammar = user.weakGrammar || [];
    const recentQuestions = user.recentQuestions || [];

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (apiKey && !apiKey.includes('your_')) {
      const systemPrompt = `You are a professional language tutor for LingoLeap.
Generate exactly 10 fresh, high-quality, and interactive practice questions for a student.
Student profile:
- Target Language: ${language}
- Skill Level: ${level} (Beginner, Intermediate, Advanced)
- Weak vocabulary words/phrases: ${JSON.stringify(weakVocabulary)}
- Weak grammar topics/concepts: ${JSON.stringify(weakGrammar)}

Avoid generating questions similar to these recently served questions:
${JSON.stringify(recentQuestions)}

You MUST generate a balanced mix of 10 exercises covering these types:
1. Vocabulary (matching, translations, meaning)
2. Grammar (tenses, agreement, prepositions)
3. Translation (phrases/sentences translating to/from English)
4. Sentence Building (sentence reconstruction, selecting words)
5. Conversation Practice (choose natural responses to dialogue)
6. Reading Comprehension (answer a question about a short text passage)
7. Listening Exercises (simulated audio - prompt like "Listen and select: [phrase]" and asking for meaning)
8. Real-Life Scenarios (restaurant, airport, hotel, shopping, travel, job interview)

Difficulty requirements:
- Beginner: basic vocabulary, short simple sentences, present tense.
- Intermediate: broader vocabulary, multiple tenses (past, future, conditional), more descriptive sentences.
- Advanced: complex grammatical structures, formal/informal registers, idioms, fluent paragraphs.

Spaced Repetition instruction:
If the user has weak vocabulary or weak grammar items, ensure at least 3-4 questions target these items to reinforce learning.

You MUST reply strictly with a JSON object. Do not wrap the JSON in markdown code blocks (\`\`\`json ... \`\`\`).
The JSON object must have a single key "questions" containing an array of objects. Each question object must contain:
1. "type": one of "Vocabulary", "Grammar", "Translation", "Sentence Building", "Conversation", "Reading", "Listening", "Scenario"
2. "prompt": (string) instructions or sentence to act on
3. "options": (array of strings) EXACTLY 4 choices. Provide options for multiple-choice exercises.
4. "correctAnswer": (string) the correct answer (must be one of the options).
5. "lessonTitle": (string) e.g., "Practice: Vocabulary" or "Smart Review: [Weak Topic]"
`;

      const contents = [{ role: 'user', parts: [{ text: `Generate 10 practice questions for ${language} at ${level} level.` }] }];
      try {
        const result = await callAIService(contents, systemPrompt);
        if (result.ok) {
          let text = result.text.trim();
          if (text.startsWith('```')) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          }
          const parsed = JSON.parse(text);
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            // Shuffle answers and randomize correct answer positions programmatically to prevent patterns
            parsed.questions.forEach(q => {
              if (q.options && Array.isArray(q.options) && q.options.length > 0) {
                // Ensure correct answer is inside the choices list
                if (!q.options.includes(q.correctAnswer)) {
                  q.options[0] = q.correctAnswer;
                }
                // Deduplicate options
                q.options = Array.from(new Set(q.options));
                // Fill if less than 4 options (safety precaution)
                while (q.options.length < 4) {
                  q.options.push(`Option ${q.options.length + 1}`);
                }
                // Random shuffle
                q.options.sort(() => Math.random() - 0.5);
              }
            });

            // Update user's recently served questions to avoid duplicates in the future
            const newPrompts = parsed.questions.map(q => q.prompt).filter(Boolean);
            let updatedRecent = [...recentQuestions, ...newPrompts];
            if (updatedRecent.length > 30) {
              updatedRecent = updatedRecent.slice(-30);
            }
            await updateUser(userId.toString(), { recentQuestions: updatedRecent });

            return res.status(200).json({ success: true, questions: parsed.questions });
          }
        }
      } catch (aiError) {
        console.error('[AI Practice Session Generation Error - falling back to DB]:', aiError);
      }
    }

    // Database Fallback: Pick questions from user's lessons and enforce shuffling + randomized answer positions
    const allLessons = await findLessonsByLanguage(language);
    const completedIds = await getCompletedLessons(userId.toString());
    const completedLessons = allLessons.filter(l => completedIds.includes(l._id.toString()));

    let candidateQuestions = [];
    const sourceLessons = completedLessons.length > 0 ? completedLessons : allLessons;

    sourceLessons.forEach(lesson => {
      const qList = lesson.questions || [];
      qList.forEach(question => {
        const qObj = typeof question.toObject === 'function' ? question.toObject() : JSON.parse(JSON.stringify(question));
        candidateQuestions.push({ ...qObj, lessonTitle: lesson.title });
      });
    });

    // Anti-repetition: Filter out recently used questions if we have plenty of candidates
    let filteredQuestions = candidateQuestions.filter(q => !recentQuestions.includes(q.prompt));
    if (filteredQuestions.length < 5) {
      filteredQuestions = candidateQuestions; // Fallback if user hasn't completed enough to avoid overlap
    }

    // Shuffle candidates and pick 10
    let practiceQuestions = filteredQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

    // Fallback if no questions are available at all
    if (practiceQuestions.length === 0 && allLessons.length > 0) {
      practiceQuestions = (allLessons[0].questions || []).map(q => {
        const qObj = typeof q.toObject === 'function' ? q.toObject() : JSON.parse(JSON.stringify(q));
        return { ...qObj, lessonTitle: allLessons[0].title };
      }).slice(0, 5);
    }

    // Programmatically shuffle options and randomize correct answer positions
    practiceQuestions.forEach(q => {
      if (q.options && Array.isArray(q.options) && q.options.length > 0) {
        if (!q.options.includes(q.correctAnswer)) {
          q.options.push(q.correctAnswer);
        }
        q.options = Array.from(new Set(q.options)).sort(() => Math.random() - 0.5);
      }
    });

    // Update user's recently served questions for anti-repetition tracking
    const newPrompts = practiceQuestions.map(q => q.prompt).filter(Boolean);
    let updatedRecent = [...recentQuestions, ...newPrompts];
    if (updatedRecent.length > 30) {
      updatedRecent = updatedRecent.slice(-30);
    }
    await updateUser(userId.toString(), { recentQuestions: updatedRecent });

    res.status(200).json({ success: true, questions: practiceQuestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get public onboarding content configurations
// @route  GET /api/lessons/onboarding-content
export const getOnboardingContentPublic = (req, res) => {
  try {
    const ONBOARDING_FILE_PATH = path.join(process.cwd(), 'server/data/onboarding.json');
    if (fs.existsSync(ONBOARDING_FILE_PATH)) {
      const raw = fs.readFileSync(ONBOARDING_FILE_PATH, 'utf-8');
      const content = JSON.parse(raw);
      return res.status(200).json({ success: true, onboarding: content });
    } else {
      // Return hardcoded values as fallback if file doesn't exist
      return res.status(200).json({
        success: true,
        onboarding: {
          nativeLanguages: [
            { name: 'English', flag: '🇬🇧' },
            { name: 'Spanish', flag: '🇪🇸' },
            { name: 'French', flag: '🇫🇷' },
            { name: 'German', flag: '🇩🇪' },
            { name: 'Arabic', flag: '🇸🇦' },
            { name: 'Chinese', flag: '🇨🇳' },
            { name: 'Italian', flag: '🇮🇹' },
            { name: 'Japanese', flag: '🇯🇵' },
            { name: 'Portuguese', flag: '🇵🇹' }
          ],
          targetLanguages: [
            { name: 'English', flag: '🇬🇧', desc: 'Global communication' },
            { name: 'Spanish', flag: '🇪🇸', desc: 'Vibrant cultures' },
            { name: 'French', flag: '🇫🇷', desc: 'Art & romance' },
            { name: 'German', flag: '🇩🇪', desc: 'Science & business' },
            { name: 'Arabic', flag: '🇸🇦', desc: 'Rich heritage' },
            { name: 'Italian', flag: '🇮🇹', desc: 'History & cuisine' }
          ],
          learningGoals: [
            { id: 'Travel', label: '✈️ Travel & Culture', desc: 'Order food, ask directions, connect with locals' },
            { id: 'School', label: '🏫 School & Studies', desc: 'Ace exams, write essays, build academic skills' },
            { id: 'Business', label: '💼 Career & Business', desc: 'Negotiations, emails, international career growth' },
            { id: 'Exams', label: '📝 Language Certification', desc: 'Prepare for DELE, DELF, TOEFL, etc.' },
            { id: 'Casual Conversation', label: '💬 Casual Conversation', desc: 'Chat naturally with friends and family' }
          ],
          dailyGoals: [
            { id: '5 min', label: '⚡ 5 min / day (Casual)', desc: 'Easy progress, zero pressure', xp: 10 },
            { id: '10 min', label: '🔥 10 min / day (Regular)', desc: 'Steady building block', xp: 20 },
            { id: '15 min', label: '🏆 15 min / day (Serious)', desc: 'Excellent daily habit', xp: 30 },
            { id: '30 min', label: '👑 30 min / day (Insane)', desc: 'Rapid skill acquisition', xp: 50 },
            { id: '60 min', label: '🚀 60 min / day (Hardcore)', desc: 'Complete immersion', xp: 100 }
          ],
          placementLevels: [
            { id: 'Beginner', label: 'Beginner', desc: 'I am starting from scratch, learning basic words' },
            { id: 'Intermediate', label: 'Intermediate', desc: 'I can form sentences and handle simple chats' },
            { id: 'Advanced', label: 'Advanced', desc: 'I can read complex articles and converse fluently' }
          ]
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get AI-generated profile insights
// @route  GET /api/learning/profile-insights
export const getProfileInsights = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const language = user.targetLanguage || 'Spanish';
    const level = user.difficultyLevel || user.skillLevel || 'Beginner';
    const weakVocabulary = user.weakVocabulary || [];
    const weakGrammar = user.weakGrammar || [];
    const xp = user.xp || 0;
    const streak = user.streakCount || 0;

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.includes('your_')) {
      const systemPrompt = `You are LingoLeap's AI Analytics Engine. Generate learning insights for a student.
Student profile:
- Target Language: ${language}
- Skill Level: ${level}
- Total XP: ${xp}
- Current Streak: ${streak} days
- Weak vocabulary tracked: ${JSON.stringify(weakVocabulary)}
- Weak grammar tracked: ${JSON.stringify(weakGrammar)}

Generate:
1. "weakAreas": A list of 2-3 specific language weaknesses or advice based on their profile.
2. "strongAreas": A list of 2-3 specific language strengths based on their XP/level/profile.
3. "recommendations": A list of 2 suggested specific lesson topics or learning activities they should focus on next.

You MUST reply strictly with a JSON object. Do not wrap the JSON in markdown code blocks (\`\`\`json ... \`\`\`).
The JSON object must have keys: "weakAreas" (array of strings), "strongAreas" (array of strings), "recommendations" (array of strings).
`;

      const contents = [{ role: 'user', parts: [{ text: `Analyze profile stats and return insights.` }] }];
      try {
        const result = await callAIService(contents, systemPrompt);
        if (result.ok) {
          let text = result.text.trim();
          if (text.startsWith('```')) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
          }
          const parsed = JSON.parse(text);
          return res.status(200).json({ success: true, insights: parsed });
        }
      } catch (aiErr) {
        console.error('[AI Profile Insights Error]:', aiErr);
      }
    }

    // Dynamic database-driven fallback if AI is offline
    const fallbackInsights = {
      weakAreas: [
        weakVocabulary.length > 0 ? `Vocabulary terms like: ${weakVocabulary.slice(0, 3).join(', ')}` : "No vocabulary errors tracked yet. Keep studying!",
        weakGrammar.length > 0 ? `Grammar concepts: ${weakGrammar.slice(0, 2).join(', ')}` : "Grammar understanding is stable. Keep practicing!"
      ],
      strongAreas: [
        `Target language immersion in ${language}`,
        `Regular practice habits (Level ${user.level} achieved)`
      ],
      recommendations: [
        "Head over to the Practice tab to run custom generated reviews",
        `Review the next unlocked lesson in the ${language} path`
      ]
    };
    res.status(200).json({ success: true, insights: fallbackInsights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Restore a lost streak using 50 gems
// @route  POST /api/learning/restore-streak
export const restoreStreak = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const lostStreakVal = user.lostStreak || 0;
    if (lostStreakVal <= 0) {
      return res.status(400).json({ success: false, message: 'No streak to restore.' });
    }

    const cost = 50;
    const currentGems = user.gems || 0;
    if (currentGems < cost) {
      return res.status(400).json({ success: false, message: `Not enough gems. You need ${cost} gems to restore your streak.` });
    }

    const updatedUser = await updateUser(userId.toString(), {
      gems: currentGems - cost,
      streakCount: lostStreakVal,
      lostStreak: 0
    });

    res.status(200).json({
      success: true,
      message: `Streak of ${lostStreakVal} days successfully restored!`,
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
