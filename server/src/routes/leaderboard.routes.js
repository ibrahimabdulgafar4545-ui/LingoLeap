import express from 'express';
import { getCurrentLeague, getFriendsLeaderboard, processWeeklyReset } from '../controllers/leaderboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.get('/current', getCurrentLeague);
router.get('/friends', getFriendsLeaderboard);
router.post('/process-weekly', processWeeklyReset);

export default router;
