'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { validate, openAccountRules, fixedDepositRules, updateUsernameRules } = require('../middleware/validator');

const router = Router();

// GET /api/accounts/dashboard/:userId
router.get('/dashboard/:userId', authenticate, ctrl.getDashboard);

// PATCH /api/accounts/username
router.patch('/username', authenticate, validate(updateUsernameRules), ctrl.updateUsername);

// POST /api/accounts/open
router.post('/open', authenticate, transactionLimiter, validate(openAccountRules), ctrl.openAccount);

// POST /api/accounts/fixed-deposit
router.post('/fixed-deposit', authenticate, transactionLimiter, validate(fixedDepositRules), ctrl.createFixedDeposit);

module.exports = router;