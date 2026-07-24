'use strict';

const accountService = require('../services/accountService');

/**
 * GET /api/accounts/dashboard/:userId
 */
async function getDashboard(req, res) {
  const { userId } = req.params;
  const targetMonth = req.query.month;
  const data = await accountService.getDashboard(userId, targetMonth);
  return res.status(200).json(data);
}

/**
 * PATCH /api/accounts/username
 */
async function updateUsername(req, res) {
  const { user_id, new_username } = req.body;
  const result = await accountService.updateUsername(user_id, new_username);
  return res.status(200).json(result);
}

/**
 * POST /api/accounts/open
 */
async function openAccount(req, res) {
  const { user_id, account_type, initial_deposit } = req.body;
  const result = await accountService.openSubAccount(user_id, account_type, initial_deposit);
  return res.status(201).json(result);
}

/**
 * POST /api/accounts/fixed-deposit
 */
async function createFixedDeposit(req, res) {
  const { user_id, amount, tenure_months, interest_rate, payout_option } = req.body;
  const result = await accountService.createFixedDeposit(user_id, amount, tenure_months, interest_rate, payout_option);
  return res.status(201).json(result);
}

module.exports = {
  getDashboard,
  updateUsername,
  openAccount,
  createFixedDeposit
};