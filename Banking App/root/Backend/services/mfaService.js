'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Multi-Factor Authentication Service
 * Handles OTP generation and delivery via multiple channels.
 */

// ── Email transporter (lazy-initialized) ──
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  // Use SMTP settings from environment, or default to Ethereal test account
  if (config.SMTP_HOST) {
    _transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
      }
    });
  } else {
    logger.warn('[MFA] No SMTP configured — OTP will only be logged to console.');
    _transporter = null;
  }

  return _transporter;
}

/**
 * Generate a 6-digit OTP code.
 * @returns {string}
 */
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send an OTP via email using nodemailer.
 * @param {string} email - Recipient email address
 * @param {string} otp - The 6-digit code
 * @param {object} [user] - Optional user info for personalisation
 * @returns {Promise<boolean>}
 */
async function sendEmailOTP(email, otp, user) {
  const transporter = getTransporter();

  if (!transporter) {
    logger.info(`[MFA EMAIL] To: ${email} | OTP: ${otp} | (skipped — no SMTP configured)`);
    return false;
  }

  const firstName = user?.first_name || 'Valued Customer';
  const appName = 'Apex Banking';

  const mailOptions = {
    from: `"${appName} Security" <${config.SMTP_FROM || 'noreply@apexbank.com'}>`,
    to: email,
    subject: `Your ${appName} One-Time Passcode (OTP)`,
    text: `Hello ${firstName},

Your one-time passcode for ${appName} is: ${otp}

This code expires in 5 minutes. If you did not request this, please ignore this message.

Regards,
${appName} Security Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ff9800; margin: 0; font-size: 20px;">${appName}</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
          <p style="color: #334155; font-size: 14px;">Hello <strong>${firstName}</strong>,</p>
          <p style="color: #475569; font-size: 14px;">Your one-time passcode is:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0; letter-spacing: 8px; font-size: 28px; font-weight: bold; color: #1e293b; font-family: monospace;">
            ${otp}
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code expires in 5 minutes. If you did not request this, please ignore this message.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">${appName} Security Team</p>
        </div>
      </div>`
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`[MFA EMAIL] OTP sent successfully to ${email}`);
    return true;
  } catch (err) {
    logger.error(`[MFA EMAIL] Failed to send to ${email}: ${err.message}`);
    // Fallback: log to console
    logger.info(`[MFA EMAIL FALLBACK] To: ${email} | OTP: ${otp}`);
    return false;
  }
}

/**
 * Send OTP via simulated SMS (console-only, no real SMS gateway).
 * In production, replace this with Twilio / AWS SNS / etc.
 * @param {string} phone
 * @param {string} otp
 */
function logSMSOTP(phone, otp) {
  logger.info(`[SMS SIMULATOR] OTP ${otp} sent to ${phone}`);
}

/**
 * Dispatch OTP to the user via all available channels.
 * @param {object} user - { email, phone, first_name }
 * @param {string} otp - The 6-digit code
 */
async function dispatchOTP(user, otp) {
  // Always log to console (SMS simulation)
  logSMSOTP(user.phone, otp);

  // Attempt email delivery if email is available
  if (user.email) {
    await sendEmailOTP(user.email, otp, user);
  }
}

module.exports = {
  generateOTP,
  sendEmailOTP,
  logSMSOTP,
  dispatchOTP
};