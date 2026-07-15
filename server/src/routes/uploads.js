const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config');
const RfqImage = require('../models/RfqImage');
const { generateFilename, ensureDir } = require('../utils/fileHelper');
const { createValidationError, createNotFoundError } = require('../middleware/errorHandler');
const { isValidUUID } = require('../utils/validators');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = ensureDir(config.upload.imageDir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 5,
  },
});

/**
 * POST /api/v1/uploads
 * Upload one or more images. RFQ association is optional.
 * Form data: images (file), rfq_id (optional)
 */
router.post('/', upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw createValidationError('No image files provided.');
    }

    const rfq_id = req.body.rfq_id || null;
    if (rfq_id && !isValidUUID(rfq_id)) {
      throw createValidationError('Invalid rfq_id format.');
    }

    const images = await Promise.all(
      req.files.map(file =>
        RfqImage.create({
          rfq_id,
          filename: file.filename,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          file_path: `${config.upload.imageDir}/${file.filename}`,
        })
      )
    );

    res.status(201).json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rfqs/:id/images
 * Upload images for a specific RFQ.
 */
router.post('/:id/images', upload.array('images', 5), async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    if (!req.files || req.files.length === 0) {
      throw createValidationError('No image files provided.');
    }

    const images = await Promise.all(
      req.files.map(file =>
        RfqImage.create({
          rfq_id: req.params.id,
          filename: file.filename,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          file_path: `${config.upload.imageDir}/${file.filename}`,
        })
      )
    );

    res.status(201).json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/rfqs/:id/images/:imageId
 * Delete an image.
 */
router.delete('/:id/images/:imageId', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.imageId)) {
      throw createValidationError('Invalid image ID format.');
    }

    const image = await RfqImage.delete(req.params.imageId);
    if (!image) {
      throw createNotFoundError('Image not found.');
    }

    // Delete the physical file
    const { deleteFile } = require('../utils/fileHelper');
    deleteFile(image.file_path);

    res.json({ success: true, message: 'Image deleted.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/rfqs/:id/images
 * List images for an RFQ.
 */
router.get('/:id/images', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const images = await RfqImage.getByRfqId(req.params.id);
    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/rfqs/:id/recognize
 * Trigger AI/OCR recognition on uploaded images for this RFQ.
 */
router.post('/:id/recognize', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid RFQ ID format.');
    }

    const recognitionService = require('../services/recognitionService');
    const result = await recognitionService.recognizeRfqImages(req.params.id);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
