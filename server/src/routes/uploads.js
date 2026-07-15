const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config');
const RfqImage = require('../models/RfqImage');
const { generateFilename, ensureDir } = require('../utils/fileHelper');
const { createValidationError } = require('../middleware/errorHandler');
const { isValidUUID } = require('../utils/validators');

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

/**
 * POST /api/v1/uploads
 * Generic image upload. Optional rfq_id to associate with an RFQ.
 */
router.post('/', upload.array('images', 5), async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) throw createValidationError('No image files.');
    const rfq_id = (req.body.rfq_id && isValidUUID(req.body.rfq_id)) ? req.body.rfq_id : null;
    const images = await Promise.all(req.files.map(f => RfqImage.create({
      rfq_id, filename: f.filename, original_name: f.originalname,
      mime_type: f.mimetype, file_size: f.size, file_path: `${config.upload.imageDir}/${f.filename}`,
    })));
    res.status(201).json({ success: true, data: images });
  } catch (err) { next(err); }
});

module.exports = router;
