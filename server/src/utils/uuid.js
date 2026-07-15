const { v4: uuidv4 } = require('uuid');

function generateUUID() {
  return uuidv4();
}

/**
 * Get the current timestamp in MySQL-compatible format (YYYY-MM-DD HH:MM:SS).
 */
function now() {
  return new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

/**
 * Format a Date object or ISO string to MySQL-compatible format.
 */
function toMySqlDate(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

module.exports = { generateUUID, now, toMySqlDate };
