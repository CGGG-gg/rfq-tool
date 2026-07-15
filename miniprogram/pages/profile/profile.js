const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    serverUrl: 'http://localhost:3000',
  },

  onShow() {
    this.setData({ isLoggedIn: app.globalData.isLoggedIn });
  },

  async onLogin() {
    try {
      await app.ensureLogin();
      this.setData({ isLoggedIn: true });
      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '登录失败', icon: 'none' });
    }
  },

  onLogout() {
    const auth = require('../../utils/auth');
    auth.clearToken();
    app.globalData.isLoggedIn = false;
    this.setData({ isLoggedIn: false });
    wx.showToast({ title: '已退出', icon: 'success' });
  },

  onCopyApiKey() {
    // For demo purposes - in production, fetch from server
    wx.setClipboardData({
      data: 'rfq_external_api_key_2026',
      success: () => {
        wx.showToast({ title: 'API Key 已复制', icon: 'success' });
      },
    });
  },

  onViewApiDocs() {
    wx.setClipboardData({
      data: this.data.serverUrl + '/openapi/v1/docs',
      success: () => {
        wx.showToast({ title: '文档地址已复制，请在浏览器中打开', icon: 'none' });
      },
    });
  },
});
