const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { parsePagination } = require('../utils/pagination');
const { createValidationError, createNotFoundError } = require('../middleware/errorHandler');
const { isValidUUID, isValidEmail } = require('../utils/validators');

/**
 * GET /api/v1/suppliers
 * List suppliers with pagination and search.
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const { q, category } = req.query;

    const result = await Supplier.list({ page, limit, q, category });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/suppliers
 * Create a new supplier.
 * Body: { name, contact_person, phone, email, address, categories: [], notes }
 */
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      throw createValidationError('name is required.');
    }

    if (req.body.email && !isValidEmail(req.body.email)) {
      throw createValidationError('Invalid email format.');
    }

    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/suppliers/:id
 * Get supplier detail with associated RFQs.
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid supplier ID format.');
    }

    const supplier = await Supplier.findByIdWithRfqs(req.params.id);
    if (!supplier) {
      throw createNotFoundError('Supplier not found.');
    }

    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/suppliers/:id
 * Update a supplier.
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid supplier ID format.');
    }

    if (req.body.email && !isValidEmail(req.body.email)) {
      throw createValidationError('Invalid email format.');
    }

    const supplier = await Supplier.update(req.params.id, req.body);
    if (!supplier) {
      throw createNotFoundError('Supplier not found.');
    }

    res.json({ success: true, data: supplier });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/suppliers/:id
 * Delete a supplier.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid supplier ID format.');
    }

    const deleted = await Supplier.delete(req.params.id);
    if (!deleted) {
      throw createNotFoundError('Supplier not found.');
    }

    res.json({ success: true, message: 'Supplier deleted.' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/suppliers/:id/rfqs
 * Get RFQs associated with a supplier.
 */
router.get('/:id/rfqs', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid supplier ID format.');
    }

    const supplier = await Supplier.findByIdWithRfqs(req.params.id);
    if (!supplier) {
      throw createNotFoundError('Supplier not found.');
    }

    res.json({ success: true, data: supplier.rfqs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
