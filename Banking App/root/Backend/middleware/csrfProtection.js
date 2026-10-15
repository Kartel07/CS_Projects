'use strict';

const config = require('../config');

/**
 * Lightweight CSRF protection via Origin / Referer validation.
 *
 * For state-changing requests (POST/PATCH/PUT/DELETE), checks that the
 * Origin or Referer header matches the configured CORS origin.
 *
 * Trusts the same-origin check built into browsers — if both headers are
 * missing (unusual for browser requests), it logs a warning but allows
 * the request through (to avoid breaking API clients / health checks).
 *
 * In test mode, this middleware is a no-op.
 */

const ALLOWED_ORIGINS = new Set(
  [
    config.CORS_ORIGIN,
    // Allow local dev variants the user might hit
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ].filter(Boolean)
);

// State-changing HTTP methods
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function csrfProtection(req, res, next) {
  // Skip in test/dev environments or for non-mutating requests
  if (config.NODE_ENV === 'test' || !MUTATING_METHODS.has(req.method)) {
    return next();
  }

  // Health check is public — no CSRF needed
  if (req.path === '/api/health') {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // If neither header is present, this is likely an API client (not a browser).
  // Allow it but warn.
  if (!origin && !referer) {
    next();
    return;
  }

  const checkOrigin = origin || referer;
  const requestOrigin = checkOrigin.replace(/\/+$/, ''); // strip trailing slash

  let allowed = false;
  for (const allowedOrigin of ALLOWED_ORIGINS) {
    if (requestOrigin === allowedOrigin.replace(/\/+$/, '')) {
      allowed = true;
      break;
    }
  }

  if (!allowed) {
    return res.status(403).json({
      message: 'Request origin not permitted.'
    });
  }

  next();
}

module.exports = csrfProtection;
