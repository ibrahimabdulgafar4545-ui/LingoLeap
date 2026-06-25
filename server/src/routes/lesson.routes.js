import express from 'express';
import { getLessons, getLessonById, submitLesson, getLeaderboard, getPracticeSession, getOnboardingContentPublic } from '../controllers/learning.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/onboarding-content', protect, getOnboardingContentPublic);
router.get('/', protect, getLessons);
router.get('/:id', protect, getLessonById);
router.post('/:id/submit', protect, submitLesson);

export default router;
