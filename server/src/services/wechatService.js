const axios = require('axios');
const config = require('../config');

// In-memory session store: Map<token, { openid, session_key, expires_at }>
const sessions = new Map();

// Clean expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expires_at < now) {
      sessions.delete(token);
    }
  }
}, 5 * 60 * 1000);

const WechatService = {
  /**
   * Exchange a wx.login code for openid and session_key.
   * Creates a session and returns a bearer token.
   *
   * @param {string} code - wx.login code from mini-program
   * @returns {Promise<{token: string, expires_in: number}>}
   */
  async login(code) {
    const appId = config.wechat.appId;
    const secret = config.wechat.secret;

    if (!appId || appId === 'your_wechat_appid') {
      // Development mode: generate a fake session
      const { generateUUID } = require('../utils/uuid');
      const token = generateUUID();
      sessions.set(token, {
        openid: 'dev_openid_' + token.substring(0, 8),
        session_key: 'dev_session_key',
        expires_at: Date.now() + 86400 * 1000,
      });
      return { token, expires_in: 86400 };
    }

    // Production: call WeChat API
    const url = 'https://api.weixin.qq.com/sns/jscode2session';
    const response = await axios.get(url, {
      params: {
        appid: appId,
        secret: secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, session_key, errcode, errmsg } = response.data;

    if (errcode) {
      throw new Error(`WeChat login failed: ${errmsg} (code: ${errcode})`);
    }

    const { generateUUID } = require('../utils/uuid');
    const token = generateUUID();
    const expiresIn = 86400; // 24 hours

    sessions.set(token, {
      openid,
      session_key,
      expires_at: Date.now() + expiresIn * 1000,
    });

    return { token, expires_in: expiresIn };
  },

  /**
   * Validate a session token and return the openid.
   *
   * @param {string} token
   * @returns {{openid: string}|null}
   */
  validateToken(token) {
    const session = sessions.get(token);
    if (!session) return null;
    if (session.expires_at < Date.now()) {
      sessions.delete(token);
      return null;
    }
    return { openid: session.openid };
  },
};

module.exports = WechatService;
