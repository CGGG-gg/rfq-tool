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

// Force UTF-8 on all JSON/text responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const origJson = res.json.bind(res);
  res.json = function (body) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return origJson(body);
  };
  const origSend = res.send.bind(res);
  res.send = function (body) {
    if (typeof body === 'string' && !res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    return origSend(body);
  };
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --------------- Static web UI (serves index.html at /) ---------------
app.use(express.static(path.resolve(__dirname, 'public')));

// --------------- Static (for exports only) ---------------
app.use('/exports', express.static(path.resolve(__dirname, 'data', 'uploads', 'exports')));

// --------------- Routes ---------------

// Auth routes (no auth middleware for login)
const authRoutes = require('./src/routes/auth');
app.use('/api/v1/auth', authRoutes);

// Internal API routes
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

// --------------- Health check ---------------
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'RFQ Tool API is running.', timestamp: new Date().toISOString() });
});

// --------------- Error handler (must be last) ---------------
app.use(errorHandler);

// --------------- Start server ---------------
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`RFQ Tool server running on http://localhost:${PORT}`);
  console.log(`  Web UI:       http://localhost:${PORT}/`);
  console.log(`  Internal API: http://localhost:${PORT}/api/v1`);
  console.log(`  Open API:     http://localhost:${PORT}/openapi/v1`);
});

module.exports = app;
