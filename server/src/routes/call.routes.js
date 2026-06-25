import express from 'express';
import { logCall, getCallHistory, getMissedCalls } from '../controllers/call.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/history', protect, logCall);
router.get('/history', protect, getCallHistory);
router.get('/missed', protect, getMissedCalls);

export default router;
