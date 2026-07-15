const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../../middleware/apiKeyAuth');
const { createValidationError, createNotFoundError } = require('../../middleware/errorHandler');
const { isValidUUID } = require('../../utils/validators');
const Webhook = require('../../models/Webhook');

router.use(apiKeyAuth);

/**
 * POST /openapi/v1/webhooks
 * Register a webhook.
 * Body: { name, url, events: ["rfq.updated", "supplier.quoted"] }
 */
router.post('/webhooks', async (req, res, next) => {
  try {
    const { name, url, events } = req.body;

    if (!url) {
      throw createValidationError('url is required.');
    }

    if (!url.startsWith('https://')) {
      throw createValidationError('Webhook URL must use HTTPS.');
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      throw createValidationError('events must be a non-empty array.');
    }

    const validEvents = ['rfq.created', 'rfq.updated', 'rfq.closed', 'supplier.quoted'];
    const invalidEvents = events.filter(e => !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      throw createValidationError(`Invalid events: ${invalidEvents.join(', ')}. Valid: ${validEvents.join(', ')}`);
    }

    const webhook = await Webhook.create({
      name: name || '',
      url,
      events,
      api_key_hash: req.apiKeyHash,
    });

    res.status(201).json({ success: true, data: webhook });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /openapi/v1/webhooks
 * List webhooks for this API key.
 */
router.get('/webhooks', async (req, res, next) => {
  try {
    const webhooks = await Webhook.listByApiKey(req.apiKeyHash);
    res.json({ success: true, data: webhooks });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /openapi/v1/webhooks/:id
 * Delete a webhook.
 */
router.delete('/webhooks/:id', async (req, res, next) => {
  try {
    if (!isValidUUID(req.params.id)) {
      throw createValidationError('Invalid webhook ID format.');
    }

    const deleted = await Webhook.delete(req.params.id, req.apiKeyHash);
    if (!deleted) {
      throw createNotFoundError('Webhook not found.');
    }

    res.json({ success: true, message: 'Webhook deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
