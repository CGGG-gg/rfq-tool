const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./src/config');
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/requestLogger');
const { ensureDir } = require('./src/utils/fileHelper');

ensureDir(config.upload.imageDir);
ensureDir(config.upload.exportDir);

const app = express();

// --------------- Global middleware ---------------
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --------------- API routes ---------------
const authRoutes = require('./src/routes/auth');
app.use('/api/v1/auth', authRoutes);

const rfqRoutes = require('./src/routes/rfqs');
const supplierRoutes = require('./src/routes/suppliers');
const uploadRoutes = require('./src/routes/uploads');
app.use('/api/v1/rfqs', rfqRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/uploads', uploadRoutes);

const docsRoutes = require('./src/routes/openapi/docs');
app.use('/openapi/v1', docsRoutes);

const openRfqRoutes = require('./src/routes/openapi/rfq');
const webhookRoutes = require('./src/routes/openapi/webhooks');
app.use('/openapi/v1', openRfqRoutes);
app.use('/openapi/v1', webhookRoutes);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'RFQ Tool API is running.', timestamp: new Date().toISOString() });
});

// --------------- Static files (after API routes, only for unmatched GETs) ---------------
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/exports', express.static(path.resolve(__dirname, 'data', 'uploads', 'exports')));

// --------------- Error handler ---------------
app.use(errorHandler);

// --------------- Start ---------------
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`RFQ Tool server on http://localhost:${PORT}`);
  console.log(`  Web UI:  http://localhost:${PORT}/`);
  console.log(`  API:     http://localhost:${PORT}/api/v1`);
  console.log(`  Swagger: http://localhost:${PORT}/openapi/v1/docs`);
});

module.exports = app;
