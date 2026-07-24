'use strict';

/**
 * Structured logging utility — one interface, two modes.
 * Development: colourful console output with level prefixes.
 * Production: JSON lines (compatible with log aggregators).
 */

const isProd = process.env.NODE_ENV === 'production';

const LEVEL_LABELS = { error: '[ERROR]', warn: '[WARN]', info: '[INFO]', debug: '[DEBUG]' };

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, meta) {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...(meta ? { meta } : {})
  };

  if (isProd) {
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry));
  } else {
    const label = LEVEL_LABELS[level] || '[LOG]';
    if (meta) {
      console[level === 'debug' ? 'log' : level](`${label} ${message}`, meta);
    } else {
      console[level === 'debug' ? 'log' : level](`${label} ${message}`);
    }
  }
}

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta)
};