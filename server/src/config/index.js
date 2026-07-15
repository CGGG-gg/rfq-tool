require('dotenv').config();

module.exports = {
  // Server
  port: parseInt(process.env.PORT) || 3000,

  // Proxy for outbound API calls (needed in China for DeepSeek/Kimi)
  httpProxy: process.env.HTTP_PROXY || '',

  // Dev mode: skips WeChat login, auto-creates dev session
  devMode: process.env.DEV_MODE === 'true',

  // DeepSeek
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  },

  // Kimi (Moonshot)
  kimi: {
    apiKey: process.env.KIMI_API_KEY || '',
    baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1',
    model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
  },

  // MySQL (used by knexfile.js, re-exported for reference)
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'rfq_tool',
  },

  // WeChat
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },

  // External API
  externalApiKey: process.env.EXTERNAL_API_KEY || 'rfq_external_api_key_2026',

  // Upload
  upload: {
    imageDir: 'data/uploads/images',
    exportDir: 'data/uploads/exports',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};
