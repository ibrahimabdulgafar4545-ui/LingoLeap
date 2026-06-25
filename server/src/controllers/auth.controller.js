import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  updateUser,
  findUserByVerificationToken,
  findUserByResetToken,
  updateUserPassword,
  verifyUserEmail,
  setUserVerificationToken,
  setUserResetToken,
  isFallbackMode,
  readJsonDb,
  writeJsonDb
} from '../services/db.service.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail
} from '../services/email.service.js';

const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: (user._id || user.id).toString() },
    process.env.JWT_SECRET || 'lingoleap_super_secret_jwt_key_123!',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };

  // Strip password from response
  const userObj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete userObj.password;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token, user: userObj });
};

// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { username, email, password, targetLanguage } = req.body;

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Generate 6-digit code (expires in 10 minutes)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await createUser({
      username,
      email,
      password,
      targetLanguage: targetLanguage || 'Spanish',
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
      emailVerified: false,
      emailVerificationToken: verifyCode,
      emailVerificationExpire: verifyExpire
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(email, verifyCode, username).catch(err =>
      console.error('Verification email failed:', err.message)
    );

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Your account has been banned. Please contact administration.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user._id || req.user.id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/auth/update
export const updateProfile = async (req, res) => {
  try {
    const {
      username, email, avatarUrl, bio, country,
      nativeLanguage, targetLanguage, websiteLanguage,
      dailyGoalXp, reminderTime, difficultyLevel,
      privacy, settingsNotifications, twoFactorAuth,
      hearts, gems, xp, streakCount
    } = req.body;

    const fieldsToUpdate = {};
    if (username !== undefined) fieldsToUpdate.username = username;
    if (email !== undefined) fieldsToUpdate.email = email;
    if (avatarUrl !== undefined) fieldsToUpdate.avatarUrl = avatarUrl;
    if (bio !== undefined) fieldsToUpdate.bio = bio;
    if (country !== undefined) fieldsToUpdate.country = country;
    if (nativeLanguage !== undefined) fieldsToUpdate.nativeLanguage = nativeLanguage;
    if (targetLanguage !== undefined) fieldsToUpdate.targetLanguage = targetLanguage;
    if (websiteLanguage !== undefined) fieldsToUpdate.websiteLanguage = websiteLanguage;
    if (dailyGoalXp !== undefined) fieldsToUpdate.dailyGoalXp = Number(dailyGoalXp);
    if (reminderTime !== undefined) fieldsToUpdate.reminderTime = reminderTime;
    if (difficultyLevel !== undefined) fieldsToUpdate.difficultyLevel = difficultyLevel;
    if (privacy !== undefined) fieldsToUpdate.privacy = privacy;
    if (settingsNotifications !== undefined) fieldsToUpdate.settingsNotifications = settingsNotifications;
    if (twoFactorAuth !== undefined) fieldsToUpdate.twoFactorAuth = twoFactorAuth;
    
    // Add gamified state fields
    if (hearts !== undefined) fieldsToUpdate.hearts = hearts;
    if (gems !== undefined) fieldsToUpdate.gems = Number(gems);
    if (xp !== undefined) fieldsToUpdate.xp = Number(xp);
    if (streakCount !== undefined) fieldsToUpdate.streakCount = Number(streakCount);

    const userId = req.user._id || req.user.id;
    const user = await updateUser(userId, fieldsToUpdate);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/logout
export const logout = async (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @route GET /api/auth/verify-email/:token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is missing' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await findUserByVerificationToken(hashedToken);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification link. Please request a new one.' });
    }

    await verifyUserEmail(user._id || user.id);

    return res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('verifyEmail error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      // Respond with same message to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If that email is registered and unverified, a new code has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'This email address is already verified.' });
    }

    // Generate 6-digit verification code (expires in 10 minutes)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await setUserVerificationToken(user._id || user.id, verifyCode, verifyExpire);

    await sendVerificationEmail(user.email, verifyCode, user.username);

    return res.status(200).json({
      success: true,
      message: 'If that email is registered and unverified, a new code has been sent.'
    });
  } catch (error) {
    console.error('resendVerification error:', error);
    res.status(500).json({ success: false, message: 'Could not send email. Please try again.' });
  }
};

// @route POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const user = await findUserByEmail(email);

    // Always respond with the same message to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a reset link has been sent.'
      });
    }

    const resetRawToken = crypto.randomBytes(32).toString('hex');
    const resetHashedToken = crypto.createHash('sha256').update(resetRawToken).digest('hex');
    const resetExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await setUserResetToken(user._id || user.id, resetHashedToken, resetExpire);

    await sendPasswordResetEmail(user.email, resetRawToken, user.username);

    res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.'
    });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Email could not be sent. Try again later.' });
  }
};

// @route POST /api/auth/reset-password or /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const token = req.params.token || req.body.token || req.query.token;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Reset token is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await findUserByResetToken(hashedToken);

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const updatedUser = await updateUserPassword(user._id || user.id, password);

    sendTokenResponse(updatedUser, 200, res);
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/verify-email
export const verifyEmailCode = async (req, res) => {
  try {
    const { code, email } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required.' });
    }

    let user;
    // Check if authenticated
    if (req.user) {
      user = await findUserById(req.user._id || req.user.id);
    } else if (email) {
      user = await findUserByEmail(email);
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, message: 'This email address is already verified.' });
    }

    if (user.emailVerificationToken !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const expireTime = new Date(user.emailVerificationExpire).getTime();
    if (expireTime < Date.now()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    const updatedUser = await updateUser(user._id || user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpire: null
    });

    // Send welcome email upon successful verification (non-blocking)
    sendWelcomeEmail(user.email, user.username).catch(err =>
      console.error('Welcome email failed:', err.message)
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully!',
      user: updatedUser 
    });
  } catch (error) {
    console.error('verifyEmailCode error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/onboarding
export const completeOnboarding = async (req, res) => {
  try {
    const { nativeLanguage, targetLanguage, learningGoal, dailyGoal, skillLevel } = req.body;
    const userId = req.user._id || req.user.id;

    const fieldsToUpdate = {
      isOnboarded: true
    };
    if (nativeLanguage) fieldsToUpdate.nativeLanguage = nativeLanguage;
    if (targetLanguage) fieldsToUpdate.targetLanguage = targetLanguage;
    if (learningGoal) fieldsToUpdate.learningGoal = learningGoal;
    
    if (dailyGoal) {
      let xpGoal = 20;
      if (dailyGoal.includes('5')) xpGoal = 10;
      else if (dailyGoal.includes('10')) xpGoal = 20;
      else if (dailyGoal.includes('15')) xpGoal = 30;
      else if (dailyGoal.includes('30')) xpGoal = 50;
      else if (dailyGoal.includes('60')) xpGoal = 100;
      fieldsToUpdate.dailyGoalXp = xpGoal;
    }
    
    if (skillLevel) fieldsToUpdate.skillLevel = skillLevel;

    const updatedUser = await updateUser(userId, fieldsToUpdate);
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('completeOnboarding error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Change user password
// @route  POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id || req.user.id;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (isFallbackMode()) {
      const db = readJsonDb();
      const index = db.users.findIndex(u => u._id === userId.toString());
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const isMatch = await bcrypt.compare(currentPassword, db.users[index].password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      const salt = await bcrypt.genSalt(10);
      db.users[index].password = await bcrypt.hash(newPassword, salt);
      writeJsonDb(db);
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } else {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }

      user.password = newPassword;
      await user.save();
      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Logout from all other sessions
// @route  POST /api/auth/logout-all
export const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Clear sessions except current
    const fieldsToUpdate = {
      activeSessions: [
        { id: new mongoose.Types.ObjectId().toString(), device: 'Desktop (Current)', browser: 'Chrome', ip: req.ip || '127.0.0.1', lastActive: new Date().toISOString() }
      ]
    };
    
    await updateUser(userId, fieldsToUpdate);
    
    // Clear token cookie to force re-login on current too if needed, or keep logged in on current
    res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
    res.status(200).json({ success: true, message: 'Logged out from all other devices successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
