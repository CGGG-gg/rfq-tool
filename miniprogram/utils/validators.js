/**
 * Validate that a value is not empty.
 */
function isNotEmpty(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

/**
 * Validate email format.
 */
function isEmail(value) {
  if (!value) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Validate phone number (Chinese format).
 */
function isPhone(value) {
  if (!value) return true;
  return /^1[3-9]\d{9}$/.test(value);
}

/**
 * Validate a positive number.
 */
function isPositiveNumber(value) {
  if (value === '' || value === undefined || value === null) return true;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate RFQ form data.
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateRfqForm(data) {
  const errors = {};

  if (!isNotEmpty(data.title)) {
    errors.title = '请输入询价单标题';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate supplier form data.
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateSupplierForm(data) {
  const errors = {};

  if (!isNotEmpty(data.name)) {
    errors.name = '请输入供应商名称';
  }
  if (data.email && !isEmail(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  if (data.phone && !isPhone(data.phone)) {
    errors.phone = '手机号格式不正确';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validate an RFQ item form data.
 * @returns {Object} { valid: boolean, errors: Object }
 */
function validateItemForm(data) {
  const errors = {};

  if (!isNotEmpty(data.product_name)) {
    errors.product_name = '请输入产品名称';
  }
  if (data.quantity && !isPositiveNumber(data.quantity)) {
    errors.quantity = '数量必须为正数';
  }
  if (data.target_price && !isPositiveNumber(data.target_price)) {
    errors.target_price = '价格必须为正数';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  isNotEmpty,
  isEmail,
  isPhone,
  isPositiveNumber,
  validateRfqForm,
  validateSupplierForm,
  validateItemForm,
};
