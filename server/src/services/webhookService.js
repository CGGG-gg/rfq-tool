const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const Webhook = require('../models/Webhook');

/**
 * Fire a webhook event to all registered webhooks subscribed to this event type.
 * This is fire-and-forget: failures are logged but don't affect the API response.
 *
 * @param {string} event - Event type (e.g., 'rfq.updated', 'supplier.quoted')
 * @param {Object} payload - Data to send
 */
async function fireEvent(event, payload) {
  try {
    const webhooks = await Webhook.listActiveByEvent(event);

    if (webhooks.length === 0) return;

    const apiKey = config.externalApiKey;
    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', apiKey)
      .update(body)
      .digest('hex');

    // Fire all webhooks concurrently (non-blocking)
    webhooks.forEach(webhook => {
      deliverWebhook(webhook, body, signature);
    });
  } catch (err) {
    console.error(`[Webhook] Failed to fire event "${event}":`, err.message);
  }
}

/**
 * Deliver payload to a single webhook URL with retries.
 */
async function deliverWebhook(webhook, body, signature, attempt = 1) {
  const maxRetries = 3;
  const delays = [1000, 5000, 25000]; // exponential backoff

  try {
    await axios.post(webhook.url, JSON.parse(body), {
      headers: {
        'Content-Type': 'application/json',
        'X-RFQ-Event': body.event,
        'X-RFQ-Signature': signature,
        'X-RFQ-Delivery-Id': webhook.id,
      },
      timeout: 10000,
    });

    console.log(`[Webhook] Delivered to ${webhook.url} (event: ${JSON.parse(body).event})`);
  } catch (err) {
    console.error(`[Webhook] Delivery failed (attempt ${attempt}/${maxRetries}): ${webhook.url} - ${err.message}`);

    if (attempt < maxRetries) {
      setTimeout(() => {
        deliverWebhook(webhook, body, signature, attempt + 1);
      }, delays[attempt - 1]);
    } else {
      console.error(`[Webhook] Gave up on ${webhook.url} after ${maxRetries} attempts.`);
      // Deactivate webhook after repeated failures
      await Webhook.deactivate(webhook.id);
    }
  }
}

/**
 * Build a standard webhook payload.
 */
function buildPayload(event, data) {
  return {
    event,
    timestamp: new Date().toISOString(),
    data,
  };
}

module.exports = { fireEvent, buildPayload };
