'use strict';

const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { validate, registerRules, loginInitiateRules, loginVerifyRules } = require('../middleware/validator');

const router = Router();

// POST /api/auth/register
router.post('/register', registerLimiter, validate(registerRules), ctrl.register);

// POST /api/auth/login/initiate
router.post('/login/initiate', loginLimiter, validate(loginInitiateRules), ctrl.initiateLogin);

// POST /api/auth/login/verify
router.post('/login/verify', loginLimiter, validate(loginVerifyRules), ctrl.verifyLogin);

// POST /api/auth/refresh
router.post('/refresh', ctrl.refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;