const STORAGE_KEY_TOKEN = 'rfq_token';
const STORAGE_KEY_EXPIRES = 'rfq_token_expires';

/**
 * Get the stored auth token.
 */
function getToken() {
  const token = wx.getStorageSync(STORAGE_KEY_TOKEN);
  const expiresAt = wx.getStorageSync(STORAGE_KEY_EXPIRES);

  if (!token || !expiresAt) return null;

  // Check expiration
  if (Date.now() > expiresAt) {
    clearToken();
    return null;
  }

  return token;
}

/**
 * Store the auth token.
 */
function setToken(token, expiresIn) {
  wx.setStorageSync(STORAGE_KEY_TOKEN, token);
  wx.setStorageSync(STORAGE_KEY_EXPIRES, Date.now() + (expiresIn - 300) * 1000); // 5 min buffer
}

/**
 * Clear stored auth token.
 */
function clearToken() {
  wx.removeStorageSync(STORAGE_KEY_TOKEN);
  wx.removeStorageSync(STORAGE_KEY_EXPIRES);
}

module.exports = {
  getToken,
  setToken,
  clearToken,
};
