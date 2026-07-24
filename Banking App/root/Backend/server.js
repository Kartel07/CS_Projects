'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// ── Route imports ──
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const employeeRoutes = require('./routes/employee');

const app = express();
const PORT = config.PORT;

// ── Global middleware ──

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Strict CORS
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Request logging
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Global rate limiter
app.use('/api', generalLimiter);

// ── Static frontend serving ──
app.use(express.static(path.join(__dirname, '../Homepage')));
app.use('/Login', express.static(path.join(__dirname, '../Login')));
app.use('/Register', express.static(path.join(__dirname, '../Register')));

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/employee', employeeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Redirect root to home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Homepage/home.html'));
});

// ── Error handling ──
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server (only when run directly, not when imported by tests) ──
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('==================================================================');
    logger.info('[CORE SYSTEMS INFRASTRUCTURE RUNNING]');
    logger.info(`APP ENGINE DEPLOYED SAFELY ON: http://127.0.0.1:${PORT}`);
    logger.info(`ENVIRONMENT: ${config.NODE_ENV}`);
    logger.info('==================================================================');
  });
}

module.exports = app;