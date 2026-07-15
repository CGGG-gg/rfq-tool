const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const { apiKeyAuth } = require('../../middleware/apiKeyAuth');
const { createValidationError, createNotFoundError } = require('../../middleware/errorHandler');
const { validateRfqItems, isValidUUID } = require('../../utils/validators');
const { ensureDir, generateFilename } = require('../../utils/fileHelper');
const Rfq = require('../../models/Rfq');
const ApiLog = require('../../models/ApiLog');

// Configure multer for open API image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = ensureDir(config.upload.imageDir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// All routes require API key authentication
router.use(apiKeyAuth);

// Audit logging middleware for Open API
router.use(async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async function (body) {
    try {
      await ApiLog.create({
        api_key_hash: req.apiKeyHash,
        endpoint: req.originalUrl,
        method: req.method,
        ip_address: req.ip,
        request_body: JSON.stringify({
          query: req.query,
          body: req.body,
        }),
        response_code: res.statusCode,
      });
    } catch (e) {
      console.error('Failed to log API call:', e.message);
    }
    return originalJson(body);
  };
  next();
});

/**
 * POST /openapi/v1/rfq/from-image
 * Upload an image and get structured RFQ data back.
 * Does NOT save to database - just returns recognition results.
 */
router.post('/rfq/from-image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw createValidationError('No image file provided.');
    }

    const filePath = path.resolve(ensureDir(config.upload.imageDir), req.file.filename);

    const recognitionService = require('../../services/recognitionService');
    const result = await recognitionService.recognizeFromImage(filePath);

    // Clean up the temp file after recognition
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /openapi/v1/rfqs
 * Create an RFQ programmatically.
 * Body: { title, notes, items: [...] }
 */
router.post('/rfqs', async (req, res, next) => {
  try {
    const { title, notes, items } = req.body;

    if (!title || !title.trim()) {
      throw createValidationError('title is required.');
    }

    if (items) {
      const validation = validateRfqItems(items);
      if (!validation.valid) {
        throw createValidationError('Invalid items.', validation.errors);
      }
    }

    const rfq = await Rfq.create({ title: title.trim(), notes, items: items || [] });
    res.status(201).json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /openapi/v1/rfqs
 * List RFQs.
 */
router.get('/rfqs', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, q } = req.query;
    const { parsePagination } = require('../../utils/pagination');
    const { page: p, limit: l } = parsePagination({ page, limit });

    const result = await Rfq.list({ page: p, limit: l, status, q });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /openapi/v1/rfqs/:id
 * Get RFQ detail with items and supplier responses.
 */
router.get('/rfqs/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      throw createNotFoundError('RFQ not found.');
    }

    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
