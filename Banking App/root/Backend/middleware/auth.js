'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Verify the JWT access token from an HttpOnly cookie or Authorization header.
 * Attaches decoded payload to req.user on success.
 */
function authenticate(req, res, next) {
  // Try cookie first, then Authorization header fallback
  let token = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    req.user = {
      user_id: decoded.user_id,
      username: decoded.username,
      role: decoded.role
    };
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);
    return res.status(401).json({ message: 'Invalid or expired session token.' });
  }
}

/**
 * Require the authenticated user to have a specific role.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions for this operation.' });
    }
    next();
  };
}

/**
 * Optional auth — attaches user if token provided, but doesn't reject if absent.
 */
function optionalAuth(req, res, next) {
  let token = req.cookies?.accessToken;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
      req.user = {
        user_id: decoded.user_id,
        username: decoded.username,
        role: decoded.role
      };
    } catch {
      // Silent — token invalid, treat as unauthenticated
    }
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };