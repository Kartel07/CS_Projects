'use strict';

const employeeService = require('../services/employeeService');

/**
 * GET /api/employee/users
 */
async function getAllCustomers(req, res) {
  const users = await employeeService.getAllCustomers();
  return res.status(200).json({ users });
}

/**
 * GET /api/employee/users/:userId/ledger
 */
async function getUserLedger(req, res) {
  const { userId } = req.params;
  const data = await employeeService.getUserLedger(userId);
  return res.status(200).json(data);
}

module.exports = {
  getAllCustomers,
  getUserLedger
};