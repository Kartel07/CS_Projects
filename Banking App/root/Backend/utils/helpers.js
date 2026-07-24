'use strict';

const config = require('../config');

/**
 * Generate a secure account number with the APX prefix.
 * Format: APX + 8 random digits
 * @returns {string}
 */
function generateAccountNumber() {
  return config.PRESENT_ACCOUNT_PREFIX + Math.floor(10000000 + Math.random() * 90000000);
}

/**
 * Mask sensitive data for employee/admin endpoints.
 * - phone: shows last 4 digits only
 * - kyc_number: shows first 2 and last 2 characters only
 * - email: shows first 2 chars + domain
 * @param {string} type - field type ('phone', 'kyc', 'email')
 * @param {string} value - the raw value
 * @returns {string} masked value
 */
function maskField(type, value) {
  if (!value) return '—';
  const str = String(value);
  switch (type) {
    case 'phone':
      return str.length >= 4
        ? `XXXXXX${str.slice(-4)}`
        : 'XXXXXX';
    case 'kyc':
      return str.length >= 4
        ? `${str.slice(0, 2)}XXXX${str.slice(-2)}`
        : `XXXX`;
    case 'email': {
      const atIndex = str.indexOf('@');
      if (atIndex < 2) return str;
      return `${str.slice(0, 2)}****${str.slice(atIndex)}`;
    }
    default:
      return str;
  }
}

/**
 * Mask all sensitive fields in a user object for employee views.
 * @param {object} user
 * @returns {object}
 */
function maskUserSensitiveFields(user) {
  return {
    ...user,
    phone: maskField('phone', user.phone),
    kyc_number: maskField('kyc', user.kyc_number),
    email: maskField('email', user.email)
  };
}

module.exports = {
  generateAccountNumber,
  maskField,
  maskUserSensitiveFields
};