'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Register a new user (customer) with personal info, KYC, and initial account.
 */
async function registerUser(personal, account) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const permanentUserId = `APX-${uuidv4().split('-')[0].toUpperCase()}`;
    const passwordHash = await bcrypt.hash(account.password, config.SALT_ROUNDS);
    const accNum = require('../utils/helpers').generateAccountNumber();

    // Check for duplicate username / email / phone / KYC
    const [existing] = await connection.execute(
      `SELECT id FROM users WHERE username = ? OR email = ? OR phone = ? OR kyc_number = ?`,
      [account.username.trim(), personal.email, personal.phone, personal.kyc_number]
    );
    if (existing.length > 0) {
      await connection.rollback();
      const err = new Error('A user with this username, email, phone, or KYC number already exists.');
      err.statusCode = 409;
      throw err;
    }

    await connection.execute(
      `INSERT INTO users (user_id, username, first_name, last_name, email, phone, kyc_type, kyc_number, dob, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [permanentUserId, account.username.trim(), personal.first_name, personal.last_name,
       personal.email, personal.phone, personal.kyc_type, personal.kyc_number, personal.dob, passwordHash]
    );

    const rule = config.BALANCING_MATRIX[account.account_type.toLowerCase()] || config.BALANCING_MATRIX.savings;
    await connection.execute(
      `INSERT INTO accounts (account_number, user_id, account_type, balance, interest_rate, min_balance)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [accNum, permanentUserId, account.account_type.toLowerCase(), rule.minBalance, rule.baseRate, rule.minBalance]
    );

    await connection.commit();

    // Audit log
    await logAudit({
      user_id: permanentUserId,
      action: 'REGISTRATION',
      details: `User registered with ${personal.kyc_type} KYC, account type: ${account.account_type}`,
      ip: null,
      user_agent: null
    }).catch(e => logger.warn('Audit log insert failed (registration)', e.message));

    return { message: 'Registration completed successfully.' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Initiate login — validate credentials and send OTP.
 */
async function initiateLogin(loginHandle, password) {
  const [rows] = await db.execute(
    'SELECT user_id, username, phone, password_hash FROM users WHERE username = ? OR user_id = ? OR phone = ?',
    [loginHandle, loginHandle, loginHandle]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid profile credentials.');
    err.statusCode = 401;
    throw err;
  }

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const err = new Error('Invalid profile credentials.');
    err.statusCode = 401;
    throw err;
  }

  const codeOTP = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = new Date(Date.now() + config.OTP_EXPIRY_MS);
  await db.execute(
    'UPDATE users SET otp_code = ?, otp_expiry = ? WHERE user_id = ?',
    [codeOTP, expiry, user.user_id]
  );

  // Simulate SMS dispatch
  logger.info(`[SMS SIMULATOR] OTP ${codeOTP} sent to ${user.phone}`);

  await logAudit({
    user_id: user.user_id,
    action: 'LOGIN_INITIATE',
    details: 'OTP sent',
    ip: null,
    user_agent: null
  }).catch(e => logger.warn('Audit log insert failed (login initiate)', e.message));

  return { message: 'OTP Sent via SMS.', target_handle: user.username };
}

/**
 * Verify OTP and issue JWT access + refresh tokens.
 */
async function verifyLogin(loginHandle, otpCode) {
  const [rows] = await db.execute(
    'SELECT user_id, username, first_name, last_name, email, role, otp_code, otp_expiry FROM users WHERE username = ?',
    [loginHandle]
  );

  if (rows.length === 0) {
    const err = new Error('Invalid or Expired clearance challenge token access.');
    err.statusCode = 401;
    throw err;
  }

  const user = rows[0];
  if (!user.otp_code || String(user.otp_code).trim() !== String(otpCode).trim()) {
    const err = new Error('Invalid or Expired clearance challenge token access.');
    err.statusCode = 401;
    throw err;
  }

  if (new Date() > new Date(user.otp_expiry)) {
    const err = new Error('Invalid or Expired clearance challenge token access.');
    err.statusCode = 401;
    throw err;
  }

  // Clear OTP
  await db.execute(
    'UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE user_id = ?',
    [user.user_id]
  );

  // Generate tokens
  const tokenPayload = {
    user_id: user.user_id,
    username: user.username,
    role: user.role
  };

  const accessToken = jwt.sign(tokenPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY
  });

  const refreshToken = jwt.sign(
    { ...tokenPayload, tokenId: uuidv4() },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRY }
  );

  // Store refresh token hash in DB for rotation/revocation
  const refreshHash = await bcrypt.hash(refreshToken, 6);
  await db.execute(
    'UPDATE users SET refresh_token_hash = ? WHERE user_id = ?',
    [refreshHash, user.user_id]
  );

  await logAudit({
    user_id: user.user_id,
    action: 'LOGIN_SUCCESS',
    details: `User logged in as ${user.role}`,
    ip: null,
    user_agent: null
  }).catch(e => logger.warn('Audit log insert failed (login verify)', e.message));

  return {
    accessToken,
    refreshToken,
    user: {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      first_name: user.first_name,
      email: user.email
    }
  };
}

/**
 * Refresh access token using a valid refresh token (rotation).
 */
async function refreshTokens(oldRefreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, config.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token.');
    err.statusCode = 401;
    throw err;
  }

  const [rows] = await db.execute(
    'SELECT user_id, username, role, refresh_token_hash FROM users WHERE user_id = ?',
    [decoded.user_id]
  );
  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 401;
    throw err;
  }

  const user = rows[0];
  if (!user.refresh_token_hash) {
    const err = new Error('Refresh token has been revoked.');
    err.statusCode = 401;
    throw err;
  }

  // Verify stored hash matches
  const valid = await bcrypt.compare(oldRefreshToken, user.refresh_token_hash);
  if (!valid) {
    // Possible token reuse — revoke all tokens
    await db.execute('UPDATE users SET refresh_token_hash = NULL WHERE user_id = ?', [user.user_id]);
    const err = new Error('Refresh token reuse detected. All tokens revoked.');
    err.statusCode = 401;
    throw err;
  }

  const tokenPayload = { user_id: user.user_id, username: user.username, role: user.role };
  const newAccessToken = jwt.sign(tokenPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY
  });
  const newRefreshToken = jwt.sign(
    { ...tokenPayload, tokenId: uuidv4() },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.REFRESH_TOKEN_EXPIRY }
  );

  // Rotate: replace stored hash
  const newHash = await bcrypt.hash(newRefreshToken, 6);
  await db.execute(
    'UPDATE users SET refresh_token_hash = ? WHERE user_id = ?',
    [newHash, user.user_id]
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Logout — clear refresh token hash.
 */
async function logoutUser(userId) {
  await db.execute(
    'UPDATE users SET refresh_token_hash = NULL WHERE user_id = ?',
    [userId]
  );

  await logAudit({
    user_id: userId,
    action: 'LOGOUT',
    details: 'User logged out',
    ip: null,
    user_agent: null
  }).catch(e => logger.warn('Audit log insert failed (logout)', e.message));
}

/**
 * Write an audit log entry.
 */
async function logAudit({ user_id, action, details, ip, user_agent }) {
  await db.execute(
    `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, action, details, ip || null, user_agent || null]
  );
}

module.exports = {
  registerUser,
  initiateLogin,
  verifyLogin,
  refreshTokens,
  logoutUser,
  logAudit
};