const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config');
const Rfq = require('../models/Rfq');
const RfqItem = require('../models/RfqItem');
const RfqImage = require('../models/RfqImage');
const RfqSupplier = require('../models/RfqSupplier');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { createValidationError, createNotFoundError } = require('../middleware/errorHandler');
const { isValidUUID, isValidRfqStatus, validateRfqItems } = require('../utils/validators');
const { generateFilename, ensureDir } = require('../utils/fileHelper');

// Multer for image upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => { cb(null, ensureDir(config.upload.imageDir)); },
    filename: (req, file, cb) => { cb(null, generateFilename(file.originalname)); },
  }),
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  },
  limits: { fileSize: config.upload.maxFileSize, files: 5 },
});

// ==================== RFQ Images & Recognition ====================

router.post('/:id/images', upload.array('images', 5), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw createValidationError('Invalid RFQ ID.');
    if (!req.files || !req.files.length) throw createValidationError('No image files.');
    const images = await Promise.all(req.files.map(f => RfqImage.create({
      rfq_id: req.params.id, filename: f.filename, original_name: f.originalname,
      mime_type: f.mimetype, file_size: f.size, file_path: `${config.upload.imageDir}/${f.filename}`,
    })));
    res.status(201).json({ success: true, data: images });
  } catch (err) { next(err); }
});

router.get('/:id/images', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw createValidationError('Invalid RFQ ID.');
    res.json({ success: true, data: await RfqImage.getByRfqId(req.params.id) });
  } catch (err) { next(err); }
});

router.delete('/:id/images/:imageId', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.imageId)) throw createValidationError('Invalid image ID.');
    const image = await RfqImage.delete(req.params.imageId);
    if (!image) throw createNotFoundError('Image not found.');
    const { deleteFile } = require('../utils/fileHelper');
    deleteFile(image.file_path);
    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) { next(err); }
});

router.post('/:id/recognize', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) throw createValidationError('Invalid RFQ ID.');
    const recognitionService = require('../services/recognitionService');
    const result = await recognitionService.recognizeRfqImages(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ==================== RFQ CRUD ====================

/**
 * GET /api/v1/rfqs
 * List RFQs with pagination, search, and status filter.
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { status, q } = req.query;

    if (status && !isValidRfqStatus(status)) {
      throw createValidationError('Invalid status value.');
    }

    const result = await Rfq.list({ page, limit, status, q });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rfqs
 * Create a new RFQ manually.
 * Body: { title, notes, items: [{ product_name, specification, quantity, unit, target_price, delivery_date, remarks }] }
 */
router.post('/', async (req, res, next) => {
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

    const rfq = await Rfq.create({ title: title.trim(), notes, items });
    res.status(201).json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rfqs/:id
 * Get RFQ detail with items, suppliers, and images.
 */
router.get('/:id', async (req, res, next) => {
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

/**
 * PUT /api/v1/rfqs/:id
 * Update RFQ header fields.
 * Body: { title, notes, status }
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const { title, notes, status } = req.body;
    if (status && !isValidRfqStatus(status)) {
      throw createValidationError('Invalid status value.');
    }

    const rfq = await Rfq.update(req.params.id, { title, notes, status });
    if (!rfq) {
      throw createNotFoundError('RFQ not found.');
    }

    res.json({ success: true, data: rfq });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/rfqs/:id
 * Delete an RFQ.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const deleted = await Rfq.delete(req.params.id);
    if (!deleted) {
      throw createNotFoundError('RFQ not found.');
    }

    res.json({ success: true, message: 'RFQ deleted.' });
  } catch (err) {
    next(err);
  }
});

// ==================== RFQ Items ====================

/**
 * POST /api/v1/rfqs/:id/items
 * Add a line item to an RFQ.
 */
router.post('/:id/items', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      throw createNotFoundError('RFQ not found.');
    }

    const item = await RfqItem.create(req.params.id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rfqs/:id/items/bulk
 * Add multiple line items at once.
 */
router.post('/:id/items/bulk', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      throw createNotFoundError('RFQ not found.');
    }

    const validation = validateRfqItems(req.body.items || []);
    if (!validation.valid) {
      throw createValidationError('Invalid items.', validation.errors);
    }

    const items = await RfqItem.bulkCreate(req.params.id, req.body.items);
    res.status(201).json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/rfqs/:id/items/:itemId
 * Update a line item.
 */
router.put('/:id/items/:itemId', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id) || !isValidUUID(req.params.itemId)) {
      throw createValidationError('Invalid ID format.');
    }

    const item = await RfqItem.update(req.params.itemId, req.body);
    if (!item) {
      throw createNotFoundError('Item not found.');
    }

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/rfqs/:id/items/:itemId
 * Delete a line item.
 */
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id) || !isValidUUID(req.params.itemId)) {
      throw createValidationError('Invalid ID format.');
    }

    const deleted = await RfqItem.delete(req.params.itemId);
    if (!deleted) {
      throw createNotFoundError('Item not found.');
    }

    res.json({ success: true, message: 'Item deleted.' });
  } catch (err) {
    next(err);
  }
});

// ==================== RFQ Actions ====================

/**
 * POST /api/v1/rfqs/:id/send
 * Send RFQ to suppliers.
 * Body: { supplier_ids: ["uuid1", "uuid2"] }
 */
router.post('/:id/send', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const { supplier_ids } = req.body;
    if (!Array.isArray(supplier_ids) || supplier_ids.length === 0) {
      throw createValidationError('supplier_ids must be a non-empty array.');
    }

    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      throw createNotFoundError('RFQ not found.');
    }

    const result = await RfqSupplier.sendToSuppliers(req.params.id, supplier_ids);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rfqs/:id/close
 * Close an RFQ.
 */
router.post('/:id/close', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const rfq = await Rfq.findById(req.params.id);
    if (!rfq) {
      throw createNotFoundError('RFQ not found.');
    }

    await RfqSupplier.closeRfq(req.params.id);
    res.json({ success: true, message: 'RFQ closed.' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rfqs/:id/suppliers/:supplierId/quote
 * Record a supplier's quote.
 */
router.post('/:id/suppliers/:supplierId/quote', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id) || !isValidUUID(req.params.supplierId)) {
      throw createValidationError('Invalid ID format.');
    }

    const { quote_amount, quote_notes } = req.body;
    const result = await RfqSupplier.recordResponse(
      req.params.id,
      req.params.supplierId,
      { quote_amount, quote_notes }
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ==================== Export (stubs for now, filled in Phase 4) ====================

/**
 * GET /api/v1/rfqs/:id/export/excel
 */
router.get('/:id/export/excel', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }
    const excelService = require('../services/excelService');
    const filePath = await excelService.exportRfq(req.params.id);
    res.download(filePath);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rfqs/:id/export/pdf
 */
router.get('/:id/export/pdf', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }
    const pdfService = require('../services/pdfService');
    const filePath = await pdfService.exportRfq(req.params.id);
    res.download(filePath);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
