'use strict';

const authService = require('../services/authService');
const config = require('../config');

/**
 * POST /api/auth/register
 */
async function register(req, res) {
  const { personal, account } = req.body;
  const result = await authService.registerUser(personal, account);
  return res.status(201).json(result);
}

/**
 * POST /api/auth/login/initiate
 */
async function initiateLogin(req, res) {
  const { login_handle, password } = req.body;
  const result = await authService.initiateLogin(login_handle, password);
  return res.status(200).json(result);
}

/**
 * POST /api/auth/login/verify
 * On success, sets HttpOnly cookies for access + refresh tokens.
 */
async function verifyLogin(req, res) {
  const { login_handle, otp_code } = req.body;
  const result = await authService.verifyLogin(login_handle, otp_code);

  const cookieOpts = {
    httpOnly: true,
    sameSite: 'Strict',
    secure: config.NODE_ENV === 'production',
    path: '/'
  };

  res.cookie('accessToken', result.accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOpts,
    maxAge: config.REFRESH_TOKEN_COOKIE_EXPIRY_MS,
    path: '/api/auth/refresh'
  });

  return res.status(200).json({
    user: result.user
  });
}

/**
 * POST /api/auth/refresh
 */
async function refreshToken(req, res) {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({ message: 'Refresh token not provided.' });
  }

  const result = await authService.refreshTokens(oldRefreshToken);

  const cookieOpts = {
    httpOnly: true,
    sameSite: 'Strict',
    secure: config.NODE_ENV === 'production',
    path: '/'
  };

  res.cookie('accessToken', result.accessToken, {
    ...cookieOpts,
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', result.refreshToken, {
    ...cookieOpts,
    maxAge: config.REFRESH_TOKEN_COOKIE_EXPIRY_MS,
    path: '/api/auth/refresh'
  });

  return res.status(200).json({ message: 'Tokens refreshed successfully.' });
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  const userId = req.user?.user_id;
  if (userId) {
    await authService.logoutUser(userId);
  }

  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return res.status(200).json({ message: 'Logged out successfully.' });
}

module.exports = {
  register,
  initiateLogin,
  verifyLogin,
  refreshToken,
  logout
};