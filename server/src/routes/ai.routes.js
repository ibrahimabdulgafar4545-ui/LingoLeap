import express from 'express';
import { 
  startSession, 
  sendMessageToSession, 
  completeSession, 
  getUserSessions, 
  getUserStats, 
  testGeminiConnection,
  chatDirect,
  grammarCheckDirect,
  vocabularyHelpDirect,
  pronunciationHelpDirect,
  evaluatePronunciation,
  getPronunciationHistory
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/chat', protect, chatDirect);
router.post('/grammar-check', protect, grammarCheckDirect);
router.post('/vocabulary-help', protect, vocabularyHelpDirect);
router.post('/pronunciation-help', protect, pronunciationHelpDirect);
router.post('/pronunciation/evaluate', protect, evaluatePronunciation);
router.get('/pronunciation/history', protect, getPronunciationHistory);

router.post('/session/start', protect, startSession);
router.post('/session/:sessionId/message', protect, sendMessageToSession);
router.post('/session/:sessionId/complete', protect, completeSession);
router.get('/sessions', protect, getUserSessions);
router.get('/stats', protect, getUserStats);
router.get('/test', testGeminiConnection); // Public — no auth required

export default router;
