'use strict';

const db = require('../config/db');
const { maskUserSensitiveFields } = require('../utils/helpers');

/**
 * Get all customer profiles for employee view, with sensitive fields masked.
 */
async function getAllCustomers() {
  const [rows] = await db.execute(
    `SELECT user_id, username, first_name, last_name, email, phone, kyc_type, kyc_number
     FROM users WHERE role = 'customer' ORDER BY created_at DESC`
  );

  return rows.map(maskUserSensitiveFields);
}

/**
 * Get accounts and transactions for a specific user (employee audit view).
 */
async function getUserLedger(userId) {
  const [accounts] = await db.execute(
    `SELECT id, account_number, account_type, balance, interest_rate, min_balance
     FROM accounts WHERE user_id = ?`,
    [userId]
  );

  const [transactions] = await db.execute(
    `SELECT account_id, description, txn_type, amount, created_at
     FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  // Mask account numbers
  const maskedAccounts = accounts.map(a => ({
    ...a,
    account_number: `****${a.account_number.slice(-4)}`
  }));

  return { accounts: maskedAccounts, transactions };
}

module.exports = {
  getAllCustomers,
  getUserLedger
};