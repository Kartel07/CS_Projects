'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { transactionLimiter } = require('../middleware/rateLimiter');
const { validate, transactionRules } = require('../middleware/validator');

const router = Router();

// POST /api/transactions/execute
router.post('/execute', authenticate, transactionLimiter, validate(transactionRules), ctrl.executeTransaction);

module.exports = router;