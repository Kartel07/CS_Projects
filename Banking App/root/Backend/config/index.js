'use strict';

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'apex-bank-access-secret-change-in-prod',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'apex-bank-refresh-secret-change-in-prod',
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  REFRESH_TOKEN_COOKIE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://127.0.0.1:5500',
  OTP_EXPIRY_MS: 5 * 60 * 1000,
  BALANCING_MATRIX: {
    savings: { baseRate: 4.00, minBalance: 1000.00 },
    current: { baseRate: 0.00, minBalance: 5000.00 }
  },
  PRESENT_ACCOUNT_PREFIX: 'APX',
  NODE_ENV: process.env.NODE_ENV || 'development'
};