'use strict';

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware factory: runs validators, returns 400 on failure.
 */
function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed.',
          errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
      }
      next();
    }
  ];
}

// ── Auth rules ──

const registerRules = [
  body('personal.first_name').trim().notEmpty().withMessage('First name is required.')
    .isAlpha('en-US', { ignore: ' -' }).withMessage('First name must contain only letters.'),
  body('personal.last_name').trim().notEmpty().withMessage('Last name is required.')
    .isAlpha('en-US', { ignore: ' -' }).withMessage('Last name must contain only letters.'),
  body('personal.email').trim().isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('personal.phone').trim().matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian mobile number required.'),
  body('personal.dob').trim().notEmpty().withMessage('Date of birth is required.')
    .isISO8601().withMessage('Invalid date format.'),
  body('personal.kyc_type').trim().isIn(['PAN', 'AADHAAR']).withMessage('KYC type must be PAN or AADHAAR.'),
  body('personal.kyc_number').trim().notEmpty().withMessage('KYC number is required.'),
  body('account.username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
  body('account.password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('account.account_type').trim().isIn(['savings', 'current']).withMessage('Account type must be savings or current.')
];

const loginInitiateRules = [
  body('login_handle').trim().notEmpty().withMessage('Login handle is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

const loginVerifyRules = [
  body('login_handle').trim().notEmpty().withMessage('Login handle is required.'),
  body('otp_code').trim().notEmpty().withMessage('OTP code is required.')
    .matches(/^\d{6}$/).withMessage('OTP must be a 6-digit number.')
];

// ── Account rules ──

const openAccountRules = [
  body('user_id').trim().notEmpty().withMessage('User ID is required.'),
  body('account_type').trim().isIn(['savings', 'current']).withMessage('Account type must be savings or current.'),
  body('initial_deposit').isFloat({ min: 0 }).withMessage('Initial deposit must be a positive number.')
];

const fixedDepositRules = [
  body('user_id').trim().notEmpty().withMessage('User ID is required.'),
  body('amount').isFloat({ min: 10000 }).withMessage('Amount must be at least ₹10,000.'),
  body('tenure_months').isInt({ min: 1 }).withMessage('Tenure must be at least 1 month.'),
  body('interest_rate').isFloat({ min: 0 }).withMessage('Interest rate must be positive.'),
  body('payout_option').trim().isIn(['Monthly', 'Quarterly', 'Maturity']).withMessage('Invalid payout option.')
];

const updateUsernameRules = [
  body('user_id').trim().notEmpty().withMessage('User ID is required.'),
  body('new_username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.')
];

// ── Transaction rules ──

const transactionRules = [
  body('account_id').isInt({ min: 1 }).withMessage('Valid account ID is required.'),
  body('user_id').trim().notEmpty().withMessage('User ID is required.'),
  body('action_type').trim().isIn(['deposit', 'withdraw']).withMessage('Action type must be deposit or withdraw.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be at least ₹0.01.')
];

module.exports = {
  validate,
  registerRules,
  loginInitiateRules,
  loginVerifyRules,
  openAccountRules,
  fixedDepositRules,
  updateUsernameRules,
  transactionRules
};