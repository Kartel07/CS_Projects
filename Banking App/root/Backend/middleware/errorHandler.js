'use strict';

const logger = require('../utils/logger');

/**
 * Centralized error-handling middleware.
 * Express 5 automatically forwards async errors here.
 */
function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.expose || statusCode < 500
    ? err.message
    : 'An unexpected internal error occurred.';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
      stack: err.stack,
      body: sanitizeBody(req.body)
    });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} — ${err.message}`);
  }

  res.status(statusCode).json({ message });
}

/**
 * Strip passwords/tokens from logged bodies.
 */
function sanitizeBody(body) {
  if (!body) return body;
  const sanitized = { ...body };
  if (sanitized.password) sanitized.password = '[REDACTED]';
  if (sanitized.otp_code) sanitized.otp_code = '[REDACTED]';
  if (sanitized.accessToken) sanitized.accessToken = '[REDACTED]';
  if (sanitized.refreshToken) sanitized.refreshToken = '[REDACTED]';
  return sanitized;
}

/**
 * 404 handler for unknown routes.
 */
function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` });
}

module.exports = { errorHandler, notFoundHandler };