'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/employeeController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

// All employee routes require authentication + employee role
router.use(authenticate, requireRole('employee'));

// GET /api/employee/users
router.get('/users', ctrl.getAllCustomers);

// GET /api/employee/users/:userId/ledger
router.get('/users/:userId/ledger', ctrl.getUserLedger);

module.exports = router;