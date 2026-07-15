const auth = require('./auth');

let BASE_URL = 'http://localhost:3000';

/**
 * Set the API base URL.
 */
function setBaseUrl(url) {
  BASE_URL = url.replace(/\/+$/, '');
}

/**
 * Send an HTTP request to the API.
 *
 * @param {string} method - GET, POST, PUT, DELETE
 * @param {string} path - API path (e.g., /api/v1/rfqs)
 * @param {Object} data - Request body (for POST/PUT)
 * @param {Object} options - { silent: bool, isUpload: bool, filePath: string, formData: Object }
 * @returns {Promise<Object>} Response data
 */
function request(method, path, data = {}, options = {}) {
  const url = BASE_URL + path;
  const token = auth.getToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    // Handle upload specially
    if (options.isUpload) {
      wx.uploadFile({
        url,
        filePath: options.filePath,
        name: options.fileName || 'file',
        formData: options.formData || {},
        header: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        success(res) {
          try {
            const data = JSON.parse(res.data);
            if (res.statusCode >= 400 || !data.success) {
              reject(new Error(data.error || 'Upload failed.'));
            } else {
              resolve(data);
            }
          } catch (e) {
            reject(new Error('Failed to parse response.'));
          }
        },
        fail(err) {
          reject(new Error(err.errMsg || 'Network error.'));
        },
      });
      return;
    }

    wx.request({
      url,
      method,
      header: headers,
      data: method === 'GET' ? undefined : data,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // Token expired, redirect to login
          auth.clearToken();
          if (!options.silent) {
            wx.showToast({ title: '请重新登录', icon: 'none' });
          }
          reject(new Error('Authentication required.'));
        } else {
          const errMsg = (res.data && res.data.error) ? res.data.error : 'Request failed.';
          if (!options.silent) {
            wx.showToast({ title: errMsg, icon: 'none' });
          }
          reject(new Error(errMsg));
        }
      },
      fail(err) {
        if (!options.silent) {
          wx.showToast({ title: '网络连接失败', icon: 'none' });
        }
        reject(new Error(err.errMsg || 'Network error.'));
      },
    });
  });
}

module.exports = {
  setBaseUrl,

  get(path, data) {
    return request('GET', path, data);
  },

  post(path, data, options) {
    return request('POST', path, data, options);
  },

  put(path, data) {
    return request('PUT', path, data);
  },

  delete(path, data) {
    return request('DELETE', path, data);
  },

  /**
   * Upload a file.
   * @param {string} path - API path
   * @param {string} filePath - Local file path
   * @param {Object} formData - Additional form fields
   * @param {string} fileName - Form field name (default: 'file')
   */
  upload(path, filePath, formData = {}, fileName = 'file') {
    return request('POST', path, {}, {
      isUpload: true,
      filePath,
      formData,
      fileName,
    });
  },

  /**
   * Upload multiple images.
   */
  uploadImages(path, filePaths, formData = {}) {
    const promises = filePaths.map(fp =>
      request('POST', path, {}, {
        isUpload: true,
        filePath: fp,
        formData,
        fileName: 'images',
      })
    );
    return Promise.all(promises);
  },
};
