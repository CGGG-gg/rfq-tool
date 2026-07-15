const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/requestLogger');
const { ensureDir } = require('./src/utils/fileHelper');

// Ensure upload directories exist
ensureDir(config.upload.imageDir);
ensureDir(config.upload.exportDir);

const app = express();

// --------------- Global middleware ---------------
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --------------- Static (for exports only) ---------------
app.use('/exports', express.static(path.resolve(__dirname, 'data', 'uploads', 'exports')));

// --------------- Routes ---------------

// Auth routes (no auth middleware for login)
const authRoutes = require('./src/routes/auth');
app.use('/api/v1/auth', authRoutes);

// Internal API routes (will use auth middleware after Phase 6)
const rfqRoutes = require('./src/routes/rfqs');
const supplierRoutes = require('./src/routes/suppliers');
const uploadRoutes = require('./src/routes/uploads');
app.use('/api/v1/rfqs', rfqRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Open API docs (no auth required)
const docsRoutes = require('./src/routes/openapi/docs');
app.use('/openapi/v1', docsRoutes);

// Open API routes (uses apiKeyAuth middleware)
const openRfqRoutes = require('./src/routes/openapi/rfq');
const webhookRoutes = require('./src/routes/openapi/webhooks');
app.use('/openapi/v1', openRfqRoutes);
app.use('/openapi/v1', webhookRoutes);

// --------------- Home ---------------
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>RFQ Tool</title>
<style>body{font-family:-apple-system,sans-serif;max-width:600px;margin:60px auto;padding:20px;color:#333}
a{color:#1989fa;text-decoration:none}h1{font-size:24px}.card{background:#f7f8fa;border-radius:8px;padding:16px;margin:12px 0}
</style></head>
<body>
<h1>🚀 RFQ Tool — 图片转询价单</h1>
<p>服务运行中</p>
<div class="card"><strong>内部 API</strong><br><a href="/api/v1/rfqs">/api/v1/rfqs</a> · <a href="/api/v1/suppliers">/api/v1/suppliers</a></div>
<div class="card"><strong>开放 API</strong><br><a href="/openapi/v1/docs">Swagger 文档</a> · <a href="/openapi/v1/docs.json">OpenAPI JSON</a></div>
<div class="card"><strong>其他</strong><br><a href="/health">健康检查</a></div>
</body></html>`);
});

// --------------- Health check ---------------
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'RFQ Tool API is running.', timestamp: new Date().toISOString() });
});

// --------------- Error handler (must be last) ---------------
app.use(errorHandler);

// --------------- Start server ---------------
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 RFQ Tool server running on http://localhost:${PORT}`);
  console.log(`   Internal API: http://localhost:${PORT}/api/v1`);
  console.log(`   Open API:     http://localhost:${PORT}/openapi/v1`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
