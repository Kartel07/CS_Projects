'use strict';

const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Execute a deposit or withdrawal transaction with ACID guarantees.
 */
async function executeTransaction(accountId, userId, actionType, amount, description) {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    const err = new Error('Invalid transaction amount.');
    err.statusCode = 400;
    throw err;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Lock the account row for update to prevent race conditions
    const [accRows] = await connection.execute(
      'SELECT balance, min_balance FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE',
      [accountId, userId]
    );

    if (accRows.length === 0) {
      await connection.rollback();
      const err = new Error('Target clearing index account not found.');
      err.statusCode = 404;
      throw err;
    }

    const targetAccount = accRows[0];
    let balanceState = parseFloat(targetAccount.balance);
    const statutoryMinimum = parseFloat(targetAccount.min_balance);

    if (actionType === 'deposit') {
      balanceState += parsedAmount;
    } else if (actionType === 'withdraw') {
      if (balanceState - parsedAmount < statutoryMinimum) {
        await connection.rollback();
        const err = new Error(
          `Transaction Denied: Minimum balance threshold of ₹${statutoryMinimum.toLocaleString('en-IN')} required.`
        );
        err.statusCode = 400;
        throw err;
      }
      balanceState -= parsedAmount;
    } else {
      await connection.rollback();
      const err = new Error('Invalid action type. Must be deposit or withdraw.');
      err.statusCode = 400;
      throw err;
    }

    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE id = ?',
      [balanceState, accountId]
    );

    const txnType = actionType === 'deposit' ? 'credit' : 'debit';
    await connection.execute(
      'INSERT INTO transactions (account_id, user_id, description, txn_type, amount) VALUES (?, ?, ?, ?, ?)',
      [accountId, userId, description || `${actionType.toUpperCase()} request processed`, txnType, parsedAmount]
    );

    await connection.commit();
    return { message: 'Ledger settlement balancing sync complete.', revisedBalance: balanceState };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  executeTransaction
};