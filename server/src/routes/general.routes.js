import express from 'express';
import { getLeaderboard, getPracticeSession, getLearningState, claimDailyQuest, getProfileInsights, restoreStreak } from '../controllers/learning.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/leaderboard', protect, getLeaderboard);
router.get('/practice/recommend', protect, getPracticeSession);
router.get('/learning/profile-insights', protect, getProfileInsights);
router.get('/learning-state', protect, getLearningState);
router.post('/quests/:id/claim', protect, claimDailyQuest);
router.post('/learning/restore-streak', protect, restoreStreak);

export default router;
