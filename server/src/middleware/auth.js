const config = require('../config');
const wechatService = require('../services/wechatService');

/**
 * In dev mode, auto-attach a dev user without requiring a real token.
 * In production, validates WeChat session token.
 */
function resolveUser(req) {
  // Dev mode: auto-create dev user
  if (config.devMode) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const user = wechatService.validateToken(authHeader.substring(7));
      if (user) return user;
    }
    // Auto-login as dev user
    return { openid: 'dev_user', dev: true };
  }

  // Production: validate Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return wechatService.validateToken(authHeader.substring(7));
}

/**
 * Optional auth middleware.
 * In dev mode, always attaches a dev user.
 * In production, skips if no valid token.
 */
function optionalAuth(req, res, next) {
  req.user = resolveUser(req);
  next();
}

/**
 * Required auth middleware.
 * In dev mode, always passes with a dev user.
 * In production, returns 401 if no valid token.
 */
function requireAuth(req, res, next) {
  if (config.devMode) {
    req.user = { openid: 'dev_user', dev: true };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please login first.',
    });
  }

  const token = authHeader.substring(7);
  const user = wechatService.validateToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token. Please login again.',
    });
  }

  req.user = user;
  next();
}

module.exports = { optionalAuth, requireAuth };
