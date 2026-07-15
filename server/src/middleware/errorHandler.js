/**
 * Global error handler middleware.
 */
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.',
    });
  }

  // Multer invalid file type
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file field name.',
    });
  }

  // Validation errors (custom)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      errors: err.errors || [],
    });
  }

  // Not found
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      error: err.message || 'Resource not found.',
    });
  }

  // Default - internal server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal server error.' : err.message,
  });
}

/**
 * Create a validation error with a name property.
 */
function createValidationError(message, errors = []) {
  const err = new Error(message);
  err.name = 'ValidationError';
  err.errors = errors;
  return err;
}

/**
 * Create a not-found error.
 */
function createNotFoundError(message = 'Resource not found.') {
  const err = new Error(message);
  err.name = 'NotFoundError';
  return err;
}

module.exports = { errorHandler, createValidationError, createNotFoundError };
