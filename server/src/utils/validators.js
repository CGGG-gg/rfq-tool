/**
 * Validate that a value is a non-empty string.
 */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate that a value is a positive number.
 */
function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate that a value is a valid number (positive or zero).
 */
function isNonNegativeNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate email format.
 */
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate that a value is a valid UUID v4.
 */
function isValidUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Validate that a value is one of the allowed values.
 */
function isOneOf(value, allowed) {
  return allowed.includes(value);
}

/**
 * Validate status field.
 */
const RFQ_STATUSES = ['draft', 'sent', 'quoted', 'closed'];

function isValidRfqStatus(value) {
  return isOneOf(value, RFQ_STATUSES);
}

/**
 * Validate an RFQ item object.
 * Returns { valid: boolean, errors: string[] }
 */
function validateRfqItem(item) {
  const errors = [];

  if (!item.product_name || !isNonEmptyString(item.product_name)) {
    errors.push('product_name is required');
  }
  if (item.quantity !== undefined && item.quantity !== null && !isNonNegativeNumber(item.quantity)) {
    errors.push('quantity must be a non-negative number');
  }
  if (item.target_price !== undefined && item.target_price !== null && !isNonNegativeNumber(item.target_price)) {
    errors.push('target_price must be a non-negative number');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an array of RFQ items.
 */
function validateRfqItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, errors: ['items must be a non-empty array'] };
  }

  const allErrors = [];
  items.forEach((item, index) => {
    const { valid, errors } = validateRfqItem(item);
    if (!valid) {
      errors.forEach(err => allErrors.push(`Item ${index + 1}: ${err}`));
    }
  });

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Sanitize a string for safe output.
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>&"']/g, (c) => {
    const map = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
    return map[c];
  });
}

module.exports = {
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidEmail,
  isValidUUID,
  isOneOf,
  isValidRfqStatus,
  validateRfqItem,
  validateRfqItems,
  sanitize,
  RFQ_STATUSES,
};
