import { BrevoClient } from '@getbrevo/brevo';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Brevo Transactional Email API client
 * Uses BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME from environment variables
 */
const apiInstance = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY || 'dummy_key'
});

const SENDER = {
  name: process.env.BREVO_SENDER_NAME || 'LingoLeap',
  email: process.env.BREVO_SENDER_EMAIL,
};

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Verify the Brevo API key is set (called at server startup)
 */
export const verifyEmailTransporter = () => {
  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    console.error('❌ Brevo config missing: check BREVO_API_KEY and BREVO_SENDER_EMAIL in .env');
  } else {
    console.log(`✅ Brevo Transactional Email API is configured (sender: ${process.env.BREVO_SENDER_EMAIL})`);
  }
};

/**
 * Generic send-email helper using the Brevo SDK
 */
export const sendEmail = async ({ to, name = '', subject, html }) => {
  const response = await apiInstance.transactionalEmails.sendTransacEmail({
    sender: SENDER,
    to: [{ email: to, name }],
    subject,
    htmlContent: html
  });
  console.log(`📧 Brevo email sent to ${to} | Subject: "${subject}" | MessageID: ${response.messageId || response.body?.messageId}`);
  return response;
};

/* ─────────────────────────────────────────────────────────────
   Shared template wrapper
   ───────────────────────────────────────────────────────────── */

const wrapTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>LingoLeap</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Card -->
        <table width="100%" style="max-width:560px;background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:20px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);box-shadow:0 25px 60px rgba(0,0,0,0.5);">

          <!-- Header Band -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">🌍</div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Lingo<span style="color:#a5f3fc;">Leap</span></h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Language Learning Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;">© ${new Date().getFullYear()} LingoLeap. All rights reserved.</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.2);font-size:11px;">This is an automated message — please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const primaryButton = (href, label) => `
  <table cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
    <tr>
      <td align="center" style="border-radius:12px;background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:0;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:12px;letter-spacing:0.3px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

const fallbackLink = (href) => `
  <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:20px 0 0;text-align:center;word-break:break-all;">
    Or copy this link: <a href="${href}" style="color:#818cf8;">${href}</a>
  </p>
`;

/* ─────────────────────────────────────────────────────────────
   1. Welcome Email
   ───────────────────────────────────────────────────────────── */

export const sendWelcomeEmail = async (to, name = 'there') => {
  const html = wrapTemplate(`
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;font-weight:700;">Welcome aboard, ${name}! 🎉</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
      Your LingoLeap account is ready. Start your language learning journey today — explore lessons, earn XP, and level up your skills!
    </p>
    <!-- Stats Row -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="text-align:center;background:rgba(79,70,229,0.15);border-radius:12px;padding:16px 8px;border:1px solid rgba(79,70,229,0.2);">
          <div style="font-size:24px;">🔥</div>
          <div style="color:#a5f3fc;font-size:13px;font-weight:600;margin-top:4px;">Daily Streaks</div>
        </td>
        <td width="12"></td>
        <td style="text-align:center;background:rgba(79,70,229,0.15);border-radius:12px;padding:16px 8px;border:1px solid rgba(79,70,229,0.2);">
          <div style="font-size:24px;">⭐</div>
          <div style="color:#a5f3fc;font-size:13px;font-weight:600;margin-top:4px;">Earn XP</div>
        </td>
        <td width="12"></td>
        <td style="text-align:center;background:rgba(79,70,229,0.15);border-radius:12px;padding:16px 8px;border:1px solid rgba(79,70,229,0.2);">
          <div style="font-size:24px;">🏆</div>
          <div style="color:#a5f3fc;font-size:13px;font-weight:600;margin-top:4px;">Leaderboard</div>
        </td>
      </tr>
    </table>
    ${primaryButton(`${CLIENT_URL}/dashboard`, '🚀 Start Learning Now')}
    <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:24px 0 0;text-align:center;">
      Happy learning! 🌍 The LingoLeap Team
    </p>
  `);

  return sendEmail({ to, name, subject: '🎉 Welcome to LingoLeap — Your journey starts now!', html });
};

/* ─────────────────────────────────────────────────────────────
   2. Email Verification Service
   ───────────────────────────────────────────────────────────── */

export const sendVerificationEmail = async (to, code, name = 'there') => {
  const html = wrapTemplate(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(135deg,rgba(79,70,229,0.2),rgba(124,58,237,0.2));border-radius:50%;border:2px solid rgba(79,70,229,0.4);font-size:30px;">✉️</div>
    </div>
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;font-weight:700;text-align:center;">Verify your email address</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 8px;text-align:center;">
      Hi <strong style="color:#a5f3fc;">${name}</strong>,
    </p>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;margin:0 0 20px;text-align:center;">
      Thanks for signing up! Please enter the 6-digit verification code below to verify your account.
    </p>
    <div style="text-align:center;margin:30px 0;">
      <span style="display:inline-block;background:rgba(255,255,255,0.08);border:2px solid rgba(99,102,241,0.5);border-radius:12px;padding:16px 32px;font-size:36px;font-weight:800;letter-spacing:6px;color:#ffffff;box-shadow:0 0 20px rgba(99,102,241,0.3);">${code}</span>
    </div>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.7;margin:0;text-align:center;">
      This code expires in <strong style="color:#fbbf24;">10 minutes</strong>.
    </p>
    <p style="color:rgba(255,255,255,0.35);font-size:12px;margin:24px 0 0;text-align:center;">
      If you didn't create a LingoLeap account, you can safely ignore this email.
    </p>
  `);

  return sendEmail({ to, name, subject: `🔑 ${code} is your LingoLeap verification code`, html });
};

/* ─────────────────────────────────────────────────────────────
   3. Password Reset Email Service
   ───────────────────────────────────────────────────────────── */

export const sendPasswordResetEmail = async (to, token, name = 'there') => {
  const resetUrl = `${CLIENT_URL}/reset-password/${token}`;

  const html = wrapTemplate(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.15));border-radius:50%;border:2px solid rgba(239,68,68,0.35);font-size:30px;">🔐</div>
    </div>
    <h2 style="margin:0 0 12px;color:#ffffff;font-size:22px;font-weight:700;text-align:center;">Reset your password</h2>
    <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 8px;text-align:center;">
      Hi <strong style="color:#a5f3fc;">${name}</strong>,
    </p>
    <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;margin:0;text-align:center;">
      We received a request to reset the password for your LingoLeap account. Click the button below to choose a new password.
    </p>
    <!-- Warning box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:14px 18px;">
          <p style="margin:0;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6;">
            ⏱️ This link expires in <strong style="color:#fbbf24;">1 hour</strong>.<br/>
            🔒 If you didn't request this, you can safely ignore this email — your password will remain unchanged.
          </p>
        </td>
      </tr>
    </table>
    ${primaryButton(resetUrl, '🔑 Reset My Password')}
    ${fallbackLink(resetUrl)}
  `);

  return sendEmail({ to, name, subject: '🔐 Reset your LingoLeap password', html });
};
