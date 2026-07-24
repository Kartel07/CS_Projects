'use strict';

const rateLimit = require('express-rate-limit');

const isTest = () => process.env.NODE_ENV === 'test';

/**
 * Tier-based rate limiting for different API sensitivities.
 * In test mode, rate limiting is skipped entirely.
 */

// Strict: login endpoints — 5 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Moderate: registration — 3 per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Registration rate limit exceeded. Try again later.' }
});

// Standard: transactional endpoints — 30 per 15 min per IP
const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Transaction rate limit exceeded. Slow down.' }
});

// General API limiter — 100 per 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Request rate limit exceeded.' }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  transactionLimiter,
  generalLimiter
};