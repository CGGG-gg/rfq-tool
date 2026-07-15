const express = require('express');
const router = express.Router();
const config = require('../config');
const wechatService = require('../services/wechatService');

/**
 * POST /api/v1/auth/login
 * Dev mode: auto-login without WeChat code.
 * Production: wx.login code → session token.
 */
router.post('/login', async (req, res, next) => {
  try {
    // Dev mode: skip WeChat, generate token directly
    if (config.devMode) {
      const { generateUUID } = require('../utils/uuid');
      const token = generateUUID();
      const expiresIn = 86400; // 24 hours

      return res.json({
        success: true,
        data: {
          token,
          expires_in: expiresIn,
          openid: 'dev_user',
          message: '[DEV MODE] Auto-login, no WeChat required.',
        },
      });
    }

    // Production: WeChat login
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'code is required.' });
    }

    const result = await wechatService.login(code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/check
 * Validate session token.
 */
router.get('/check', (req, res) => {
  if (config.devMode) {
    return res.json({
      success: true,
      data: {
        valid: true,
        openid: 'dev_user',
        message: '[DEV MODE] Token always valid.',
      },
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ success: true, data: { valid: false } });
  }

  const token = authHeader.substring(7);
  const user = wechatService.validateToken(token);

  res.json({ success: true, data: { valid: !!user } });
});

module.exports = router;
