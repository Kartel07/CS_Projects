'use strict';

const transactionService = require('../services/transactionService');

/**
 * POST /api/transactions/execute
 */
async function executeTransaction(req, res) {
  const { account_id, user_id, action_type, amount, description } = req.body;
  const result = await transactionService.executeTransaction(account_id, user_id, action_type, amount, description);
  return res.status(200).json(result);
}

module.exports = {
  executeTransaction
};