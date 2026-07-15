const crypto = require('crypto');
const config = require('../config');

/**
 * External API Key authentication middleware.
 * Validates X-API-Key header against EXTERNAL_API_KEY.
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Missing API key. Provide X-API-Key header.',
    });
  }

  // Constant-time comparison to prevent timing attacks
  const expectedKey = config.externalApiKey;
  if (apiKey.length !== expectedKey.length) {
    return res.status(401).json({ success: false, error: 'Invalid API key.' });
  }

  const isEqual = crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(expectedKey)
  );

  if (!isEqual) {
    return res.status(401).json({ success: false, error: 'Invalid API key.' });
  }

  // Store hashed key for audit logging
  req.apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  next();
}

module.exports = { apiKeyAuth };
