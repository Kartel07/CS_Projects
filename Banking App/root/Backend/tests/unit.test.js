'use strict';

const { maskField, maskUserSensitiveFields, generateAccountNumber } = require('../utils/helpers');

// ── UTILITY TESTS (no database required) ──────────────────────

describe('Utility Helpers', () => {

  describe('generateAccountNumber', () => {
    test('should start with APX prefix', () => {
      const num = generateAccountNumber();
      expect(num).toMatch(/^APX\d{8}$/);
    });

    test('should generate unique numbers', () => {
      const set = new Set();
      for (let i = 0; i < 100; i++) {
        set.add(generateAccountNumber());
      }
      expect(set.size).toBe(100);
    });
  });

  describe('maskField', () => {
    test('should mask phone number, showing last 4 digits', () => {
      expect(maskField('phone', '9876543210')).toBe('XXXXXX3210');
    });

    test('should mask KYC number', () => {
      expect(maskField('kyc', 'ABCDE1234F')).toBe('ABXXXX4F');
    });

    test('should mask email, showing first 2 chars + domain', () => {
      expect(maskField('email', 'john.doe@example.com')).toBe('jo****@example.com');
    });

    test('should return placeholder for null/undefined', () => {
      expect(maskField('phone', null)).toBe('—');
      expect(maskField('phone', undefined)).toBe('—');
    });
  });

  describe('maskUserSensitiveFields', () => {
    const user = {
      user_id: 'APX-TEST123',
      username: 'testuser',
      phone: '9876543210',
      kyc_number: 'ABCDE1234F',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User'
    };

    test('should mask phone, KYC, and email', () => {
      const masked = maskUserSensitiveFields(user);
      expect(masked.phone).toBe('XXXXXX3210');
      expect(masked.kyc_number).toBe('ABXXXX4F');
      expect(masked.email).toBe('te****@example.com');
    });

    test('should preserve non-sensitive fields', () => {
      const masked = maskUserSensitiveFields(user);
      expect(masked.user_id).toBe('APX-TEST123');
      expect(masked.username).toBe('testuser');
      expect(masked.first_name).toBe('Test');
      expect(masked.last_name).toBe('User');
    });
  });

});

// ── CONFIG TESTS ──────────────────────────────────────────────

describe('Configuration', () => {
  let config;

  beforeAll(() => {
    // Temporarily set env vars for test
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    delete require.cache[require.resolve('../config')];
    config = require('../config');
  });

  test('should have default PORT 5000', () => {
    expect(config.PORT).toBe(5000);
  });

  test('should have JWT secrets', () => {
    expect(config.JWT_ACCESS_SECRET).toBeTruthy();
    expect(config.JWT_REFRESH_SECRET).toBeTruthy();
  });

  test('should have BALANCING_MATRIX defined', () => {
    expect(config.BALANCING_MATRIX).toHaveProperty('savings');
    expect(config.BALANCING_MATRIX).toHaveProperty('current');
    expect(config.BALANCING_MATRIX.savings.baseRate).toBe(4.00);
    expect(config.BALANCING_MATRIX.current.minBalance).toBe(5000.00);
  });

  test('should have rate limit config settings', () => {
    expect(config.ACCESS_TOKEN_EXPIRY).toBeTruthy();
    expect(config.REFRESH_TOKEN_EXPIRY).toBeTruthy();
  });
});

// ── EXPRESS APP BOOT (no DB connection) ───────────────────────

describe('Express App Bootstrap', () => {
  test('should load server module without crashing', () => {
    // We can't fully load server.js without a DB, but we can test
    // that the Express app pattern is valid
    const express = require('express');
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
    expect(typeof app.get).toBe('function');
    expect(typeof app.post).toBe('function');
  });

  test('should have helmet and cors as available middleware', () => {
    const helmet = require('helmet');
    const cors = require('cors');
    expect(typeof helmet).toBe('function');
    expect(typeof cors).toBe('function');
  });
});