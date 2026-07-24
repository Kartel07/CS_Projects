'use strict';

const db = require('../config/db');
const config = require('../config');
const logger = require('../utils/logger');
const { maskUserSensitiveFields } = require('../utils/helpers');

/**
 * Fetch full dashboard data for a user: accounts, transactions, DOB, available months.
 */
async function getDashboard(userId, targetMonth) {
  const [accounts] = await db.execute(
    `SELECT id, account_number, account_type, balance, interest_rate, min_balance,
            tenure_months, payout_option
     FROM accounts WHERE user_id = ?`,
    [userId]
  );

  const [userRow] = await db.execute('SELECT dob FROM users WHERE user_id = ?', [userId]);

  const [monthArchiveList] = await db.execute(
    `SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') AS active_month
     FROM transactions WHERE user_id = ? ORDER BY active_month DESC`,
    [userId]
  );

  let trackingTargetMonth = targetMonth;
  if (!trackingTargetMonth) {
    const now = new Date();
    trackingTargetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const startingBoundaryDate = `${trackingTargetMonth}-01 00:00:00`;
  const endingBoundaryDate = `${trackingTargetMonth}-31 23:59:59`;

  const [transactions] = await db.execute(
    `SELECT account_id, description, txn_type, amount, created_at
     FROM transactions WHERE user_id = ? AND created_at BETWEEN ? AND ?
     ORDER BY created_at DESC`,
    [userId, startingBoundaryDate, endingBoundaryDate]
  );

  return {
    accounts,
    transactions,
    dob: userRow[0]?.dob,
    availableMonths: monthArchiveList.map(m => m.active_month),
    selectedMonth: trackingTargetMonth
  };
}

/**
 * Update username with duplicate check.
 */
async function updateUsername(userId, newUsername) {
  const cleanUsername = newUsername.trim();

  const [taken] = await db.execute('SELECT id FROM users WHERE username = ?', [cleanUsername]);
  if (taken.length > 0) {
    const err = new Error('Username choice is already taken.');
    err.statusCode = 409;
    throw err;
  }

  await db.execute('UPDATE users SET username = ? WHERE user_id = ?', [cleanUsername, userId]);
  return { message: 'Username handle updated inside directory.', updatedUsername: cleanUsername };
}

/**
 * Create a new sub-account (savings or current).
 */
async function openSubAccount(userId, accountType, initialDeposit) {
  const typeClean = accountType?.toLowerCase();
  const rule = config.BALANCING_MATRIX[typeClean];

  if (!userId || !rule) {
    const err = new Error('Invalid parameter combinations or financial product tier choice.');
    err.statusCode = 400;
    throw err;
  }

  const deposit = parseFloat(initialDeposit) || 0;
  if (deposit < rule.minBalance) {
    const err = new Error(`Regulatory threshold requires a minimum deposit of ₹${rule.minBalance.toLocaleString('en-IN')} for this tier.`);
    err.statusCode = 400;
    throw err;
  }

  const [existing] = await db.execute(
    'SELECT id FROM accounts WHERE user_id = ? AND account_type = ?',
    [userId, typeClean]
  );
  if (existing.length > 0) {
    const err = new Error(`An active ${accountType.toUpperCase()} portfolio line is already provisioned under your profile.`);
    err.statusCode = 409;
    throw err;
  }

  const { generateAccountNumber } = require('../utils/helpers');
  const accNum = generateAccountNumber();

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO accounts (account_number, user_id, account_type, balance, interest_rate, min_balance)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [accNum, userId, typeClean, deposit, rule.baseRate, rule.minBalance]
    );

    await connection.execute(
      `INSERT INTO transactions (account_id, user_id, description, txn_type, amount)
       VALUES (?, ?, ?, 'credit', ?)`,
      [result.insertId, userId, `Initial account line activation deposit — ${accountType.toUpperCase()}`, deposit]
    );

    await connection.commit();
    return { message: 'Additional financial product portfolio line provisioned successfully!' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Create a fixed deposit account.
 */
async function createFixedDeposit(userId, amount, tenureMonths, interestRate, payoutOption) {
  const fundingCapital = parseFloat(amount);
  if (!userId || isNaN(fundingCapital) || fundingCapital < 10000) {
    const err = new Error('Invalid parameters input fields.');
    err.statusCode = 400;
    throw err;
  }

  const { generateAccountNumber } = require('../utils/helpers');
  const accNum = generateAccountNumber();

  const [result] = await db.execute(
    `INSERT INTO accounts (account_number, user_id, account_type, balance, interest_rate, min_balance, tenure_months, payout_option)
     VALUES (?, ?, 'fixed', ?, ?, ?, ?, ?)`,
    [accNum, userId, fundingCapital, interestRate, fundingCapital, tenureMonths, payoutOption]
  );

  await db.execute(
    `INSERT INTO transactions (account_id, user_id, description, txn_type, amount)
     VALUES (?, ?, ?, 'credit', ?)`,
    [result.insertId, userId, `Opened Fixed Deposit Certificate (Lock: ${tenureMonths} Mo.)`, fundingCapital]
  );

  return { message: 'Fixed Deposit deployed successfully!' };
}

module.exports = {
  getDashboard,
  updateUsername,
  openSubAccount,
  createFixedDeposit
};