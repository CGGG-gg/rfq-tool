// app.js
const auth = require('./utils/auth');
const api = require('./utils/api');

App({
  onLaunch() {
    // Set API base URL (change this to your server address)
    api.setBaseUrl('http://localhost:3000');

    // Check login status
    this.checkLogin();
  },

  async checkLogin() {
    const token = auth.getToken();
    if (token) {
      try {
        const res = await api.get('/api/v1/auth/check');
        if (res.success && res.data.valid) {
          this.globalData.isLoggedIn = true;
          return;
        }
      } catch (err) {
        console.log('Token validation failed, re-logging in...');
      }
    }
    // Will trigger login when needed
  },

  /**
   * Ensure user is logged in (call before API requests).
   */
  async ensureLogin() {
    if (this.globalData.isLoggedIn) return;

    try {
      const code = await this.wxLogin();
      const res = await api.post('/api/v1/auth/login', { code });
      if (res.success && res.data.token) {
        auth.setToken(res.data.token, res.data.expires_in);
        this.globalData.isLoggedIn = true;
      }
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  },

  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('wx.login failed: ' + res.errMsg));
          }
        },
        fail: reject,
      });
    });
  },

  globalData: {
    isLoggedIn: false,
    userInfo: null,
  },
});
