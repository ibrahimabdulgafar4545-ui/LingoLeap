import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyEmailCode,
  completeOnboarding,
  changePassword,
  logoutAllDevices
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update', protect, updateProfile);
router.get('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.post('/logout-all', protect, logoutAllDevices);

// Email verification
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email', verifyEmailCode);
router.post('/resend-verification', resendVerification);
router.post('/onboarding', protect, completeOnboarding);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
